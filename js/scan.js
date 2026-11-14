// Processamento de imagem: detectar o papel, recortar em perspectiva,
// girar e aplicar filtro de nitidez. Tudo no próprio celular.

const MAX_FONTE = 2400;   // lado maior da foto original ao carregar
const MAX_SAIDA = 1800;   // lado maior do parecer final

export function novoCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export async function carregarImagem(arquivo) {
  let bmp;
  try {
    bmp = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
  } catch {
    bmp = await new Promise((ok, erro) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = erro;
      img.src = URL.createObjectURL(arquivo);
    });
  }
  const w = bmp.width, h = bmp.height;
  const k = Math.min(1, MAX_FONTE / Math.max(w, h));
  const c = novoCanvas(w * k, h * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  if (bmp.close) bmp.close();
  return c;
}

// ---------- Detecção do papel ----------
function otsu(gray) {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let soma = 0;
  for (let i = 0; i < 256; i++) soma += i * hist[i];
  let sB = 0, wB = 0, melhor = 0, limiar = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sB += t * hist[t];
    const mB = sB / wB, mF = (soma - sB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > melhor) { melhor = v; limiar = t; }
  }
  return limiar;
}

export function detectarCantos(canvas) {
  const W = canvas.width, H = canvas.height;
  const k = Math.min(1, 400 / Math.max(W, H));
  const w = Math.round(W * k), h = Math.round(H * k);
  const p = novoCanvas(w, h);
  const ctx = p.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const gray = new Uint8Array(w * h);
  for (let i = 0, j = 0; j < gray.length; i += 4, j++) {
    // papel é claro e pouco saturado
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    gray[j] = Math.max(0, Math.min(255, (r * 0.3 + g * 0.59 + b * 0.11) - (mx - mn) * 0.5));
  }
  const t = otsu(gray);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) mask[i] = gray[i] > t ? 1 : 0;

  // fecha pequenos buracos (texto) com dilatação simples
  const m2 = new Uint8Array(mask);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    if (!mask[i] && mask[i - 1] + mask[i + 1] + mask[i - w] + mask[i + w] >= 2) m2[i] = 1;
  }

  // maior componente conectado
  const rot = new Int32Array(w * h);
  const fila = new Int32Array(w * h);
  let maior = 0, rotMaior = 0, atual = 0;
  for (let s = 0; s < m2.length; s++) {
    if (!m2[s] || rot[s]) continue;
    atual++;
    let ini = 0, fim = 0, area = 0;
    fila[fim++] = s; rot[s] = atual;
    while (ini < fim) {
      const i = fila[ini++]; area++;
      const x = i % w, y = (i / w) | 0;
      if (x > 0 && m2[i - 1] && !rot[i - 1]) { rot[i - 1] = atual; fila[fim++] = i - 1; }
      if (x < w - 1 && m2[i + 1] && !rot[i + 1]) { rot[i + 1] = atual; fila[fim++] = i + 1; }
      if (y > 0 && m2[i - w] && !rot[i - w]) { rot[i - w] = atual; fila[fim++] = i - w; }
      if (y < h - 1 && m2[i + w] && !rot[i + w]) { rot[i + w] = atual; fila[fim++] = i + w; }
    }
    if (area > maior) { maior = area; rotMaior = atual; }
  }

  const margem = (x, y) => ({ x: x / k, y: y / k });
  if (maior < w * h * 0.12) {
    // não achou o papel: usa quase a foto inteira
    return [margem(w * .04, h * .04), margem(w * .96, h * .04), margem(w * .96, h * .96), margem(w * .04, h * .96)];
  }
  let tl, tr, br, bl;
  let sMin = Infinity, sMax = -Infinity, dMin = Infinity, dMax = -Infinity;
  for (let i = 0; i < rot.length; i++) {
    if (rot[i] !== rotMaior) continue;
    const x = i % w, y = (i / w) | 0;
    const s = x + y, df = x - y;
    if (s < sMin) { sMin = s; tl = [x, y]; }
    if (s > sMax) { sMax = s; br = [x, y]; }
    if (df > dMax) { dMax = df; tr = [x, y]; }
    if (df < dMin) { dMin = df; bl = [x, y]; }
  }
  return [margem(...tl), margem(tr[0] + 1, tr[1]), margem(br[0] + 1, br[1] + 1), margem(bl[0], bl[1] + 1)];
}

// ---------- Recorte em perspectiva ----------
function resolver(A, b) {
  const n = b.length;
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    [A[c], A[piv]] = [A[piv], A[c]]; [b[c], b[piv]] = [b[piv], b[c]];
    for (let r = c + 1; r < n; r++) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  const x = new Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k];
    x[r] = s / A[r][r];
  }
  return x;
}

function homografia(de, para) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = de[i], { x: u, y: v } = para[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  const h = resolver(A, b);
  return [...h, 1];
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function recortar(fonte, cantos) {
  const [tl, tr, br, bl] = cantos;
  let w = Math.max(dist(tl, tr), dist(bl, br));
  let h = Math.max(dist(tl, bl), dist(tr, br));
  const k = Math.min(1, MAX_SAIDA / Math.max(w, h));
  w = Math.round(w * k); h = Math.round(h * k);
  const destino = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
  const H = homografia(destino, cantos); // destino -> fonte

  const sw = fonte.width, sh = fonte.height;
  const src = fonte.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, sw, sh).data;
  const out = novoCanvas(w, h);
  const octx = out.getContext('2d');
  const img = octx.createImageData(w, h);
  const o = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const den = H[6] * x + H[7] * y + 1;
      let sx = (H[0] * x + H[1] * y + H[2]) / den;
      let sy = (H[3] * x + H[4] * y + H[5]) / den;
      if (sx < 0) sx = 0; if (sy < 0) sy = 0;
      if (sx > sw - 1.001) sx = sw - 1.001; if (sy > sh - 1.001) sy = sh - 1.001;
      const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0;
      const i00 = (y0 * sw + x0) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
      const j = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const a = src[i00 + c] + (src[i10 + c] - src[i00 + c]) * fx;
        const bb = src[i01 + c] + (src[i11 + c] - src[i01 + c]) * fx;
        o[j + c] = a + (bb - a) * fy;
      }
      o[j + 3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return out;
}

