// Recursos do app Android (Capacitor). No site, cai no jeito do navegador.
import { VERSAO, REPO } from './versao.js';

const cap = () => window.Capacitor;
export const ehApp = () => !!cap()?.isNativePlatform?.();
const plugin = nome => cap()?.Plugins?.[nome] || cap()?.registerPlugin?.(nome);

const PASTA_RAIZ = 'CAMED Scan';
const limparNome = s => String(s || '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 80) || 'SEM NOME';

async function blobBase64(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

let permissaoPedida = false;
async function garantirPermissao(fs) {
  if (permissaoPedida) return;
  permissaoPedida = true;
  try {
    const st = await fs.checkPermissions();
    if (st.publicStorage !== 'granted') await fs.requestPermissions();
  } catch { /* Android 11+ não precisa */ }
}

// Salva o PDF em Documentos/CAMED Scan/ESPECIALIDADE/. Devolve o caminho relativo.
export async function salvarNoCelular(pdfBlob, p) {
  if (!ehApp()) return null;
  const fs = plugin('Filesystem');
  await garantirPermissao(fs);
  const [d, m, a] = (p.data || '').split('/');
  const hora = (p.hora || '').replace(/:/g, '-').slice(0, 5);
  const caminho = `${PASTA_RAIZ}/${limparNome(p.especialidade || 'SEM ESPECIALIDADE')}/${a}-${m}-${d} ${hora} - ${limparNome(p.paciente)}.pdf`;
  await fs.writeFile({ path: caminho, data: await blobBase64(pdfBlob), directory: 'DOCUMENTS', recursive: true });
  return caminho;
}

export async function apagarDoCelular(caminho) {
  if (!ehApp() || !caminho) return;
  try { await plugin('Filesystem').deleteFile({ path: caminho, directory: 'DOCUMENTS' }); } catch {}
}

export async function compartilharNoApp(blob, nome, titulo) {
  const fs = plugin('Filesystem');
  const { uri } = await fs.writeFile({ path: limparNome(nome), data: await blobBase64(blob), directory: 'CACHE' });
  await plugin('Share').share({ title: titulo, files: [uri], dialogTitle: 'Enviar parecer' });
}

export async function copiarTexto(txt) {
  if (ehApp()) { await plugin('Clipboard').write({ string: txt }); return; }
  try { await navigator.clipboard.writeText(txt); }
  catch {
    const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select();
    document.execCommand('copy'); t.remove();
  }
}

export async function abrirLink(url) {
  if (ehApp()) { await plugin('Browser').open({ url }); return; }
  window.open(url, '_blank', 'noopener');
}

// ---------- Atualização ----------
const numeros = v => String(v).replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
export function maisNova(a, b) {
  const x = numeros(a), y = numeros(b);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); }
  return false;
}

export async function buscarAtualizacao() {
  const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { cache: 'no-store' });
  if (r.status === 404) return { tem: false, versao: VERSAO };
  if (!r.ok) throw new Error('Não consegui verificar agora. Confira a internet.');
  const j = await r.json();
  const apk = (j.assets || []).find(a => a.name.endsWith('.apk'));
  return { tem: maisNova(j.tag_name, VERSAO) && !!apk, versao: j.tag_name.replace(/^v/, ''), url: apk?.browser_download_url, notas: j.body || '' };
}
