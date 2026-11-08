/**
 * A one-page PDF holding a single JPEG, filling an A4 page: enough to hand the
 * visitor a downloadable copy of a painted document without a PDF library.
 * The page is the image, so its text is not selectable.
 */
const A4 = { w: 595.28, h: 841.89 };

export function imagePdf(jpeg: Uint8Array, widthPx: number, heightPx: number) {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? enc.encode(chunk) : chunk;
    parts.push(bytes);
    length += bytes.length;
  };
  const object = (n: number, body: string | (string | Uint8Array)[]) => {
    offsets[n] = length;
    push(`${n} 0 obj\n`);
    for (const piece of Array.isArray(body) ? body : [body]) push(piece);
    push("\nendobj\n");
  };

  const draw = `q ${A4.w} 0 0 ${A4.h} 0 0 cm /Im0 Do Q`;
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.w} ${A4.h}] ` +
      "/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>",
  );
  object(4, [
    `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} ` +
      `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    jpeg,
    "\nendstream",
  ]);
  object(5, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);

  const xref = length;
  push(`xref\n0 6\n0000000000 65535 f \n`);
  for (let n = 1; n <= 5; n++) push(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
