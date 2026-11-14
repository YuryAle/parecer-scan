// Listas padrão (tiradas da planilha CAMED - ESCALA DE PARECER).
// O usuário pode colar as listas completas em Configurações.

export const ESPECIALIDADES_PADRAO = [
  'ARRITMOLOGIA',
  'BRONCOSCOPIA',
  'BUCOMAXILOFACIAL',
  'CARDIOLOGIA PARECER',
  'CARDIOLOGIA RISCO',
  'CIRURGIA CARDIOVASCULAR',
  'CIRURGIA DE CABEÇA E PESCOÇO',
  'CIRURGIA GERAL',
  'CIRURGIA ONCOLÓGICA',
  'CIRURGIA PLÁSTICA',
  'CIRURGIA TORÁCICA',
  'CIRURGIA VASCULAR',
  'CLÍNICA MÉDICA',
  'COLOPROCTOLOGIA',
  'CUIDADOS PALIATIVOS NÃO ONCOLÓGICOS',
  'DERMATOLOGIA',
  'DOPPLER TRANSCRANIANO',
  'DOR',
  'ENDOCRINOLOGIA',
  'ENDOSCOPIA',
  'GASTROENTEROLOGIA',
  'GINECOLOGIA E OBSTETRÍCIA',
  'HEMATOLOGIA',
  'INFECTOLOGIA',
  'NEFROLOGIA',
  'NEUROCIRURGIA',
  'NEUROLOGIA',
  'NUTROLOGIA',
  'ODONTOLOGIA',
  'OFTALMOLOGIA',
  'ONCOLOGIA CLÍNICA',
  'ORTOPEDIA E TRAUMATOLOGIA',
  'OTORRINOLARINGOLOGIA',
  'PNEUMOLOGIA',
  'PSIQUIATRIA',
  'RADIOLOGIA',
  'RADIOTERAPIA',
  'REUMATOLOGIA',
  'SCIH/CCIH',
  'TRATAMENTO DE FERIDAS',
  'ULTRASSONOGRAFIA',
  'ULTRASSONOGRAFIA DOPPLER',
  'UROLOGIA',
];

export const BLOCOS_PADRAO = [
  'PSAR - OBSERVAÇÃO',
  'PSAR - VERDE',
  'PSAR - RCP',
  'PSFE - SUTURA',
  'PSFE - RCP',
  'PSFE - UAVC',
  'PSFE - VERMELHA 1',
  'PSFE - VERMELHA 2',
  'UTI 1A',
  'UTI 1B',
  'UTI 2A',
  'UTI 2B',
  'UTI 3',
  'UTI 3A',
  'UTI 3B',
  'UTI 3C',
  'UTI CARDIO - UCO',
  'BLOCO A - BLA',
  'BLOCO B - BLB',
  'BLOCO C1 - BLC1',
  'BLOCO C2 - BLC2',
  'BLOCO D - BLD',
  'BLOCO E - BLE',
  'BLOCO F - BLF',
];

// Aumente quando as listas padrão mudarem: substitui as listas antigas salvas no celular.
export const VERSAO_LISTAS = 4;

export const HOSPITAIS_PADRAO = ['HGR'];

