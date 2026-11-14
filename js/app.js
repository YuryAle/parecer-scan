import * as db from './db.js';
import * as scan from './scan.js';
import { lerComGemini, lerNoCelular, escolherModelo } from './ai.js';
import { jpegParaPdf } from './pdf.js';
import { ESPECIALIDADES_PADRAO, BLOCOS_PADRAO, HOSPITAIS_PADRAO, VERSAO_LISTAS, melhorOpcao, normalizar, textoParaLista } from './lists.js';

// ================= Configurações =================
const PADRAO = {
  colaborador: '',
  hospital: '',
  tipo: 'PARECER',
  chave: '',
  modelo: '',
  modoLeitura: 'gemini',  // gemini | celular | manual
  soTopo: true,
  formatoEnvio: 'pdf',    // pdf | imagem
  limpezaDias: 0,
  especialidades: ESPECIALIDADES_PADRAO,
  blocos: BLOCOS_PADRAO,
  hospitais: HOSPITAIS_PADRAO,
};
let cfg = { ...PADRAO, ...JSON.parse(localStorage.getItem('cfg') || '{}') };
const salvarCfg = () => localStorage.setItem('cfg', JSON.stringify(cfg));
if ((cfg.versaoListas || 1) < VERSAO_LISTAS) {
  // listas padrão novas (vindas da planilha) substituem as antigas
  cfg.especialidades = ESPECIALIDADES_PADRAO;
  cfg.versaoListas = VERSAO_LISTAS;
  salvarCfg();
}

// ================= Utilidades =================
const $ = s => document.querySelector(s);
const tela = $('#tela');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dois = n => String(n).padStart(2, '0');
const dataBR = d => `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`;
const horaBR = d => `${dois(d.getHours())}:${dois(d.getMinutes())}:${dois(d.getSeconds())}`;
let urls = [];
const urlDe = blob => { const u = URL.createObjectURL(blob); urls.push(u); return u; };
const liberarUrls = () => { urls.forEach(URL.revokeObjectURL); urls = []; };

let tempoAviso;
function aviso(msg, ms = 2600) {
  const a = $('#aviso');
  a.textContent = msg; a.classList.add('mostra');
  clearTimeout(tempoAviso); tempoAviso = setTimeout(() => a.classList.remove('mostra'), ms);
}

const COLUNAS = ['DATA', 'HORA', 'PACIENTE', 'HOSPITAL', 'BLOCO', 'LEITO', 'ESPECIALIDADE', 'MÉDICO', 'TIPO', 'COLABORADOR'];
const linhaPlanilha = p => [p.data, p.hora, p.paciente, p.hospital, p.bloco, p.leito, p.especialidade, p.medico, p.tipo, p.colaborador]
  .map(v => String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim());

const nomePasta = p => p.especialidade || 'SEM ESPECIALIDADE';

// ================= Navegação =================
let pilha = []; // telas internas para o botão voltar
let abaAtual = 'escanear';

function titulo(t, podeVoltar = false) {
  $('#titulo').textContent = t;
  $('#voltar').hidden = !podeVoltar;
}

function irAba(aba) {
  abaAtual = aba; pilha = [];
  document.querySelectorAll('.abas button').forEach(b => b.classList.toggle('ativa', b.dataset.aba === aba));
  liberarUrls();
  ({ escanear: telaInicio, planilha: telaPlanilha, pastas: telaPastas, config: telaConfig })[aba]();
  tela.scrollTop = 0;
}

function abrir(fn, ...args) {
  pilha.push(() => fn(...args));
  liberarUrls();
  fn(...args);
  tela.scrollTop = 0;
}

function voltar() {
  pilha.pop();
  const anterior = pilha[pilha.length - 1];
  liberarUrls();
  if (anterior) anterior(); else irAba(abaAtual);
}

document.querySelectorAll('.abas button').forEach(b => b.onclick = () => irAba(b.dataset.aba));
$('#voltar').onclick = voltar;

