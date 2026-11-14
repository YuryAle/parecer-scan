// Gera um PDF de uma página com a imagem JPEG do parecer (sem bibliotecas).
export async function jpegParaPdf(jpegBlob, largura, altura) {
  const jpg = new Uint8Array(await jpegBlob.arrayBuffer());
  const pw = 595.28; // largura A4 em pontos
  const ph = +(pw * altura / largura).toFixed(2);
  const enc = new TextEncoder();
  const partes = [];
  const offsets = [];
  let pos = 0;
  const add = d => { const b = typeof d === 'string' ? enc.encode(d) : d; partes.push(b); pos += b.length; };

  add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const obj = (n, corpo) => { offsets[n] = pos; add(`${n} 0 obj\n`); corpo(); add('\nendobj\n'); };
  const conteudo = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;

  obj(1, () => add('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  obj(3, () => add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`));
  obj(4, () => {
    add(`<< /Type /XObject /Subtype /Image /Width ${largura} /Height ${altura} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`);
    add(jpg);
    add('\nendstream');
  });
  obj(5, () => add(`<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`));

  const xref = pos;
  let tabela = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) tabela += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  add(tabela);
  add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(partes, { type: 'application/pdf' });
}
