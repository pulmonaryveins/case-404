import type { DesignPiece } from "../../data/designWork";

const HAND = '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';
/** Soft graphite: a light, slightly blue grey, never black. */
const GRAPHITE = "rgba(78, 79, 88, 0.82)";
const PAPER = "#ece5d2";

function rng(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

/** Wraps `s` to `maxW` in the current font; returns the lines. */
function wrap(ctx: CanvasRenderingContext2D, s: string, maxW: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of s.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Graphite's texture as a mask: specks, and short streaks along a pencil's
 * drag, big enough to see in a close-up. ~70k small draws, so it is painted
 * once and every back rubs it out of its writing with a single drawImage.
 */
const grainMasks = new Map<number, HTMLCanvasElement>();
function grainMask(size: number) {
  let mask = grainMasks.get(size);
  if (mask) return mask;
  mask = document.createElement("canvas");
  mask.width = mask.height = size;
  const g = mask.getContext("2d")!;
  const k = size / 768;
  const r = rng(4049);
  const styles = Array.from({ length: 8 }, (_, i) => `rgba(0,0,0,${0.25 + i * 0.06})`);
  for (let i = 0; i < Math.round(30000 * k * k); i++) {
    g.fillStyle = styles[i % 8];
    g.fillRect(r() * size, r() * size, k * (1 + r()), k * (1 + r()));
  }
  // Streaks batched into one path per shade.
  g.lineWidth = 0.9 * k;
  const streaks = Math.round(9000 * k * k);
  for (let shade = 0; shade < 8; shade++) {
    g.strokeStyle = styles[shade];
    g.beginPath();
    for (let i = shade; i < streaks; i += 8) {
      const x = r() * size;
      const y = r() * size;
      const a = -0.6 + (r() - 0.5) * 0.4;
      const len = (4 + r() * 6) * k;
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    }
    g.stroke();
  }
  grainMasks.set(size, mask);
  return mask;
}

/**
 * The back of a print: plain off-white stock with its number and the facts
 * about the piece written on it in pencil, and in the space below a rough
 * thumbnail of the layout, as a designer scribbles on the back of a proof.
 *
 * The pencil is laid down on its own layer: thin, light grey, a second faint
 * pass a hair off for the uneven line, then graphite's texture rubbed out of
 * it (specks, and short streaks along the pencil's drag), and multiplied onto
 * the paper so the stock's grain shows through.
 */
export function paintPosterBack(piece: DesignPiece, number: number, size = 1024) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const k = size / 768;
  const r = rng(101 + number * 31);

  // The stock: off-white with fibres and a little handling grime.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < Math.round(2600 * k * k); i++) {
    ctx.fillStyle = r() > 0.5 ? "rgba(255,255,248,0.35)" : "rgba(120,104,72,0.08)";
    ctx.fillRect(r() * size, r() * size, (1 + r() * 3) * k, k);
  }
  const edge = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.3,
    size / 2,
    size / 2,
    size * 0.75,
  );
  edge.addColorStop(0, "rgba(110,90,50,0)");
  edge.addColorStop(1, "rgba(110,90,50,0.16)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);

  // The pencil, on its own layer.
  const layer = document.createElement("canvas");
  layer.width = layer.height = size;
  const lc = layer.getContext("2d")!;
  lc.fillStyle = GRAPHITE;
  lc.strokeStyle = GRAPHITE;
  lc.lineCap = "round";
  lc.textBaseline = "alphabetic";
  const m = 70 * k;
  const width = size - m * 2;
  const write = (s: string, x: number, y: number, px: number, tilt = 0) => {
    lc.save();
    lc.translate(x, y);
    lc.rotate(tilt);
    lc.font = `${px}px ${HAND}`;
    lc.fillText(s, 0, 0);
    lc.globalAlpha = 0.2;
    lc.fillText(s, 0.5 * k, 0.4 * k);
    lc.restore();
  };
  /** A hand-drawn line: two light passes, each a little off the true line. */
  const rough = (x0: number, y0: number, x1: number, y1: number, w = 1.6) => {
    lc.lineWidth = w * k;
    for (let pass = 0; pass < 2; pass++) {
      const j = () => (r() - 0.5) * 2.4 * k;
      lc.globalAlpha = pass ? 0.45 : 0.85;
      lc.beginPath();
      lc.moveTo(x0 + j(), y0 + j());
      lc.quadraticCurveTo((x0 + x1) / 2 + j(), (y0 + y1) / 2 + j(), x1 + j(), y1 + j());
      lc.stroke();
    }
    lc.globalAlpha = 1;
  };

  // Its number, circled, as on the sticky note on the front; the circle is
  // drawn round however wide the number is.
  write(`#${number}`, m, 110 * k, 60 * k, -0.04);
  lc.font = `${60 * k}px ${HAND}`;
  const numberWidth = lc.measureText(`#${number}`).width;
  lc.lineWidth = 1.8 * k;
  lc.beginPath();
  lc.ellipse(
    m + numberWidth / 2,
    88 * k,
    numberWidth / 2 + 24 * k,
    44 * k,
    -0.08,
    0.2,
    Math.PI * 2.05,
  );
  lc.stroke();

  let y = 210 * k;
  lc.font = `${48 * k}px ${HAND}`;
  for (const line of wrap(lc, piece.title, width)) {
    write(line, m, y, 48 * k, -0.012);
    y += 60 * k;
  }
  // A quick double underline under the title.
  rough(m, y - 34 * k, m + width * 0.8, y - 36 * k);
  rough(m + 6 * k, y - 26 * k, m + width * 0.74, y - 27 * k, 1.2);
  y += 30 * k;

  const fields: [string, string | undefined][] = [
    ["For", piece.client],
    ["When", piece.when],
    ["Made with", piece.tools],
  ];
  for (const [label, value] of fields) {
    if (!value) continue;
    lc.font = `${32 * k}px ${HAND}`;
    for (const [i, line] of wrap(lc, `${label}: ${value}`, width).entries()) {
      write(line, m + (i ? 30 * k : 0), y, 32 * k, -0.008);
      y += 44 * k;
    }
  }
  if (piece.note) {
    y += 10 * k;
    lc.font = `${30 * k}px ${HAND}`;
    for (const line of wrap(lc, piece.note, width)) {
      if (y > size - 60 * k) break;
      write(line, m, y, 30 * k, -0.01);
      y += 42 * k;
    }
  }

  // In the space left, a rough thumbnail of the layout: a frame, a heading
  // block, scribbled lines of copy and an image area crossed through.
  const top = y + 20 * k;
  const bottom = size - 70 * k;
  if (bottom - top > 110 * k) {
    const h = Math.min(bottom - top, 330 * k);
    const w = h;
    const x0 = m + 10 * k;
    const y0 = top + (bottom - top - h) / 2;
    rough(x0, y0, x0 + w, y0);
    rough(x0 + w, y0, x0 + w, y0 + h);
    rough(x0 + w, y0 + h, x0, y0 + h);
    rough(x0, y0 + h, x0, y0);
    // Heading block, hatched.
    const hx = x0 + w * 0.14;
    const hy = y0 + h * 0.12;
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      rough(hx + w * 0.72 * t, hy, hx + w * 0.72 * t - w * 0.08, hy + h * 0.14, 1.1);
    }
    // Image area, crossed through.
    const ix = x0 + w * 0.14;
    const iy = y0 + h * 0.36;
    const iw = w * 0.72;
    const ih = h * 0.34;
    rough(ix, iy, ix + iw, iy, 1.3);
    rough(ix + iw, iy, ix + iw, iy + ih, 1.3);
    rough(ix + iw, iy + ih, ix, iy + ih, 1.3);
    rough(ix, iy + ih, ix, iy, 1.3);
    rough(ix, iy, ix + iw, iy + ih, 1.1);
    rough(ix + iw, iy, ix, iy + ih, 1.1);
    // Lines of copy.
    for (let i = 0; i < 3; i++) {
      const ly = y0 + h * (0.78 + i * 0.07);
      rough(x0 + w * 0.14, ly, x0 + w * (0.86 - i * 0.12), ly, 1.1);
    }
    // A note to self beside it, with an arrow.
    const ax = x0 + w + 30 * k;
    write("rough", ax + 20 * k, y0 + h * 0.3, 30 * k, -0.06);
    write("layout", ax + 20 * k, y0 + h * 0.3 + 38 * k, 30 * k, -0.06);
    rough(ax + 14 * k, y0 + h * 0.34, x0 + w + 8 * k, y0 + h * 0.46, 1.4);
    rough(x0 + w + 8 * k, y0 + h * 0.46, x0 + w + 26 * k, y0 + h * 0.44, 1.4);
    rough(x0 + w + 8 * k, y0 + h * 0.46, x0 + w + 20 * k, y0 + h * 0.39, 1.4);
  }

  // Graphite's texture, rubbed out of the pencil (not the paper), from the
  // shared grain mask, mirrored differently per print so no two backs match.
  lc.globalCompositeOperation = "destination-out";
  lc.save();
  lc.translate(number % 2 ? size : 0, number % 4 >= 2 ? size : 0);
  lc.scale(number % 2 ? -1 : 1, number % 4 >= 2 ? -1 : 1);
  lc.drawImage(grainMask(size), 0, 0);
  lc.restore();

  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(layer, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  return canvas;
}

/** A yellow sticky note with a number scrawled on it in marker. */
export function paintStickyNote(number: number, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, "#f2d45c");
  g.addColorStop(0.18, "#f6dc6a");
  g.addColorStop(1, "#e9c64c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // The gummed strip along the top reads a touch darker.
  ctx.fillStyle = "rgba(150,110,20,0.12)";
  ctx.fillRect(0, 0, size, size * 0.16);
  ctx.fillStyle = "#1d1a16";
  ctx.font = `bold ${size * 0.5}px ${HAND}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(number), size * 0.5, size * 0.58);
  return canvas;
}