// ================= Tela inicial / Escanear =================
async function telaInicio() {
  titulo('Parecer Scan');
  const todos = await db.listar();
  const hoje = dataBR(new Date());
  const deHoje = todos.filter(p => p.data === hoje);
  const pendentes = todos.filter(p => !p.copiado).length;
  const falta = [];
  if (!cfg.colaborador) falta.push('seu nome (colaborador)');
  if (cfg.modoLeitura === 'gemini' && !cfg.chave) falta.push('a chave do Gemini');

  tela.innerHTML = `
    ${falta.length ? `<div class="cartao" style="border-left:4px solid var(--amarelo)">
      <b>Falta configurar:</b> ${falta.join(' e ')}.<br>
      <button class="btn sec" style="margin-top:8px" data-ir="config">Abrir ajustes</button></div>` : ''}
    <button class="btn grande cheio" id="tirar">📷 Tirar foto do parecer</button>
    <div class="linha-btns" style="margin:10px 0 16px">
      <button class="btn sec" id="da-galeria">🖼️ Escolher da galeria</button>
    </div>
    <div class="cartao">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h2 style="margin:0">Hoje (${hoje})</h2><span class="contador">${deHoje.length}</span>
      </div>
      <div class="suave" style="margin-top:4px">${pendentes} linha(s) ainda não copiada(s) para a planilha.</div>
    </div>
    <ul class="lista" id="recentes"></ul>`;
  $('#tirar').onclick = () => $('#camera').click();
  $('#da-galeria').onclick = () => $('#galeria').click();
  tela.querySelector('[data-ir]')?.addEventListener('click', () => irAba('config'));
  desenharItens($('#recentes'), deHoje.slice(0, 15));
}

function desenharItens(ul, itens) {
  ul.innerHTML = itens.map(p => `
    <li class="item" data-id="${p.id}">
      <img src="${p.thumb ? urlDe(p.thumb) : ''}" alt="">
      <div class="info">
        <b>${esc(p.paciente || '(sem nome)')}</b>
        <div class="suave pequeno">${esc(p.especialidade || '—')}</div>
        <div class="suave pequeno">${esc(p.data)} ${esc(p.hora.slice(0, 5))} · ${esc(p.bloco || '')} ${p.leito ? 'Leito ' + esc(p.leito) : ''}</div>
      </div>
      ${p.copiado ? '<span class="selo">copiado</span>' : '<span class="selo pend">pendente</span>'}
    </li>`).join('');
  ul.querySelectorAll('.item').forEach(li => li.onclick = () => abrir(telaDetalhe, li.dataset.id));
}

// ---------- Fluxo da foto ----------
const fluxo = {};

for (const id of ['#camera', '#galeria']) {
  $(id).addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    tela.innerHTML = '<div class="vazio-grande"><div><span class="carregando"></span></div>Abrindo foto…</div>';
    try {
      fluxo.fonte = await scan.carregarImagem(f);
      fluxo.cantos = scan.detectarCantos(fluxo.fonte);
      fluxo.horaFoto = new Date();
      abrir(telaRecorte);
    } catch (err) {
      console.error(err); aviso('Não consegui abrir a foto.'); irAba('escanear');
    }
  });
}

