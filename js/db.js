// Armazenamento local (IndexedDB). Nada sai do celular.
const NOME = 'parecer-scan';
const VERSAO = 1;
let conexao;

function abrir() {
  if (conexao) return conexao;
  conexao = new Promise((ok, erro) => {
    const req = indexedDB.open(NOME, VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      const s = db.createObjectStore('pareceres', { keyPath: 'id' });
      s.createIndex('criadoEm', 'criadoEm');
      s.createIndex('especialidade', 'especialidade');
    };
    req.onsuccess = () => ok(req.result);
    req.onerror = () => erro(req.error);
  });
  return conexao;
}

async function loja(modo) {
  const db = await abrir();
  return db.transaction('pareceres', modo).objectStore('pareceres');
}

const promessa = req => new Promise((ok, erro) => { req.onsuccess = () => ok(req.result); req.onerror = () => erro(req.error); });

export async function salvar(p) {
  return promessa((await loja('readwrite')).put(p));
}

export async function pegar(id) {
  return promessa((await loja('readonly')).get(id));
}

export async function apagar(id) {
  return promessa((await loja('readwrite')).delete(id));
}

// Lista sem as imagens grandes (mais rápido)
export async function listar() {
  const s = await loja('readonly');
  const todos = await promessa(s.getAll());
  return todos.map(({ img, ...resto }) => resto).sort((a, b) => b.criadoEm - a.criadoEm);
}

export async function marcarCopiados(ids) {
  const s = await loja('readwrite');
  for (const id of ids) {
    const p = await promessa(s.get(id));
    if (p) { p.copiado = true; s.put(p); }
  }
  return new Promise(ok => { s.transaction.oncomplete = ok; });
}

export async function limparAntigos(dias) {
  if (!dias) return 0;
  const limite = Date.now() - dias * 86400000;
  const s = await loja('readwrite');
  const todos = await promessa(s.getAll());
  let n = 0;
  for (const p of todos) if (p.criadoEm < limite) { s.delete(p.id); n++; }
  return n;
}

export async function contarAntigos(dias) {
  if (!dias) return 0;
  const limite = Date.now() - dias * 86400000;
  return (await listar()).filter(p => p.criadoEm < limite).length;
}