export function girar(canvas, graus) {
  graus = ((graus % 360) + 360) % 360;
  if (!graus) return canvas;
  const lado = graus === 90 || graus === 270;
  const c = novoCanvas(lado ? canvas.height : canvas.width, lado ? canvas.width : canvas.height);
  const ctx = c.getContext('2d');
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(graus * Math.PI / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return c;
}

// ---------- Filtros ----------
// 'nitido': preto e branco com fundo branco (igual "documento" do CamScanner)
// 'cor': cores realçadas, fundo clareado
// 'original': sem filtro
export function aplicarFiltro(canvas, modo = 'nitido') {
  if (modo === 'original') return canvas;
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  // fundo (iluminação) estimado em baixa resolução: máximo local + média
  const f = 8;
  const bw = Math.ceil(w / f), bh = Math.ceil(h / f);
  let fundo = new Float32Array(bw * bh);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    let mx = 0;
    for (let y = by * f; y < Math.min(h, by * f + f); y += 2)
      for (let x = bx * f; x < Math.min(w, bx * f + f); x += 2) {
        const i = (y * w + x) * 4;
        const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
        if (l > mx) mx = l;
      }
    fundo[by * bw + bx] = mx;
  }
  const filtroMax = (a, r) => {
    const b = new Float32Array(a.length);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      let m = 0;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < bh && xx >= 0 && xx < bw) { const v = a[yy * bw + xx]; if (v > m) m = v; }
      }
      b[y * bw + x] = m;
    }
    return b;
  };
  const media = (a, r) => {
    const b = new Float32Array(a.length);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      let s = 0, n = 0;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const yy = y + dy, xx = x + dx;
        if (yy >= 0 && yy < bh && xx >= 0 && xx < bw) { s += a[yy * bw + xx]; n++; }
      }
      b[y * bw + x] = s / n;
    }
    return b;
  };
  fundo = media(filtroMax(fundo, 2), 3);
  const amostra = (x, y) => {
    const fx = Math.min(bw - 1.001, Math.max(0, x / f - 0.5));
    const fy = Math.min(bh - 1.001, Math.max(0, y / f - 0.5));
    const x0 = fx | 0, y0 = fy | 0, ax = fx - x0, ay = fy - y0;
    const a = fundo[y0 * bw + x0], b = fundo[y0 * bw + x0 + 1];
    const c = fundo[(y0 + 1) * bw + x0], e = fundo[(y0 + 1) * bw + x0 + 1];
    return (a + (b - a) * ax) * (1 - ay) + (c + (e - c) * ax) * ay;
  };

  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const bg = Math.max(40, amostra(x, y));
    if (modo === 'nitido') {
      const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      let v = l / bg;               // 1 = papel, menor = tinta
      v = (v - 0.45) / (0.82 - 0.45); // estica o contraste (manchas claras viram branco)
      v = v < 0 ? 0 : v > 1 ? 1 : v;
      v = Math.pow(v, 1.35);         // escurece o texto
      const g = v * 255;
      d[i] = d[i + 1] = d[i + 2] = g;
    } else {
      for (let c = 0; c < 3; c++) {
        let v = d[i + c] / bg;
        v = (v - 0.25) / (0.95 - 0.25);
        v = v < 0 ? 0 : v > 1 ? 1 : v;
        d[i + c] = Math.pow(v, 1.2) * 255;
      }
    }
  }
  const out = novoCanvas(w, h);
  out.getContext('2d').putImageData(img, 0, 0);
  return out;
}

// Texto deitado? Compara a variação das linhas e das colunas de tinta.
export function textoEstaDeitado(canvas) {
  const k = Math.min(1, 500 / Math.max(canvas.width, canvas.height));
  const w = Math.round(canvas.width * k), h = Math.round(canvas.height * k);
  const p = novoCanvas(w, h);
  const ctx = p.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  const lin = new Float32Array(h), col = new Float32Array(w);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const tinta = d[i] < 120 ? 1 : 0;
    lin[y] += tinta; col[x] += tinta;
  }
  // variação relativa do perfil (entre linhas vizinhas): texto horizontal
  // faz o perfil das linhas alternar muito entre tinta e espaço.
  const oscila = a => {
    let m = 0; for (const v of a) m += v; m /= a.length;
    let s = 0; for (let i = 1; i < a.length; i++) s += Math.abs(a[i] - a[i - 1]);
    return s / a.length / Math.max(1e-6, m);
  };
  return oscila(col) > oscila(lin) * 1.15;
}

export function paraBlob(canvas, qualidade = 0.62) {
  return new Promise(ok => canvas.toBlob(ok, 'image/jpeg', qualidade));
}

export function miniatura(canvas, lado = 220) {
  const k = lado / Math.max(canvas.width, canvas.height);
  const c = novoCanvas(canvas.width * k, canvas.height * k);
  c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
  return paraBlob(c, 0.6);
}

export async function blobParaCanvas(blob) {
  const bmp = await createImageBitmap(blob);
  const c = novoCanvas(bmp.width, bmp.height);
  c.getContext('2d').drawImage(bmp, 0, 0);
  if (bmp.close) bmp.close();
  return c;
}
