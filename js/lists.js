// Listas padrão (tiradas da planilha CAMED - ESCALA DE PARECER).
// O usuário pode colar as listas completas em Configurações.

export const ESPECIALIDADES_PADRAO = [
  'ARRITMOLOGIA',
  'BUCOMAXILOFACIAL',
  'BRONCOSCOPIA',
  'CARDIOLOGIA  PARECER',
  'CARDIOLOGIA RISCO',
  'CIRURGIA CARDIOVASCULAR',
  'CIRURGIA DE CABEÇA E PESCOÇO',
  'CIRURGIA GERAL',
  'CIRURGIA TÓRACICA',
  'CIRURGIA VASCULAR',
  'CIRURGIA ONCOLÓGICA',
  'CIRURGIA PLÁSTICA',
  'CLÍNICA MÉDICA',
  'COLOPROCTOLOGIA',
  'CUIDADOS PALIATIVOS NÃO ONCOLOGICOS',
  'DERMATOLOGIA',
  'DOPPLER TRANSCRANIANO',
  'DOR',
  'ENDOCRINOLOGIA',
  'ENDOSCOPIA',
  'GASTROENTEROLOGIA',
  'GINECOLOGIA E OBSTERÍCIA',
  'ORTOPEDIA E TRAUMATOLOGIA',
  'HEMATOLOGIA',
  'INFECTOLOGIA',
  'NEFROLOGIA',
  'NEUROCIRURGIA',
  'NEUROLOGIA',
  'OFTALMOLOGIA',
  'ONCOLOGIA CLÍNICA',
  'OTORRINOLARINGOLOGIA',
  'PNEUMOLOGIA',
  'PSIQUIATRIA',
  'RADIOLOGIA',
  'RADIOTERAPIA',
  'REUMATOLOGIA',
  'TRATAMENTO DE FERIDAS',
  'UROLOGIA',
  'ULTRASSONOGRAFIA',
  'ULTRASSONOGRAFIA DOPPLER',
];

export const BLOCOS_PADRAO = [
  'HGR - BLOCO B - BLB',
  'HGR - BLOCO C1',
  'HGR - BLOCO E - BLE',
  'HGR - BLOCO F - BLF',
  'HGR - UTI 3A',
  'HGR - UTI 3B',
  'PSAR - OBSERVAÇÃO',
];

// Aumente quando as listas padrão mudarem: substitui as listas antigas salvas no celular.
export const VERSAO_LISTAS = 2;

export const HOSPITAIS_PADRAO = ['HGR'];

// Apelidos comuns -> palavra que aparece na opção da lista.
const SINONIMOS = {
  NEURO: 'NEUROLOGIA',
  NEUROCIRURGIA: 'NEUROCIRURGIA',
  CARDIO: 'CARDIOLOGIA',
  NEFRO: 'NEFROLOGIA',
  GO: 'GINECOLOGIA',
  GINECO: 'GINECOLOGIA',
  OBSTETRICIA: 'GINECOLOGIA',
  ONCO: 'ONCOLOGIA',
  CLINICO: 'CLINICA',
  DTC: 'TRANSCRANIANO',
  USG: 'ULTRASSONOGRAFIA',
  US: 'ULTRASSONOGRAFIA',
  ULTRASSOM: 'ULTRASSONOGRAFIA',
  ECO: 'ECOCARDIOGRAMA',
  ORTO: 'ORTOPEDIA',
  OTORRINO: 'OTORRINOLARINGOLOGIA',
  GASTRO: 'GASTROENTEROLOGIA',
  PNEUMO: 'PNEUMOLOGIA',
  URO: 'UROLOGIA',
  PROCTO: 'COLOPROCTOLOGIA',
  PROCTOLOGIA: 'COLOPROCTOLOGIA',
  INFECTO: 'INFECTOLOGIA',
  HEMATO: 'HEMATOLOGIA',
  ENDOCRINO: 'ENDOCRINOLOGIA',
  REUMATO: 'REUMATOLOGIA',
  DERMATO: 'DERMATOLOGIA',
  OFTALMO: 'OFTALMOLOGIA',
  PSIQ: 'PSIQUIATRIA',
  VASCULAR: 'VASCULAR',
  BUCOMAXILO: 'BUCOMAXILOFACIAL',
};

const PARADAS = new Set(['DE', 'DA', 'DO', 'E', 'COM', 'EM', 'A', 'O', 'HGR', 'PARA', 'PARECER']);

export function normalizar(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function tokens(s) {
  return normalizar(s).split(' ')
    .filter(t => t && !PARADAS.has(t))
    .map(t => SINONIMOS[t] || t);
}

function semelhanca(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.length || !tb.length) return 0;
  let acertos = 0;
  for (const x of ta) {
    if (tb.some(y => y === x || (x.length >= 4 && y.startsWith(x)) || (y.length >= 4 && x.startsWith(y)))) acertos++;
  }
  // Dice com peso para cobrir o que foi lido
  return (2 * acertos) / (ta.length + tb.length) * 0.5 + (acertos / ta.length) * 0.5;
}

// Devolve a opção da lista mais parecida, ou null se nenhuma servir.
export function melhorOpcao(lido, opcoes, minimo = 0.5) {
  if (!lido) return null;
  const n = normalizar(lido);
  const exata = opcoes.find(o => normalizar(o) === n);
  if (exata) return exata;
  let melhor = null, nota = 0;
  for (const o of opcoes) {
    const s = semelhanca(lido, o);
    if (s > nota) { nota = s; melhor = o; }
  }
  return nota >= minimo ? melhor : null;
}

export function textoParaLista(txt) {
  const vistos = new Set();
  return String(txt || '').split(/\r?\n|\t/)
    .map(l => l.trim())
    .filter(l => l && !vistos.has(l) && vistos.add(l));
}