// Médicos de cada especialidade (aba Cadastro da planilha), para sugerir no campo MÉDICO.
export const MEDICOS_PADRAO = {
  "ARRITMOLOGIA": [
    "BRUNO ROCHA",
    "KIM FONG"
  ],
  "BUCOMAXILOFACIAL": [
    "DANIEL",
    "DENNIS",
    "JULIENE",
    "BRUNO",
    "MARCOS",
    "LEANDRO",
    "RICARDO",
    "RODRIGO",
    "SILVANA",
    "HELEN ALICE"
  ],
  "BRONCOSCOPIA": [
    "AMON RHEINGANTZ",
    "JUCINEIDE",
    "TAO MACHADO"
  ],
  "CARDIOLOGIA PARECER": [
    "ANA CAROLINA",
    "BRUNO ROCHA",
    "ILDEMBERG OLIVEIRA",
    "LEONARDO L.",
    "RICARDO OLIVEIRA",
    "FELIPE MONTEIRO",
    "WAGNER LEÃO"
  ],
  "CARDIOLOGIA RISCO": [
    "ANA CAROLINA",
    "BRUNO ROCHA",
    "ILDEMBERG OLIVEIRA",
    "LEONARDO L.",
    "RICARDO OLIVEIRA",
    "FELIPE MONTEIRO",
    "WAGNER LEÃO"
  ],
  "CIRURGIA CARDIOVASCULAR": [
    "PAULA LAGO",
    "TALITA SPOSITO"
  ],
  "CIRURGIA DE CABEÇA E PESCOÇO": [
    "RUITER",
    "JOSINALDO",
    "FERNANDO"
  ],
  "CIRURGIA GERAL": [
    "ALEX BLANCO",
    "ARNALDO JAVIER",
    "ALTAMIR LAGO",
    "ANTONIO DELMIRO",
    "BRUNO GONDIM",
    "CAMILLA LAGO",
    "EDER",
    "HELDER GROSSI",
    "GLÁUCIO PIRES",
    "LUIZ FERNANDO",
    "RAQUEL GOVEA",
    "RULIAM VIANA",
    "TAMAN RENERYS",
    "PAULO VIEGAS",
    "VIKTOR DIAS"
  ],
  "CIRURGIA TORÁCICA": [
    "ADELIE GAL",
    "TAO MACHADO"
  ],
  "CIRURGIA VASCULAR": [
    "CAMILA FERREIRA",
    "SERGIO SOARES",
    "THIAGO VIEIRA",
    "GUILHERME A.",
    "BRUNO MIANA",
    "RENATO DA SILVA"
  ],
  "CIRURGIA ONCOLÓGICA": [
    "GRUPO"
  ],
  "CIRURGIA PLÁSTICA": [
    "MARCIO ARCOVERDE"
  ],
  "CLÍNICA MÉDICA": [
    "AUXILIADORA",
    "RENATO",
    "CAMILA FLORA",
    "CARLOS PATRICK"
  ],
  "COLOPROCTOLOGIA": [],
  "CUIDADOS PALIATIVOS NÃO ONCOLÓGICOS": [
    "ANA CASSIA",
    "TALITA SPOSITO",
    "BRUNA LEITE",
    "LEIDIANA NOBLES"
  ],
  "DERMATOLOGIA": [
    "DAYSE HELEN",
    "JULLYENE GOMES"
  ],
  "DOPPLER TRANSCRANIANO": [
    "ALCIMAR LAVAREDA",
    "DEIVIS BRITO",
    "JOSELITO SANTOS",
    "ROGER",
    "THIAGO PENAFORTE"
  ],
  "DOR": [
    "IASMIN"
  ],
  "ENDOCRINOLOGIA": [
    "ANDRE PANTALEAO"
  ],
  "ENDOSCOPIA": [
    "ALFREDO GABRIEL",
    "LUIS BAZAN",
    "CAIO TACITO",
    "JULIANA ROSSETO",
    "THALITA DE LIMA"
  ],
  "GASTROENTEROLOGIA": [],
  "GINECOLOGIA E OBSTETRÍCIA": [
    "CAMED HM"
  ],
  "ORTOPEDIA E TRAUMATOLOGIA": [
    "MEDTRAUMA"
  ],
  "HEMATOLOGIA": [
    "RENILZA FELIZOLA",
    "ANDREA GIORDANA"
  ],
  "INFECTOLOGIA": [
    "ALYSSON BRUNO",
    "LUIS GALAN",
    "DOMINGOS SAVIO",
    "JANIO NATROT",
    "ROBERTO CARLOS"
  ],
  "NEFROLOGIA": [
    "KATHERINE WILT",
    "RUDOLF WILT",
    "ALEX FÁBIO",
    "HAROLDO SOUTO",
    "FABRICIO LESSA"
  ],
  "NEUROCIRURGIA": [
    "GRUPO"
  ],
  "NEUROLOGIA": [
    "ANA ROSA",
    "FELIPE",
    "LIVIA",
    "RAISA"
  ],
  "OFTALMOLOGIA": [
    "MARCELO MOREIRA",
    "NAIANE RAMOS",
    "GUSTAVO HENRIQUE",
    "JOSELITO SANTOS",
    "BURNA CAMISA",
    "TARIANA BANDEIRA"
  ],
  "ONCOLOGIA CLÍNICA": [
    "GRUPO"
  ],
  "OTORRINOLARINGOLOGIA": [
    "MAYRON DUARTE",
    "LUIS SERRANO",
    "ANTENOR RODRIGUES"
  ],
  "PNEUMOLOGIA": [
    "JUCINEIDE",
    "RAPHAEL VITOR"
  ],
  "PSIQUIATRIA": [
    "JOEL GONZAGA",
    "WASHINGTON LUIZ",
    "HUMBERTO CALDAS",
    "MATHEUS CALDAS",
    "KIMÃ BARBOSA",
    "LUCIVALDO FREIRE",
    "MARCOS VINICIUS",
    "CAIO SILVEIRA"
  ],
  "RADIOLOGIA": [
    "DANIEL LOPES",
    "JULIANO MEDEIROS",
    "LEOMAR VIEIRA",
    "PAULO EMERICK",
    "CAMILO BOTELHO",
    "MARCELO BOTELHO",
    "JEAN CARLOS",
    "LARISSA LAGO",
    "DANIEL AZEVEDO"
  ],
  "RADIOTERAPIA": [
    "NATALIA"
  ],
  "REUMATOLOGIA": [
    "BRUNO LEITÃO"
  ],
  "TRATAMENTO DE FERIDAS": [
    "JANIO NATROT"
  ],
  "UROLOGIA": [
    "ARTHUR",
    "RAUL",
    "MARLON",
    "FARIEL",
    "MARCOS",
    "FRANCISCO CHAGAS",
    "CHICOLA"
  ],
  "ULTRASSONOGRAFIA": [
    "JULIO HEREDIA",
    "DWILLIO MENEZES",
    "YAGO MAGRINI",
    "MARCELLO ARAÚJO",
    "LUIS ENRIQUE BERMEJO"
  ],
  "ULTRASSONOGRAFIA DOPPLER": [
    "DWILLIO MENEZES",
    "CAIO VITTOR"
  ]
};

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