function telaRecorte() {
  titulo('Ajustar bordas', true);
  tela.innerHTML = `
    <p class="suave" style="margin-top:0">Arraste os cantos azuis até as pontas do papel.</p>
    <div class="recorte" id="rec"><canvas id="rc"></canvas><svg id="rs"></svg></div>
    <div class="linha-btns" style="margin-top:12px">
      <button class="btn sec" id="tudo">Foto inteira</button>
      <button class="btn sec" id="auto">Detectar</button>
    </div>
    <button class="btn cheio" style="margin-top:10px" id="ok">Continuar ✓</button>`;
  const caixa = $('#rec'), cv = $('#rc'), svg = $('#rs');
  const F = fluxo.fonte;
  const k = Math.min(1, 1000 / Math.max(F.width, F.height));
  cv.width = F.width * k; cv.height = F.height * k;
  cv.getContext('2d').drawImage(F, 0, 0, cv.width, cv.height);
  const maxAlt = window.innerHeight * 0.62;
  caixa.style.maxWidth = Math.min(caixa.parentElement.clientWidth, maxAlt * F.width / F.height) + 'px';
  svg.setAttribute('viewBox', `0 0 ${F.width} ${F.height}`);

  const alcas = fluxo.cantos.map((_, i) => {
    const a = document.createElement('div'); a.className = 'alca'; caixa.appendChild(a);
    a.addEventListener('pointerdown', ev => {
      a.setPointerCapture(ev.pointerId);
      const mover = e2 => {
        const r = caixa.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e2.clientX - r.left) / r.width)) * F.width;
        const y = Math.max(0, Math.min(1, (e2.clientY - r.top) / r.height)) * F.height;
        fluxo.cantos[i] = { x, y }; desenhar();
      };
      const soltar = () => { a.removeEventListener('pointermove', mover); a.removeEventListener('pointerup', soltar); };
      a.addEventListener('pointermove', mover); a.addEventListener('pointerup', soltar);
    });
    return a;
  });
  function desenhar() {
    fluxo.cantos.forEach((c, i) => { alcas[i].style.left = (c.x / F.width * 100) + '%'; alcas[i].style.top = (c.y / F.height * 100) + '%'; });
    const pts = fluxo.cantos.map(c => `${c.x},${c.y}`).join(' ');
    const sw = Math.max(F.width, F.height) / 250;
    svg.innerHTML = `<polygon points="${pts}" fill="rgba(47,91,211,.12)" stroke="#2f5bd3" stroke-width="${sw}"/>`;
  }
  desenhar();
  $('#tudo').onclick = () => { fluxo.cantos = [{ x: 0, y: 0 }, { x: F.width, y: 0 }, { x: F.width, y: F.height }, { x: 0, y: F.height }]; desenhar(); };
  $('#auto').onclick = () => { fluxo.cantos = scan.detectarCantos(F); desenhar(); };
  $('#ok').onclick = async () => {
    $('#ok').disabled = true; $('#ok').innerHTML = '<span class="carregando"></span> Processando…';
    await new Promise(r => setTimeout(r, 30));
    fluxo.recortado = scan.recortar(F, fluxo.cantos);
    fluxo.filtro = 'nitido';
    fluxo.rotacao = scan.textoEstaDeitado(scan.aplicarFiltro(fluxo.recortado, 'nitido')) ? 90 : 0;
    fluxo.dados = novoRegistro();
    fluxo.tocados = new Set();
    fluxo.tentouVirar = false;
    abrir(telaRevisao);
    lerDados();
  };
}

function novoRegistro() {
  const d = fluxo.horaFoto || new Date();
  return {
    id: 'p' + d.getTime() + Math.random().toString(36).slice(2, 6),
    criadoEm: d.getTime(),
    data: dataBR(d), hora: horaBR(d),
    paciente: '', hospital: cfg.hospital, bloco: '', leito: '',
    especialidade: '', medico: '', tipo: cfg.tipo, colaborador: cfg.colaborador,
    copiado: false,
  };
}

function montarFinal() {
  fluxo.final = scan.girar(scan.aplicarFiltro(fluxo.recortado, fluxo.filtro), fluxo.rotacao);
  return fluxo.final;
}

function formularioHTML(p) {
  const dl = (id, lista) => `<datalist id="${id}">${lista.map(o => `<option value="${esc(o)}">`).join('')}</datalist>`;
  return `
    <label class="campo"><span>Paciente</span><input type="text" name="paciente" value="${esc(p.paciente)}" autocapitalize="characters"></label>
    <label class="campo"><span>Especialidade (pasta)</span><input type="text" name="especialidade" list="dl-esp" value="${esc(p.especialidade)}" autocapitalize="characters"><div class="alerta" data-alerta="especialidade"></div></label>
    <div class="dupla">
      <label class="campo"><span>Bloco</span><input type="text" name="bloco" list="dl-bloco" value="${esc(p.bloco)}" autocapitalize="characters"><div class="alerta" data-alerta="bloco"></div></label>
      <label class="campo"><span>Leito</span><input type="text" name="leito" value="${esc(p.leito)}"></label>
    </div>
    <div class="dupla">
      <label class="campo"><span>Data</span><input type="text" name="data" value="${esc(p.data)}" inputmode="numeric"></label>
      <label class="campo"><span>Hora</span><input type="text" name="hora" value="${esc(p.hora)}" inputmode="numeric"></label>
    </div>
    <div class="dupla">
      <label class="campo"><span>Hospital</span><input type="text" name="hospital" list="dl-hosp" value="${esc(p.hospital)}" autocapitalize="characters"></label>
      <label class="campo"><span>Tipo</span><input type="text" name="tipo" value="${esc(p.tipo)}" autocapitalize="characters"></label>
    </div>
    <label class="campo"><span>Médico (pode deixar em branco)</span><input type="text" name="medico" value="${esc(p.medico)}" autocapitalize="characters"></label>
    <label class="campo"><span>Colaborador</span><input type="text" name="colaborador" value="${esc(p.colaborador)}" autocapitalize="characters"></label>
    ${dl('dl-esp', cfg.especialidades)}${dl('dl-bloco', cfg.blocos)}${dl('dl-hosp', cfg.hospitais)}`;
}

