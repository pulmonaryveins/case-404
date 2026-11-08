import { profile } from "../../data/profile";
import { imagePdf } from "../../lib/imagePdf";
import { paintResume } from "../surfaces/paintResume";

/** Print resolution of the downloadable copy: A4 at 300 dpi. */
const PDF_WIDTH = 2480;
const FILE_NAME = `${profile.name
  .join(" ")
  .toLowerCase()
  .replace(/\b\w/g, (c) => c.toUpperCase())
  .replace(/\s+/g, "-")}-Resume.pdf`;

/** Paints the resume at print resolution and hands it to the visitor as a PDF. */
export async function downloadResume() {
  const canvas = paintResume(PDF_WIDTH);
  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", 0.9));
  if (!blob) return;
  const pdf = imagePdf(new Uint8Array(await blob.arrayBuffer()), canvas.width, canvas.height);
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = FILE_NAME;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
