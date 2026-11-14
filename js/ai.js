// Leitura do parecer: Gemini (Google) ou OCR no próprio celular.
import { novoCanvas, paraBlob } from './scan.js';

const API = 'https://generativelanguage.googleapis.com/v1beta';

async function blobBase64(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

// Parte que vai para a IA: só o topo do parecer (cabeçalho), quando ativado.
export function recorteParaIA(canvas, soTopo) {
  const fracao = soTopo ? 0.5 : 1;
  const sh = Math.round(canvas.height * fracao);
  const k = Math.min(1, 1200 / canvas.width);
  const c = novoCanvas(canvas.width * k, sh * k);
  c.getContext('2d').drawImage(canvas, 0, 0, canvas.width, sh, 0, 0, c.width, c.height);
  return c;
}

export async function escolherModelo(chave) {
  return (await modelosDisponiveis(chave))[0];
}

// Modelos em ordem de preferência: Flash-Lite (rápido) primeiro, depois Flash.
export async function modelosDisponiveis(chave) {
  const r = await fetch(`${API}/models?pageSize=200`, { headers: { 'x-goog-api-key': chave } });
  if (!r.ok) throw new Error(await mensagemErro(r));
  const { models = [] } = await r.json();
  const nomes = models
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace('models/', ''));
  const versao = n => parseFloat(n.split('-')[1]) || 0;
  const porVersao = re => nomes.filter(n => re.test(n)).sort((a, b) => versao(b) - versao(a));
  const ordem = [
    ...nomes.filter(n => n === 'gemini-flash-lite-latest'),
    ...porVersao(/^gemini-\d+(\.\d+)?-flash-lite$/),
    ...nomes.filter(n => n === 'gemini-flash-latest'),
    ...porVersao(/^gemini-\d+(\.\d+)?-flash$/),
  ];
  const lista = [...new Set(ordem)];
  if (!lista.length) {
    const qualquer = nomes.find(n => n.includes('flash') && !/(image|tts|audio|live|embed)/.test(n));
    if (qualquer) lista.push(qualquer);
  }
  if (!lista.length) throw new Error('Nenhum modelo Gemini disponível para esta chave.');
  return lista.slice(0, 5);
}

async function mensagemErro(r) {
  try {
    const j = await r.json();
    const m = j.error?.message || '';
    if (r.status === 400 && /API key/i.test(m)) return 'Chave do Gemini inválida. Confira em Configurações.';
    if (r.status === 429) return 'Limite de uso do Gemini atingido. Tente de novo em instantes.';
    if (r.status === 503 || /high demand|overloaded|unavailable/i.test(m)) return 'O Gemini está sobrecarregado agora. Toque em "Ler de novo" daqui a pouco ou preencha à mão.';
    return `Gemini: ${m || r.status}`;
  } catch { return `Gemini: erro ${r.status}`; }
}

const ESQUEMA = {
  type: 'OBJECT',
  properties: {
    de_cabeca_para_baixo: { type: 'BOOLEAN', description: 'true se o texto da imagem está de cabeça para baixo' },
    paciente: { type: 'STRING', description: 'Nome completo do paciente, em maiúsculas' },
    especialidade_lida: { type: 'STRING', description: 'Texto exato do campo PARA (especialidade/exame solicitado)' },
    especialidade: { type: 'STRING', description: 'Opção da lista de especialidades que corresponde ao campo PARA, copiada exatamente; vazio se nenhuma serve' },
    setor_lido: { type: 'STRING', description: 'Texto do campo DE / SETOR / LEITO de onde vem o pedido' },
    bloco: { type: 'STRING', description: 'Opção da lista de blocos que corresponde ao setor do paciente, copiada exatamente; vazio se nenhuma serve' },
    leito: { type: 'STRING', description: 'Número do leito ou box, só o número/código (ex: 16, 301-2)' },
  },
  required: ['de_cabeca_para_baixo', 'paciente', 'especialidade_lida', 'especialidade', 'setor_lido', 'bloco', 'leito'],
};

const esperar = ms => new Promise(r => setTimeout(r, ms));
const sobrecarga = e => [429, 500, 503, 504].includes(e.status);

// Tenta o modelo salvo; se o Google estiver sobrecarregado, espera e tenta de novo,
// depois passa para os outros modelos disponíveis.
export async function lerComGemini(canvas, cfg, aoTentar) {
  if (!cfg.chave) throw new Error('Coloque a chave do Gemini em Configurações.');
  let candidatos = cfg.modelo ? [cfg.modelo] : [];
  let listaCarregada = false;
  let ultimoErro;
  for (let i = 0; i < 6; i++) {
    if (!candidatos.length) {
      if (listaCarregada) break;
      candidatos = await modelosDisponiveis(cfg.chave);
      listaCarregada = true;
      if (cfg.modelo) candidatos = candidatos.filter(m => m !== cfg.modelo);
      if (!candidatos.length) break;
    }
    const modelo = candidatos[0];
    try {
      return await lerUmaVez(canvas, cfg, modelo);
    } catch (e) {
      ultimoErro = e;
      if (e.status === 404) { candidatos.shift(); continue; }       // modelo saiu do ar
      if (!sobrecarga(e)) throw e;
      if (!e.repetido) {                                           // 1ª falha: espera e repete
        e.repetido = true; aoTentar?.(`Gemini ocupado, tentando de novo…`);
        await esperar(1500);
        try { return await lerUmaVez(canvas, cfg, modelo); } catch (e2) { ultimoErro = e2; if (!sobrecarga(e2)) throw e2; }
      }
      candidatos.shift();
      aoTentar?.('Gemini ocupado, tentando outro modelo…');
    }
  }
  throw ultimoErro || new Error('Não consegui ler agora.');
}