const MAIUSCULAS = new Set(['paciente', 'especialidade', 'bloco', 'hospital', 'tipo', 'medico', 'colaborador']);

function ligarFormulario(raiz, p, aoMudar) {
  const checar = nome => {
    const lista = nome === 'especialidade' ? cfg.especialidades : cfg.blocos;
    const el = raiz.querySelector(`[data-alerta="${nome}"]`);
    if (!el) return;
    el.textContent = p[nome] && !lista.includes(p[nome]) ? '⚠ Não está igual à lista da planilha' : '';
  };
  raiz.querySelectorAll('input[name]').forEach(inp => {
    inp.addEventListener('input', () => {
      p[inp.name] = MAIUSCULAS.has(inp.name) ? inp.value.toUpperCase() : inp.value;
      aoMudar?.(inp.name);
      checar(inp.name);
    });
    inp.addEventListener('blur', () => { inp.value = p[inp.name] ?? ''; });
  });
  checar('especialidade'); checar('bloco');
  return () => {
    raiz.querySelectorAll('input[name]').forEach(inp => { inp.value = p[inp.name] ?? ''; });
    checar('especialidade'); checar('bloco');
  };
}

function telaRevisao() {
  titulo('Conferir parecer', true);
  const p = fluxo.dados;
  tela.innerHTML = `
    <img class="previa" id="prev" alt="Parecer escaneado">
    <div class="chips" id="filtros">
      <button class="chip" data-f="nitido">Nítido P&amp;B</button>
      <button class="chip" data-f="cor">Cor</button>
      <button class="chip" data-f="original">Original</button>
      <button class="chip" data-g="-90">⟲</button>
      <button class="chip" data-g="90">⟳</button>
    </div>
    <div class="cartao">
      <div class="ia-status" id="ia"></div>
      <div id="form">${formularioHTML(p)}</div>
    </div>
    <div class="linha-btns">
      <button class="btn sec" id="salvar">💾 Salvar</button>
      <button class="btn verde" id="enviar">📤 Salvar e enviar</button>
    </div>
    <button class="btn sec cheio" style="margin-top:8px" id="releer">🔄 Ler de novo</button>`;
  fluxo.atualizarForm = ligarFormulario($('#form'), p, nome => fluxo.tocados.add(nome));
  const mostrar = () => {
    montarFinal();
    $('#prev').src = fluxo.final.toDataURL('image/jpeg', 0.7);
    document.querySelectorAll('#filtros [data-f]').forEach(b => b.classList.toggle('ativo', b.dataset.f === fluxo.filtro));
  };
  mostrar();
  fluxo.mostrar = mostrar;
  document.querySelectorAll('#filtros [data-f]').forEach(b => b.onclick = () => { fluxo.filtro = b.dataset.f; mostrar(); });
  document.querySelectorAll('#filtros [data-g]').forEach(b => b.onclick = () => { fluxo.rotacao = (fluxo.rotacao + +b.dataset.g + 360) % 360; mostrar(); });
  $('#releer').onclick = () => { fluxo.tocados.clear(); lerDados(); };
  $('#salvar').onclick = () => salvarFluxo(false);
  $('#enviar').onclick = () => salvarFluxo(true);
  statusIA(fluxo.statusIA || ['', '']);
}

function statusIA([classe, html]) {
  fluxo.statusIA = [classe, html];
  const el = $('#ia');
  if (!el) return;
  el.className = 'ia-status ' + classe;
  el.innerHTML = html;
  el.hidden = !html;
}