// Cardiologia tem duas opções na planilha: risco cirúrgico e parecer comum.
export function regraCardiologia(lido, escolhida, opcoes) {
  const n = normalizar(`${lido || ''} ${escolhida || ''}`);
  if (!/CARDIO/.test(n) || /CIRURGIA CARDIO|ARRITMO/.test(normalizar(lido))) return escolhida;
  const risco = opcoes.find(o => /^CARDIOLOGIA RISCO/.test(normalizar(o)));
  const parecer = opcoes.find(o => /^CARDIOLOGIA PARECER/.test(normalizar(o)));
  if (/RISCO|PRE ?OPERATORIO|PREOP|CIRURGIC/.test(normalizar(lido))) return risco || escolhida;
  return parecer || escolhida;
}

// Blocos: casa "BLOCO E" com "BLOCO E - BLE", "UTI 3" com "UTI 3", "SUTURA" com "PSFE - SUTURA".
export function melhorBloco(lido, opcoes) {
  const n = normalizar(lido);
  if (!n) return null;
  const exata = opcoes.find(o => normalizar(o) === n);
  if (exata) return exata;
  let m = n.match(/\bBLOCO ([A-F])\s?(\d)?\b/) || n.match(/\bBL([A-F])(\d)?\b/);
  if (m) {
    const alvo = 'BLOCO ' + m[1] + (m[2] || '');
    return opcoes.find(o => normalizar(o).startsWith(alvo + ' ')) || opcoes.find(o => normalizar(o).startsWith(alvo)) || null;
  }
  m = n.match(/\bUTI ?(\d) ?([A-C])?\b/);
  if (m) return opcoes.find(o => normalizar(o).replace(/ /g, '') === ('UTI' + m[1] + (m[2] || ''))) || null;
  if (/\bUCO\b|UTI CARDIO|CORONARIANA/.test(n)) return opcoes.find(o => /UCO/.test(normalizar(o))) || null;
  return melhorOpcao(lido, opcoes, 0.6);
}