async function lerUmaVez(canvas, cfg, modelo) {

  const img = recorteParaIA(canvas, cfg.soTopo);
  const b64 = await blobBase64(await paraBlob(img, 0.8));
  const prompt =
`Esta é a imagem (ou a parte de cima) de um PEDIDO DE PARECER médico de um hospital (Hospital Geral de Roraima).
Extraia os dados do cabeçalho. Responda só com o JSON pedido.
- paciente: campo NOME.
- especialidade_lida: campo PARA (especialidade ou exame pedido). Pode estar num quadro "PARA:" ao lado de "DE:" e "BOX", no cabeçalho, ou na frase "solicito parecer da/de ...". Se houver qualquer especialidade ou exame escrito, nunca deixe vazio.
- especialidade: escolha da LISTA DE ESPECIALIDADES a opção equivalente ao campo PARA e copie o texto exatamente como está na lista. Exemplos: "Neuro" = NEUROLOGIA; Cardiologia tem duas opções: se o pedido fala em risco cirúrgico ou pré-operatório use CARDIOLOGIA RISCO, senão use CARDIOLOGIA PARECER; "Ortopedia" = ORTOPEDIA E TRAUMATOLOGIA. Se nada servir, deixe vazio.
- setor_lido: campo DE, SETOR ou o texto ao lado de LEITO (ex: "UTI 3", "SUTURA", "BLOCO B").
- bloco: escolha da LISTA DE BLOCOS a opção equivalente ao setor e copie exatamente. Se nada servir, deixe vazio.
- leito: número do LEITO ou BOX.
- de_cabeca_para_baixo: true se a imagem está de cabeça para baixo.

LISTA DE ESPECIALIDADES:
${cfg.especialidades.join('\n')}

LISTA DE BLOCOS:
${cfg.blocos.join('\n')}`;

  const corpo = {
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: b64 } }] }],
    generationConfig: {
      temperature: 0, responseMimeType: 'application/json', responseSchema: ESQUEMA,
      thinkingConfig: { thinkingLevel: 'minimal' }, // responde rápido, sem raciocínio longo
    },
  };
  const enviar = () => fetch(`${API}/models/${modelo}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.chave },
    body: JSON.stringify(corpo),
  });
  let r = await enviar();
  if (r.status === 400) {
    // modelo que não aceita o nível de raciocínio: tenta sem ele
    const txt = await r.clone().text();
    if (/thinking/i.test(txt)) { delete corpo.generationConfig.thinkingConfig; r = await enviar(); }
  }
  if (!r.ok) { const e = new Error(await mensagemErro(r)); e.status = r.status; throw e; }
  const j = await r.json();
  const txt = j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '{}';
  const dados = JSON.parse(txt);
  dados._modelo = modelo;
  return dados;
}

// ---------- Modo sem IA: OCR no próprio celular (Tesseract) ----------
let tesseract;
async function carregarTesseract() {
  if (tesseract) return tesseract;
  await new Promise((ok, erro) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = ok; s.onerror = () => erro(new Error('Sem internet para baixar o leitor offline (só na 1ª vez).'));
    document.head.appendChild(s);
  });
  tesseract = await window.Tesseract.createWorker('por');
  return tesseract;
}

export async function lerNoCelular(canvas) {
  const w = await carregarTesseract();
  const img = recorteParaIA(canvas, true);
  const { data } = await w.recognize(img);
  return extrairDoTexto(data.text || '');
}

export function extrairDoTexto(texto) {
  const t = texto.replace(/[ \t]+/g, ' ');
  const pega = re => (t.match(re)?.[1] || '').trim();
  const paciente = pega(/NOME\s*:?\s*([A-ZÀ-Ú ]{5,})/i);
  const para = pega(/PARA\s*:?\s*([A-ZÀ-Ú0-9 \-]{3,})/i);
  const leito = pega(/(?:LEITO|BOX)\s*:?\s*([0-9]{1,4}(?:-[0-9])?)/i);
  const setor = pega(/(?:SETOR|DE)\s*:?\s*([A-ZÀ-Ú0-9 ]{3,})/i) || pega(/LEITO\s*:?\s*[0-9\-]+\s*\(([^)]+)\)/i);
  return {
    de_cabeca_para_baixo: false,
    paciente: paciente.split('\n')[0],
    especialidade_lida: para.split('\n')[0],
    especialidade: '',
    setor_lido: setor.split('\n')[0],
    bloco: '',
    leito,
  };
}