async function lerDados() {
  if (cfg.modoLeitura === 'manual') { statusIA(['', 'Leitura automática desligada. Preencha os campos.']); return; }
  if (cfg.modoLeitura === 'gemini' && !cfg.chave) { statusIA(['erro', 'Sem chave do Gemini. Preencha à mão ou configure em Ajustes.']); return; }
  statusIA(['', '<span class="carregando"></span> Lendo o parecer…']);
  try {
    const canvas = fluxo.final || montarFinal();
    const r = cfg.modoLeitura === 'gemini' ? await lerComGemini(canvas, cfg) : await lerNoCelular(canvas);
    if (r._modelo && r._modelo !== cfg.modelo) { cfg.modelo = r._modelo; salvarCfg(); }
    if (r.de_cabeca_para_baixo && !fluxo.tentouVirar) {
      fluxo.tentouVirar = true;
      fluxo.rotacao = (fluxo.rotacao + 180) % 360;
      fluxo.mostrar?.();
      return lerDados();
    }
    aplicarLeitura(r);
    statusIA(['ok', '✓ Dados lidos. Confira antes de salvar.']);
  } catch (err) {
    console.error(err);
    statusIA(['erro', esc(err.message || 'Não consegui ler.') + ' Preencha à mão se precisar.']);
  }
}

function aplicarLeitura(r) {
  const p = fluxo.dados;
  const esp = melhorOpcao(r.especialidade, cfg.especialidades, 0.8) || melhorOpcao(r.especialidade_lida, cfg.especialidades)
    || (r.especialidade_lida || '').toUpperCase().trim();
  const bloco = melhorOpcao(r.bloco, cfg.blocos, 0.8) || melhorOpcao(r.setor_lido, cfg.blocos, 0.6) || '';
  const novos = {
    paciente: (r.paciente || '').toUpperCase().replace(/\s+/g, ' ').trim(),
    especialidade: esp,
    bloco,
    leito: (r.leito || '').trim(),
  };
  for (const [k, v] of Object.entries(novos)) if (!fluxo.tocados.has(k) && v) p[k] = v;
  fluxo.atualizarForm?.();
}

async function salvarFluxo(enviar) {
  const p = fluxo.dados;
  if (!p.paciente) { aviso('Coloque o nome do paciente.'); return; }
  const botoes = tela.querySelectorAll('.btn');
  botoes.forEach(b => b.disabled = true);
  try {
    const final = montarFinal();
    p.img = await scan.paraBlob(final);
    p.thumb = await scan.miniatura(final);
    p.w = final.width; p.h = final.height;
    await db.salvar(p);
    aviso(`Salvo na pasta ${nomePasta(p)}`);
    if (enviar) await compartilhar(p);
    irAba('escanear');
  } catch (err) {
    console.error(err); aviso('Erro ao salvar: ' + err.message);
    botoes.forEach(b => b.disabled = false);
  }
}

async function compartilhar(p) {
  if (!p.img) p = await db.pegar(p.id);
  const base = `PARECER - ${p.especialidade || 'SEM ESPECIALIDADE'} - ${p.paciente}`.replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 90).trim();
  let arquivo;
  if (cfg.formatoEnvio === 'imagem') {
    arquivo = new File([p.img], base + '.jpg', { type: 'image/jpeg' });
  } else {
    let { w, h } = p;
    if (!w) { const c = await scan.blobParaCanvas(p.img); w = c.width; h = c.height; }
    arquivo = new File([await jpegParaPdf(p.img, w, h)], base + '.pdf', { type: 'application/pdf' });
  }
  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try { await navigator.share({ files: [arquivo], title: base }); }
    catch (e) { if (e.name !== 'AbortError') aviso('Não consegui compartilhar.'); }
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(arquivo); a.download = arquivo.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    aviso('Arquivo baixado. Envie pelo WhatsApp.');
  }
}

// ================= Planilha =================
let filtroPlanilha = 'pendentes';

