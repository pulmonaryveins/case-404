import { boardIslands, type BoardPieceId } from "./boardIslands";
import { caseFile, pieces, tags, type PieceKind } from "../../data/evidenceBoard";

const INK = "#1f1b17";
const RED = "#8e221d";
const PAPER = "#ddd0b2";
const TYPE = '"Courier New", Courier, monospace';

type Ctx = CanvasRenderingContext2D;

/** Seeded PRNG so grain and fibres are identical on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/**
 * Points the context at one paper piece: afterwards (0,0) is the paper's
 * top-left corner and x/y run along its own right/down axes in atlas pixels,
 * whatever way the piece is rotated inside the atlas. Returns its size.
 */
function enterPiece(ctx: Ctx, piece: BoardPieceId, size: number) {
  const { uv, right, down } = boardIslands[piece];
  const [x0, y0, x1, y1] = uv.map((n) => n * size);
  const along = (axis: 0 | 1, lo: number, hi: number) =>
    right[axis] === 1 || down[axis] === 1 ? lo : hi;
  ctx.setTransform(right[0], right[1], down[0], down[1], along(0, x0, x1), along(1, y0, y1));
  const w = right[0] !== 0 ? x1 - x0 : y1 - y0;
  const h = down[0] !== 0 ? x1 - x0 : y1 - y0;
  return { w, h };
}

function grain(ctx: Ctx, w: number, h: number, seed: number, alpha: number) {
  const r = rng(seed);
  for (let i = 0; i < (w * h) / 40; i++) {
    ctx.fillStyle = r() > 0.5 ? `rgba(255,250,240,${alpha})` : `rgba(40,30,20,${alpha})`;
    ctx.fillRect(r() * w, r() * h, 1.5, 1.5);
  }
}

/** Paper fibres plus slightly darker, worn edges — aged but kept. */
function agedPaper(ctx: Ctx, w: number, h: number, color: string, seed: number) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  const r = rng(seed);
  ctx.strokeStyle = "rgba(90,70,45,0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i < (w * h) / 900; i++) {
    const x = r() * w;
    const y = r() * h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 18, y + (r() - 0.5) * 6);
    ctx.stroke();
  }
  const edge = ctx.createLinearGradient(0, 0, w, 0);
  edge.addColorStop(0, "rgba(80,55,30,0.16)");
  edge.addColorStop(0.08, "rgba(80,55,30,0)");
  edge.addColorStop(0.92, "rgba(80,55,30,0)");
  edge.addColorStop(1, "rgba(80,55,30,0.16)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, seed + 3, 0.035);
}

function type(ctx: Ctx, s: string, x: number, y: number, px: number, color = INK) {
  ctx.fillStyle = color;
  ctx.font = `bold ${px}px ${TYPE}`;
  ctx.fillText(s, x, y);
}

