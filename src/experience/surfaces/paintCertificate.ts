import type { Certificate } from "../../data/certificates";

const INK = "#1f1b17";
const PAPER = "#e6dcc4";
const MAT = "#1c1b1a";
const GOLD = "#9a7a3e";
const SERIF = 'Georgia, "Times New Roman", serif';

/**
 * A framed certificate as it shows inside a diploma frame: the black mat
 * around a cream sheet with a fine double border, the award typeset in a
 * serif, and a gold seal. No name on it: the subject's name is only revealed
 * when the dossier opens.
 *
 * `w` x `h` must match the frame's inner panel (see AchievementShelf).
 */
export function paintCertificate(cert: Certificate, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = MAT;
  ctx.fillRect(0, 0, w, h);

  // The sheet, inset in the mat as the frame model's own artwork has it.
  const mx = w * 0.11;
  const my = h * 0.1;
  const sw = w - mx * 2;
  const sh = h - my * 2;
  ctx.fillStyle = PAPER;
  ctx.fillRect(mx, my, sw, sh);
  // A little age toward the edges.
  const vignette = ctx.createRadialGradient(w / 2, h / 2, sh * 0.3, w / 2, h / 2, sw * 0.65);
  vignette.addColorStop(0, "rgba(120,95,55,0)");
  vignette.addColorStop(1, "rgba(120,95,55,0.22)");
  ctx.fillStyle = vignette;
  ctx.fillRect(mx, my, sw, sh);

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(1, w * 0.006);
  ctx.strokeRect(mx + sw * 0.03, my + sh * 0.04, sw * 0.94, sh * 0.92);
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.strokeRect(mx + sw * 0.05, my + sh * 0.07, sw * 0.9, sh * 0.86);

  const cx = w / 2;
  const line = (text: string, y: number, px: number, style = "", color = INK) => {
    ctx.font = `${style} ${px}px ${SERIF}`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, my + sh * y, sw * 0.8);
  };
  const u = sh / 100;
  line("CERTIFICATE", 0.2, u * 11, "bold");
  line("of Achievement", 0.32, u * 6.5, "italic", GOLD);
  line("awarded for excellence in", 0.45, u * 4.5, "italic");
  line(cert.title, 0.58, u * 9, "bold");
  line(`${cert.issuer} · ${cert.year}`, 0.71, u * 4.5);

  // Signature lines either side of the seal.
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, w * 0.002);
  for (const x of [0.2, 0.62]) {
    ctx.beginPath();
    ctx.moveTo(mx + sw * x, my + sh * 0.84);
    ctx.lineTo(mx + sw * (x + 0.18), my + sh * 0.84);
    ctx.stroke();
  }

  // The gold seal.
  const sy = my + sh * 0.83;
  const r = sh * 0.075;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r : r * 1.15;
    ctx.lineTo(cx + Math.cos(a) * rr, sy + Math.sin(a) * rr);
  }
  ctx.fill();
  ctx.strokeStyle = "#e2c98a";
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath();
  ctx.arc(cx, sy, r * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  return canvas;
}