async function telaPlanilha() {
  titulo('Planilha do plantão');
  const todos = await db.listar();
  const hoje = dataBR(new Date());
  const linhas = todos.filter(p =>
    filtroPlanilha === 'pendentes' ? !p.copiado : filtroPlanilha === 'hoje' ? p.data === hoje : true
  ).sort((a, b) => a.criadoEm - b.criadoEm);

  tela.innerHTML = `
    <div class="chips">
      <button class="chip" data-fp="pendentes">Não copiados</button>
      <button class="chip" data-fp="hoje">Hoje</button>
      <button class="chip" data-fp="todos">Todos</button>
    </div>
    ${linhas.length ? `
    <button class="btn cheio verde" id="copiar">📋 Copiar ${linhas.length} linha(s)</button>
    <p class="suave pequeno">No Google Sheets, clique na 1ª célula vazia da coluna <b>DATA</b> e cole com <b>Ctrl+Shift+V</b>.</p>
    <div class="tabela-wrap"><table>
      <thead><tr>${COLUNAS.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${linhas.map(p => `<tr data-id="${p.id}" class="${p.copiado ? 'copiado' : ''}">${linhaPlanilha(p).map(v => v ? `<td>${esc(v)}</td>` : '<td class="vazio">—</td>').join('')}</tr>`).join('')}</tbody>
    </table></div>
    <p class="suave pequeno">Toque numa linha para editar (ex.: colocar o médico).</p>`
    : `<div class="vazio-grande"><div>✅</div>Nada ${filtroPlanilha === 'pendentes' ? 'pendente para copiar' : 'por aqui'}.</div>`}`;

  tela.querySelectorAll('[data-fp]').forEach(b => {
    b.classList.toggle('ativo', b.dataset.fp === filtroPlanilha);
    b.onclick = () => { filtroPlanilha = b.dataset.fp; telaPlanilha(); };
  });
  tela.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => abrir(telaDetalhe, tr.dataset.id));
  const btn = $('#copiar');
  if (btn) btn.onclick = async () => {
    const tsv = linhas.map(p => linhaPlanilha(p).join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(tsv);
    } catch {
      const t = document.createElement('textarea'); t.value = tsv; document.body.appendChild(t); t.select();
      document.execCommand('copy'); t.remove();
    }
    aviso(`${linhas.length} linha(s) copiada(s)!`);
    const pend = linhas.filter(p => !p.copiado);
    if (pend.length && confirm(`Marcar ${pend.length} linha(s) como já copiada(s)? Assim elas saem de "Não copiados".`)) {
      await db.marcarCopiados(pend.map(p => p.id));
      telaPlanilha();
    }
  };
}

// ================= Pastas =================
let busca = '';

async function telaPastas() {
  titulo('Pastas');
  const todos = await db.listar();
  tela.innerHTML = `
    <input type="search" id="busca" placeholder="🔎 Buscar paciente em todas as pastas" value="${esc(busca)}">
    <div style="height:12px"></div>
    <ul class="lista" id="res"></ul>`;
  const desenhar = () => {
    liberarUrls();
    const ul = $('#res');
    if (busca.trim()) {
      const q = normalizar(busca);
      const achados = todos.filter(p => normalizar(`${p.paciente} ${p.leito} ${p.bloco}`).includes(q));
      if (!achados.length) { ul.innerHTML = '<div class="vazio-grande">Nenhum paciente encontrado.</div>'; return; }
      desenharItens(ul, achados);
      return;
    }
    const pastas = new Map();
    for (const p of todos) {
      const n = nomePasta(p);
      if (!pastas.has(n)) pastas.set(n, { n, qtd: 0, ultimo: p });
      pastas.get(n).qtd++;
    }
    if (!pastas.size) { ul.innerHTML = '<div class="vazio-grande"><div>📁</div>Nenhum parecer salvo ainda.</div>'; return; }
    ul.innerHTML = [...pastas.values()].sort((a, b) => a.n.localeCompare(b.n)).map(f => `
      <li class="item" data-pasta="${esc(f.n)}">
        <div class="pasta-ic">📁</div>
        <div class="info"><b>${esc(f.n)}</b><div class="suave pequeno">Último: ${esc(f.ultimo.data)} ${esc(f.ultimo.hora.slice(0, 5))}</div></div>
        <span class="contador">${f.qtd}</span>
      </li>`).join('');
    ul.querySelectorAll('[data-pasta]').forEach(li => li.onclick = () => abrir(telaPasta, li.dataset.pasta));
  };
  $('#busca').oninput = e => { busca = e.target.value; desenhar(); };
  desenhar();
}

async function telaPasta(nome) {
  titulo(nome, true);
  const itens = (await db.listar()).filter(p => nomePasta(p) === nome);
  tela.innerHTML = '<ul class="lista" id="itens"></ul>';
  if (!itens.length) { tela.innerHTML = '<div class="vazio-grande">Pasta vazia.</div>'; return; }
  desenharItens($('#itens'), itens);
}