function stamp(ctx: Ctx, s: string, cx: number, cy: number, px: number, angle: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.75;
  ctx.font = `bold ${px}px ${TYPE}`;
  const w = ctx.measureText(s).width + px * 0.7;
  ctx.strokeStyle = RED;
  ctx.lineWidth = px * 0.1;
  ctx.strokeRect(-w / 2, -px * 0.8, w, px * 1.3);
  ctx.fillStyle = RED;
  ctx.textAlign = "center";
  ctx.fillText(s, 0, px * 0.3);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* World map + case file                                               */
/* ------------------------------------------------------------------ */

/**
 * Keeps the board's own world map but pushes it toward an archival sepia,
 * then lays a smaller CASE 404 file over its centre.
 */
function paintMapAndCaseFile(ctx: Ctx, atlas: CanvasImageSource, size: number) {
  const [u0, v0, u1, v1] = boardIslands[caseFile.piece].uv.map((n) => n * size);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = "sepia(0.9) saturate(0.85) brightness(0.8) contrast(0.85)";
  ctx.drawImage(atlas, u0, v0, u1 - u0, v1 - v0, u0, v0, u1 - u0, v1 - v0);
  ctx.filter = "none";
  // Warm archival wash so the map reads as old paper, not a print-out.
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "#d9c49c";
  ctx.fillRect(u0, v0, u1 - u0, v1 - v0);
  ctx.globalCompositeOperation = "source-over";

  const { w, h } = enterPiece(ctx, caseFile.piece, size);
  // Faint fold lines: the map has been folded and pinned up many times.
  ctx.fillStyle = "rgba(60,40,20,0.10)";
  ctx.fillRect(w / 2 - 1, 0, 2, h);
  ctx.fillRect(0, h / 2 - 1, w, 2);

  const [fx, fy, fw, fh] = caseFile.rect;
  const x = fx * w;
  const y = fy * h;
  const dw = fw * w;
  const dh = fh * h;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = PAPER;
  ctx.fillRect(x, y, dw, dh);
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  agedPaper(ctx, dw, dh, PAPER, 11);
  paintCaseFile(ctx, dw, dh);
  ctx.restore();
}

function paintCaseFile(ctx: Ctx, w: number, h: number) {
  const m = w * 0.08;
  ctx.textAlign = "center";
  ctx.font = `bold ${h * 0.11}px ${TYPE}`;
  const [caseWord, number] = caseFile.title;
  const caseW = ctx.measureText(`${caseWord} `).width;
  const total = ctx.measureText(`${caseWord} ${number}`).width;
  ctx.textAlign = "left";
  type(ctx, `${caseWord} `, w / 2 - total / 2, h * 0.15, h * 0.11);
  type(ctx, number, w / 2 - total / 2 + caseW, h * 0.15, h * 0.11, RED);

  ctx.textAlign = "center";
  type(ctx, caseFile.subtitle, w / 2, h * 0.24, h * 0.05);
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.fillRect(m, h * 0.275, w - m * 2, 2);

  // Anonymous subject photo, taped on.
  const px = m;
  const py = h * 0.32;
  const pw = w * 0.46;
  const ph = h * 0.42;
  ctx.fillStyle = "#3b3834";
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = "#4a4640";
  ctx.fillRect(px + pw * 0.05, py + ph * 0.04, pw * 0.9, ph * 0.92);
  ctx.fillStyle = "#16130f";
  ctx.beginPath();
  ctx.arc(px + pw / 2, py + ph * 0.4, pw * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(px + pw / 2, py + ph * 1.02, pw * 0.42, ph * 0.38, 0, Math.PI, 0);
  ctx.fill();
  ctx.textAlign = "center";
  type(ctx, "?", px + pw / 2, py + ph * 0.47, ph * 0.2, "#cfc6b4");
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(235,228,205,0.55)";
  ctx.fillRect(px - pw * 0.06, py - ph * 0.03, pw * 0.3, ph * 0.07);
  ctx.fillRect(px + pw * 0.76, py - ph * 0.03, pw * 0.3, ph * 0.07);

  let fyy = py + h * 0.04;
  const fx = px + pw + w * 0.05;
  for (const f of caseFile.fields) {
    type(ctx, f.label, fx, fyy, h * 0.03);
    type(ctx, f.value, fx, fyy + h * 0.055, f.accent ? h * 0.06 : h * 0.038, f.accent ? RED : INK);
    fyy += h * 0.14;
  }

  // Barcode + stamp along the foot of the file.
  const r = rng(77);
  let bx = m;
  ctx.fillStyle = INK;
  while (bx < m + w * 0.28) {
    const bw = 1 + Math.floor(r() * 4);
    ctx.fillRect(bx, h * 0.83, bw, h * 0.07);
    bx += bw + 2 + Math.floor(r() * 3);
  }
  stamp(ctx, caseFile.stamp, w * 0.66, h * 0.87, h * 0.045, -0.12);
}

/* ------------------------------------------------------------------ */
/* Evidence pieces                                                     */
/* ------------------------------------------------------------------ */

function paintKind(ctx: Ctx, kind: PieceKind, w: number, h: number, seed: number) {
  const r = rng(seed);
  switch (kind) {
    case "codeEditor": {
      // Photo of a dark code editor: gutter, indented syntax-coloured lines.
      ctx.fillStyle = "#1c1d21";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#2a2b30";
      ctx.fillRect(0, 0, w * 0.12, h);
      const colors = ["#9b7bb0", "#7aa0b8", "#c5a46a", "#8fb08a", "#b8b2a6"];
      for (let i = 0; i < 14; i++) {
        let x = w * 0.16 + (i % 5 === 0 ? 0 : (1 + (i % 3)) * w * 0.05);
        const y = h * (0.07 + i * 0.065);
        for (let t = 0; t < 1 + Math.floor(r() * 3); t++) {
          const len = w * (0.08 + r() * 0.2);
          ctx.fillStyle = colors[Math.floor(r() * colors.length)];
          ctx.fillRect(x, y, Math.min(len, w * 0.95 - x), h * 0.025);
          x += len + w * 0.03;
        }
      }
      break;
    }
    case "codePrintout": {
      ctx.fillStyle = "#cfc4ae";
      ctx.fillRect(0, 0, w, h);
      const lines = ["<header>", "  <nav>", "  <main", '   id="404"', "  />", "</header>"];
      ctx.font = `bold ${h * 0.075}px ${TYPE}`;
      ctx.fillStyle = "#2d2a26";
      lines.forEach((l, i) => ctx.fillText(l, w * 0.08, h * (0.16 + i * 0.13)));
      break;
    }
    case "workspaceSilhouette": {
      // Unidentified person at a desk, from behind, lit by a monitor.
      ctx.fillStyle = "#3a3733";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#a9a294";
      ctx.fillRect(w * 0.45, h * 0.18, w * 0.42, h * 0.3);
      ctx.fillStyle = "#121110";
      ctx.beginPath();
      ctx.arc(w * 0.38, h * 0.38, w * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(w * 0.38, h * 0.85, w * 0.3, h * 0.35, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(0, h * 0.72, w, h * 0.06);
      break;
    }
    case "wireframeSheet": {
      // Pencil UX sketch: three screens joined by flow arrows.
      ctx.fillStyle = "#d4cab3";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#4b4740";
      ctx.lineWidth = 2;
      const sw = w * 0.24;
      const sh = h * 0.62;
      for (let i = 0; i < 3; i++) {
        const sx = w * (0.06 + i * 0.32);
        const sy = h * 0.14;
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.strokeRect(sx + sw * 0.1, sy + sh * 0.08, sw * 0.8, sh * 0.1);
        ctx.strokeRect(sx + sw * 0.1, sy + sh * 0.24, sw * 0.8, sh * 0.32);
        ctx.beginPath();
        ctx.moveTo(sx + sw * 0.1, sy + sh * 0.24);
        ctx.lineTo(sx + sw * 0.9, sy + sh * 0.56);
        ctx.moveTo(sx + sw * 0.9, sy + sh * 0.24);
        ctx.lineTo(sx + sw * 0.1, sy + sh * 0.56);
        ctx.stroke();
        for (let l = 0; l < 3; l++)
          ctx.fillRect(sx + sw * 0.1, sy + sh * (0.64 + l * 0.08), sw * 0.6, 2);
        if (i < 2) {
          ctx.beginPath();
          ctx.moveTo(sx + sw + w * 0.01, sy + sh * 0.4);
          ctx.lineTo(sx + sw + w * 0.07, sy + sh * 0.4);
          ctx.lineTo(sx + sw + w * 0.05, sy + sh * 0.36);
          ctx.stroke();
        }
      }
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.arc(w * 0.18, h * 0.47, w * 0.06, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = RED;
      ctx.stroke();
      break;
    }
    case "skyline": {
      // Coastal city at dusk, black and white.
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#8d877c");
      sky.addColorStop(1, "#c9c2b4");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#2b2926";
      let x = 0;
      while (x < w) {
        const bw = w * (0.05 + r() * 0.09);
        const bh = h * (0.15 + r() * 0.4);
        ctx.fillRect(x, h * 0.68 - bh, bw, bh);
        x += bw + w * 0.01;
      }
      ctx.fillStyle = "#5b5750";
      ctx.fillRect(0, h * 0.68, w, h * 0.32);
      ctx.fillStyle = "rgba(220,214,200,0.35)";
      for (let i = 0; i < 6; i++) ctx.fillRect(r() * w, h * (0.72 + r() * 0.22), w * 0.2, 1.5);
      break;
    }
    case "posterLetter": {
      ctx.fillStyle = "#1e2730";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#b7452c";
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.32, w * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e8e0cf";
      ctx.font = `bold ${h * 0.7}px Georgia, "Times New Roman", serif`;
      ctx.fillText("A", w * 0.06, h * 0.8);
      ctx.fillStyle = "#d3a648";
      ctx.fillRect(w * 0.08, h * 0.86, w * 0.5, h * 0.05);
      break;
    }
    case "shapeStudy": {
      ctx.fillStyle = "#d9d0bd";
      ctx.fillRect(0, 0, w, h);
      const shapes: [string, number, number, number, number][] = [
        ["#2d4a63", 0.3, 0.3, 0, Math.PI],
        ["#b7452c", 0.3, 0.3, Math.PI, Math.PI * 2],
        ["#d3a648", 0.7, 0.62, 0, Math.PI * 2],
        ["#1f1b17", 0.32, 0.72, Math.PI / 2, Math.PI * 1.5],
      ];
      for (const [c, cx, cy, a0, a1] of shapes) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(cx * w, cy * h);
        ctx.arc(cx * w, cy * h, w * 0.22, a0, a1);
        ctx.fill();
      }
      break;
    }
    case "editingTimeline": {
      // Editing software: preview frame, timecode, clip tracks, audio, playhead.
      ctx.fillStyle = "#1b1c20";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#6d6a63";
      ctx.fillRect(w * 0.25, h * 0.05, w * 0.5, h * 0.3);
      ctx.fillStyle = "#1a1917";
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.15, w * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(w * 0.47, h * 0.17, w * 0.06, h * 0.18);
      ctx.fillStyle = "#c8c0b0";
      ctx.font = `bold ${h * 0.055}px ${TYPE}`;
      ctx.fillText("00:04:04:12", w * 0.3, h * 0.43);
      const clipColors = ["#5b7fa3", "#7d9c6b", "#9a6aa3"];
      for (let t = 0; t < 3; t++) {
        let x = w * 0.04;
        while (x < w * 0.96) {
          const len = w * (0.12 + r() * 0.22);
          ctx.fillStyle = clipColors[t];
          ctx.fillRect(x, h * (0.5 + t * 0.09), Math.min(len, w * 0.96 - x), h * 0.07);
          x += len + w * 0.015;
        }
      }
      ctx.fillStyle = "#4c8a68";
      for (let x = w * 0.04; x < w * 0.96; x += 3) {
        const a = h * 0.04 * (0.3 + r());
        ctx.fillRect(x, h * 0.86 - a / 2, 2, a);
      }
      ctx.fillStyle = "#d33b2c";
      ctx.fillRect(w * 0.58, h * 0.46, 3, h * 0.48);
      break;
    }
    case "filmStrip": {
      ctx.fillStyle = "#171614";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#d8d0c0";
      for (let y = h * 0.04; y < h; y += h * 0.09) {
        ctx.fillRect(w * 0.04, y, w * 0.08, h * 0.04);
        ctx.fillRect(w * 0.88, y, w * 0.08, h * 0.04);
      }
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `rgb(${110 + i * 20},${104 + i * 20},${96 + i * 20})`;
        ctx.fillRect(w * 0.18, h * (0.05 + i * 0.32), w * 0.64, h * 0.28);
        ctx.fillStyle = "#24221f";
        ctx.beginPath();
        ctx.arc(w * (0.4 + i * 0.08), h * (0.16 + i * 0.32), w * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "photoBack":
      break;
  }
  grain(ctx, w, h, seed + 1, 0.07);
}

function paintPieces(ctx: Ctx, size: number) {
  pieces.forEach((p, i) => {
    const { w, h } = enterPiece(ctx, p.piece, size);
    if (p.kind === "photoBack" || p.kind === "wireframeSheet") {
      // Whole sheet repainted: back of a print, or a loose paper sketch.
      if (p.kind === "photoBack") {
        agedPaper(ctx, w, h, "#7f725c", 200 + i);
        ctx.fillStyle = "rgba(60,50,40,0.18)";
        ctx.font = `${h * 0.07}px ${TYPE}`;
        ctx.fillText("—", w * 0.1, h * 0.2);
      } else {
        paintKind(ctx, p.kind, w, h, 100 + i * 17);
      }
      return;
    }
    // Photos keep a thin print border and a slightly deeper bottom margin.
    const inset = w * 0.035;
    const iw = w - inset * 2;
    const ih = h * 0.8;
    ctx.fillStyle = "#d9d0bd";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(inset, inset);
    ctx.beginPath();
    ctx.rect(0, 0, iw, ih);
    ctx.clip();
    paintKind(ctx, p.kind, iw, ih, 100 + i * 17);
    ctx.restore();
  });
}

function paintTags(ctx: Ctx, size: number) {
  for (const tag of tags) {
    const { w, h } = enterPiece(ctx, tag.piece, size);
    agedPaper(ctx, w, h, tag.lines.length ? "#d8c8a4" : "#7f725c", 31);
    if (tag.lines.length === 0) continue;
    const longest = Math.max(...tag.lines.map((l) => l.length));
    const px = Math.min(h * 0.2, (w * 0.86) / (longest * 0.62));
    ctx.textAlign = "center";
    tag.lines.forEach((line, i) =>
      type(
        ctx,
        line,
        w / 2,
        h * 0.5 + (i - (tag.lines.length - 1) / 2) * px * 1.15 + px * 0.35,
        px,
      ),
    );
    ctx.textAlign = "left";
  }
}

/**
 * Copies the board's original colour atlas and repaints every paper piece
 * with CASE 404 content in place — same UV islands, same geometry, same
 * baked shadows on the cork.
 */
export function paintCaseBoard(atlas: ImageBitmap | HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = atlas.width;
  canvas.height = atlas.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(atlas, 0, 0);
  const size = canvas.width;
  paintMapAndCaseFile(ctx, atlas, size);
  paintPieces(ctx, size);
  paintTags(ctx, size);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}