async function telaDetalhe(id) {
  const p = await db.pegar(id);
  if (!p) { voltar(); return; }
  titulo(p.paciente || 'Parecer', true);
  tela.innerHTML = `
    <a href="${urlDe(p.img)}" target="_blank"><img class="previa" src="${urlDe(p.img)}" alt="Parecer"></a>
    <div class="cartao" style="margin-top:12px">
      <div style="margin-bottom:10px">${p.copiado ? '<span class="selo">já copiado para a planilha</span>' : '<span class="selo pend">ainda não copiado</span>'}</div>
      <div id="form">${formularioHTML(p)}</div>
      <label class="campo" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="copiado" ${p.copiado ? 'checked' : ''}> <span style="margin:0">Já copiado para a planilha</span></label>
    </div>
    <div class="linha-btns">
      <button class="btn" id="salvar">💾 Salvar</button>
      <button class="btn verde" id="enviar">📤 Enviar</button>
    </div>
    <div class="linha-btns" style="margin-top:8px">
      <button class="btn sec" id="copiar1">📋 Copiar esta linha</button>
      <button class="btn perigo" id="excluir">🗑️ Excluir</button>
    </div>`;
  ligarFormulario($('#form'), p);
  $('#copiado').onchange = e => { p.copiado = e.target.checked; };
  $('#salvar').onclick = async () => { await db.salvar(p); aviso('Alterações salvas'); voltar(); };
  $('#enviar').onclick = async () => { await db.salvar(p); compartilhar(p); };
  $('#copiar1').onclick = async () => { await navigator.clipboard.writeText(linhaPlanilha(p).join('\t')); aviso('Linha copiada'); };
  $('#excluir').onclick = async () => {
    if (!confirm(`Excluir o parecer de ${p.paciente}? Não dá para desfazer.`)) return;
    await db.apagar(p.id); aviso('Excluído'); voltar();
  };
}

// ================= Configurações =================
async function telaConfig() {
  titulo('Ajustes');
  let uso = '';
  try {
    const e = await navigator.storage.estimate();
    uso = `${(e.usage / 1048576).toFixed(1)} MB usados`;
  } catch {}
  const qtd = (await db.listar()).length;
  tela.innerHTML = `
    <div class="cartao">
      <h2>Plantão</h2>
      <label class="campo"><span>Seu nome (coluna COLABORADOR)</span><input type="text" id="c-colab" value="${esc(cfg.colaborador)}" autocapitalize="characters" placeholder="Ex.: YURY ALEXANDRO"></label>
      <label class="campo"><span>Hospital padrão (pode deixar vazio)</span><input type="text" id="c-hosp" list="dl-h" value="${esc(cfg.hospital)}" autocapitalize="characters"></label>
      <datalist id="dl-h">${cfg.hospitais.map(h => `<option value="${esc(h)}">`).join('')}</datalist>
      <label class="campo"><span>Tipo padrão</span><input type="text" id="c-tipo" value="${esc(cfg.tipo)}" autocapitalize="characters"></label>
    </div>

    <div class="cartao">
      <h2>Leitura automática</h2>
      <label class="campo"><span>Quem lê o parecer</span>
        <select id="c-modo">
          <option value="gemini">IA do Google (Gemini) – mais precisa</option>
          <option value="celular">No próprio celular – nada sai do aparelho</option>
          <option value="manual">Desligada – preencho à mão</option>
        </select></label>
      <div id="bloco-gemini">
        <label class="campo"><span>Chave do Gemini</span><input type="password" id="c-chave" value="${esc(cfg.chave)}" autocomplete="off" placeholder="Cole aqui a chave"></label>
        <button class="btn sec" id="testar">Testar chave</button>
        <span class="suave pequeno" id="teste-res">${cfg.modelo ? 'Modelo: ' + esc(cfg.modelo) : ''}</span>
        <details style="margin-top:10px"><summary class="suave">Como conseguir a chave (grátis)</summary>
          <ol class="passos">
            <li>Abra <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> e entre com sua conta Google.</li>
            <li>Toque em <b>Criar chave de API</b> (Create API key).</li>
            <li>Copie a chave e cole no campo acima.</li>
            <li><b>Privacidade:</b> no plano gratuito o Google pode usar o que é enviado para melhorar os produtos. Ativando o faturamento (cadastrar cartão) no projeto, o uso passa a contar como pago e os dados não são usados. O custo pelo volume de pareceres é de centavos.</li>
          </ol></details>
        <label class="campo" style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" id="c-topo" ${cfg.soTopo ? 'checked' : ''}><span style="margin:0">Enviar só a parte de cima do parecer (cabeçalho)</span></label>
      </div>
    </div>

    <div class="cartao">
      <h2>Envio</h2>
      <label class="campo"><span>Formato para WhatsApp</span>
        <select id="c-env"><option value="pdf">PDF</option><option value="imagem">Imagem (JPG)</option></select></label>
    </div>

    <div class="cartao">
      <h2>Listas da planilha</h2>
      <p class="suave pequeno" style="margin-top:0">Cole uma opção por linha, exatamente como está nas listas suspensas da planilha. Pode copiar a coluna inteira do Google Sheets e colar aqui.</p>
      <label class="campo"><span>Especialidades (${cfg.especialidades.length})</span><textarea id="c-esp">${esc(cfg.especialidades.join('\n'))}</textarea></label>
      <label class="campo"><span>Blocos (${cfg.blocos.length})</span><textarea id="c-blocos">${esc(cfg.blocos.join('\n'))}</textarea></label>
      <label class="campo"><span>Hospitais (${cfg.hospitais.length})</span><textarea id="c-hosps" style="min-height:70px">${esc(cfg.hospitais.join('\n'))}</textarea></label>
    </div>

    <div class="cartao">
      <h2>Armazenamento</h2>
      <p class="suave" style="margin-top:0">${qtd} parecer(es) salvos. ${uso}</p>
      <label class="campo"><span>Apagar pareceres antigos automaticamente</span>
        <select id="c-limpa"><option value="0">Nunca</option><option value="30">Mais de 30 dias</option><option value="60">Mais de 60 dias</option><option value="90">Mais de 90 dias</option></select></label>
    </div>
    <button class="btn cheio" id="salvar-cfg">Salvar ajustes</button>
    <p class="suave pequeno" style="text-align:center;margin-top:16px">Parecer Scan · os pareceres ficam só neste celular.</p>`;

  $('#c-modo').value = cfg.modoLeitura;
  $('#c-env').value = cfg.formatoEnvio;
  $('#c-limpa').value = String(cfg.limpezaDias);
  const mostrarGemini = () => { $('#bloco-gemini').hidden = $('#c-modo').value !== 'gemini'; };
  $('#c-modo').onchange = mostrarGemini; mostrarGemini();

  $('#testar').onclick = async () => {
    const r = $('#teste-res');
    r.innerHTML = '<span class="carregando"></span>';
    try {
      const m = await escolherModelo($('#c-chave').value.trim());
      cfg.chave = $('#c-chave').value.trim(); cfg.modelo = m; salvarCfg();
      r.textContent = '✓ Funcionando (' + m + ')';
    } catch (e) { r.textContent = '✗ ' + e.message; }
  };

  $('#salvar-cfg').onclick = async () => {
    const chaveNova = $('#c-chave').value.trim();
    if (chaveNova !== cfg.chave) cfg.modelo = '';
    Object.assign(cfg, {
      colaborador: $('#c-colab').value.trim().toUpperCase(),
      hospital: $('#c-hosp').value.trim().toUpperCase(),
      tipo: $('#c-tipo').value.trim().toUpperCase() || 'PARECER',
      modoLeitura: $('#c-modo').value,
      chave: chaveNova,
      soTopo: $('#c-topo').checked,
      formatoEnvio: $('#c-env').value,
      limpezaDias: +$('#c-limpa').value,
      especialidades: textoParaLista($('#c-esp').value),
      blocos: textoParaLista($('#c-blocos').value),
      hospitais: textoParaLista($('#c-hosps').value),
    });
    salvarCfg();
    aviso('Ajustes salvos');
    await limpezaAutomatica();
    telaConfig();
  };
}

async function limpezaAutomatica() {
  if (!cfg.limpezaDias) return;
  const n = await db.contarAntigos(cfg.limpezaDias);
  if (n && confirm(`Apagar ${n} parecer(es) com mais de ${cfg.limpezaDias} dias para liberar espaço?`)) {
    await db.limparAntigos(cfg.limpezaDias);
    aviso(`${n} parecer(es) antigos apagados`);
  }
}

// ================= Início =================
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
navigator.storage?.persist?.();
irAba('escanear');
setTimeout(limpezaAutomatica, 1500);

// para testes
window.__app = { fluxo, cfg, scan, db, aplicarLeitura, linhaPlanilha };
