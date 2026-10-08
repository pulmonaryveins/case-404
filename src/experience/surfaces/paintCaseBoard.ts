import { boardIslands, type BoardPieceId } from "./boardIslands";
import { caseFile, mapStains, pieces, tags, type PieceKind } from "../../data/evidenceBoard";

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

const HAND = '"Segoe Print", "Bradley Hand", "Comic Sans MS", cursive';

/** A loose, hand-scrawled note instead of a typeset label — slightly tilted. */
function scrawl(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  px: number,
  { color = INK, rotation = 0, weight = "normal" } = {},
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.font = `${weight} ${px}px ${HAND}`;
  ctx.fillText(s, 0, 0);
  ctx.restore();
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
 * Covers each baked shadow in `mapStains` with a feathered copy of clean map
 * from just beside it. Source and target are both in atlas space, so the
 * patch keeps the atlas orientation. Expects the context to be inside the
 * map piece (see enterPiece).
 */
function healMapStains(ctx: Ctx, w: number, h: number) {
  const m = ctx.getTransform();
  const { mapBounds, patches } = mapStains;
  const ds = mapBounds.s[1] - mapBounds.s[0];
  const dt = mapBounds.t[1] - mapBounds.t[0];
  /** Atlas-space rectangle covering the paper rect (x, y, pw x ph). */
  const atlasRect = (x: number, y: number, pw: number, ph: number) => {
    const at = (px: number, py: number) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f];
    const [x0, y0] = at(x, y);
    const [x1, y1] = at(x + pw, y + ph);
    return {
      x: Math.min(x0, x1),
      y: Math.min(y0, y1),
      w: Math.abs(x1 - x0),
      h: Math.abs(y1 - y0),
    };
  };
  const patch = document.createElement("canvas");

  for (const { s, t, hw, hh, from } of patches) {
    const pw = ((hw * 2) / ds) * w;
    const ph = ((hh * 2) / dt) * h;
    const x = ((s - mapBounds.s[0]) / ds) * w - pw / 2;
    const y = ((mapBounds.t[1] - t) / dt) * h - ph / 2;
    const dest = atlasRect(x, y, pw, ph);
    const src = atlasRect(x, y - from * (ph + 4), pw, ph);
    patch.width = Math.ceil(dest.w);
    patch.height = Math.ceil(dest.h);
    const pctx = patch.getContext("2d")!;
    pctx.globalCompositeOperation = "source-over";
    pctx.clearRect(0, 0, patch.width, patch.height);
    pctx.drawImage(ctx.canvas, src.x, src.y, src.w, src.h, 0, 0, patch.width, patch.height);
    // Elliptical feather: opaque core, transparent rim.
    const side = Math.max(patch.width, patch.height);
    const fade = pctx.createRadialGradient(0, 0, side * 0.2, 0, 0, side / 2);
    fade.addColorStop(0, "rgba(0,0,0,1)");
    fade.addColorStop(1, "rgba(0,0,0,0)");
    pctx.globalCompositeOperation = "destination-in";
    pctx.translate(patch.width / 2, patch.height / 2);
    pctx.scale(patch.width / side, patch.height / side);
    pctx.fillStyle = fade;
    pctx.fillRect(-side, -side, side * 2, side * 2);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(patch, dest.x, dest.y);
    ctx.restore();
  }
}

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
  healMapStains(ctx, w, h);
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

/**
 * Black-and-white press-style photograph of an unidentifiable person: soft
 * focus, a smeared face, grain, scratches and a vignette.
 */
export function paintPortrait(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, "#82817a");
  bg.addColorStop(1, "#3d3c38");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  const glow = ctx.createRadialGradient(
    x + w * 0.3,
    y + h * 0.3,
    0,
    x + w * 0.3,
    y + h * 0.3,
    w * 0.7,
  );
  glow.addColorStop(0, "rgba(225,223,214,0.4)");
  glow.addColorStop(1, "rgba(225,223,214,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);

  // The figure is drawn separately so it can be blurred as one soft shape.
  const fig = document.createElement("canvas");
  fig.width = Math.ceil(w);
  fig.height = Math.ceil(h);
  const f = fig.getContext("2d")!;
  const cx = w * 0.5;
  const hy = h * 0.38;
  f.fillStyle = "#18181a"; // jacket
  f.beginPath();
  f.moveTo(w * 0.02, h);
  f.quadraticCurveTo(w * 0.06, h * 0.72, w * 0.3, h * 0.66);
  f.lineTo(w * 0.7, h * 0.66);
  f.quadraticCurveTo(w * 0.94, h * 0.72, w * 0.98, h);
  f.closePath();
  f.fill();
  f.fillStyle = "#b9b8b1"; // shirt collar
  f.beginPath();
  f.moveTo(w * 0.38, h * 0.66);
  f.lineTo(w * 0.5, h * 0.86);
  f.lineTo(w * 0.62, h * 0.66);
  f.lineTo(w * 0.56, h * 0.64);
  f.lineTo(w * 0.5, h * 0.73);
  f.lineTo(w * 0.44, h * 0.64);
  f.closePath();
  f.fill();
  f.fillStyle = "#55544f"; // neck
  f.fillRect(w * 0.43, h * 0.5, w * 0.14, h * 0.18);
  const skin = f.createLinearGradient(w * 0.3, 0, w * 0.7, 0);
  skin.addColorStop(0, "#c2c1b9");
  skin.addColorStop(1, "#6a6963");
  f.fillStyle = "#85847e"; // ears
  f.beginPath();
  f.ellipse(cx - w * 0.175, hy + h * 0.02, w * 0.03, h * 0.06, 0, 0, Math.PI * 2);
  f.ellipse(cx + w * 0.175, hy + h * 0.02, w * 0.03, h * 0.06, 0, 0, Math.PI * 2);
  f.fill();
  f.fillStyle = skin; // head
  f.beginPath();
  f.ellipse(cx, hy, w * 0.17, h * 0.21, 0, 0, Math.PI * 2);
  f.fill();
  f.fillStyle = "#121212"; // hair
  f.beginPath();
  f.ellipse(cx, hy - h * 0.07, w * 0.18, h * 0.16, 0, Math.PI, Math.PI * 2);
  f.closePath();
  f.fill();
  f.fillStyle = "rgba(20,20,20,0.5)"; // eyes and mouth, barely there
  f.beginPath();
  f.ellipse(cx - w * 0.07, hy - h * 0.01, w * 0.04, h * 0.018, 0, 0, Math.PI * 2);
  f.ellipse(cx + w * 0.07, hy - h * 0.01, w * 0.04, h * 0.018, 0, 0, Math.PI * 2);
  f.ellipse(cx, hy + h * 0.1, w * 0.06, h * 0.012, 0, 0, Math.PI * 2);
  f.fill();

  ctx.filter = `blur(${Math.max(1, w * 0.014)}px)`;
  ctx.drawImage(fig, x, y);
  // Motion ghost: the subject moved, so the face smears sideways.
  ctx.globalAlpha = 0.4;
  ctx.filter = `blur(${Math.max(2, w * 0.045)}px)`;
  ctx.drawImage(fig, x + w * 0.02, y - h * 0.004);
  ctx.globalAlpha = 1;
  ctx.filter = "none";

  // Vignette, grain, scratches.
  const vig = ctx.createRadialGradient(
    x + w / 2,
    y + h / 2,
    w * 0.25,
    x + w / 2,
    y + h / 2,
    w * 0.8,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.translate(x, y);
  grain(ctx, w, h, 321, 0.16);
  const r = rng(909);
  ctx.strokeStyle = "rgba(235,232,222,0.22)";
  ctx.lineWidth = Math.max(1, w * 0.004);
  for (let i = 0; i < 5; i++) {
    const sx = r() * w;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + (r() - 0.5) * w * 0.05, h);
    ctx.stroke();
  }
  ctx.restore();
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

  // The record itself is typed: a case sheet off a 1940s office machine,
  // not marker on a whiteboard.
  ctx.textAlign = "center";
  type(ctx, caseFile.subtitle, w / 2, h * 0.235, h * 0.048);
  ctx.textAlign = "left";
  ctx.fillStyle = INK;
  ctx.fillRect(m, h * 0.275, w - m * 2, 2);

  // Coffee ring: the file has sat on a desk a long time.
  ctx.save();
  ctx.strokeStyle = "rgba(120,80,40,0.16)";
  ctx.lineWidth = w * 0.012;
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.2, w * 0.085, 0.3, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();

  // Anonymous subject photograph: a print with a white border, taped on.
  const px = m;
  const py = h * 0.31;
  const pw = w * 0.48;
  const ph = h * 0.46;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = h * 0.012;
  ctx.shadowOffsetY = h * 0.006;
  ctx.fillStyle = "#d8d4c6";
  ctx.fillRect(px, py, pw, ph);
  ctx.restore();
  const bd = pw * 0.045;
  paintPortrait(ctx, px + bd, py + bd, pw - bd * 2, ph - bd * 3);
  ctx.fillStyle = "rgba(235,228,205,0.6)";
  ctx.fillRect(px - pw * 0.05, py - ph * 0.02, pw * 0.28, ph * 0.07);
  ctx.fillRect(px + pw * 0.77, py - ph * 0.02, pw * 0.28, ph * 0.07);

  // Grease-pencil ring around the subject: an investigator singling him out.
  // Two overlapping, slightly offset passes read as drawn by hand rather than
  // as a vector ellipse. Thin enough to stay an annotation, not a graphic.
  ctx.save();
  ctx.translate(px + pw / 2, py + ph / 2);
  ctx.strokeStyle = RED;
  ctx.lineWidth = w * 0.0055;
  ctx.globalAlpha = 0.72;
  ctx.rotate(-0.03);
  ctx.beginPath();
  ctx.ellipse(0, h * 0.01, pw * 0.58, ph * 0.56, 0, 0.15, Math.PI * 2 + 0.15);
  ctx.stroke();
  ctx.rotate(0.05);
  ctx.beginPath();
  ctx.ellipse(w * 0.008, -h * 0.008, pw * 0.6, ph * 0.58, 0, 0.4, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Typed record block. The column beside the photograph is only ~0.3w wide,
  // which will not hold a label and its value side by side at a legible size
  // ("OCCUPATION:" plus a value overruns it), so each value is typed under
  // its own label the way a case sheet would be filled in.
  let fyy = py + h * 0.065;
  const fx = px + pw + w * 0.055;
  for (const f of caseFile.fields) {
    type(ctx, f.label, fx, fyy, h * 0.026, "rgba(31,27,23,0.75)");
    type(ctx, f.value, fx, fyy + h * 0.042, h * 0.034, f.accent ? RED : INK);
    fyy += h * 0.092;
  }

  // The one handwritten mark on the sheet — added later, in red pencil.
  scrawl(ctx, "no match on file", fx, fyy + h * 0.012, h * 0.028, {
    color: RED,
    rotation: -0.035,
  });

  // Fingerprint smudge by the stamp.
  ctx.save();
  ctx.strokeStyle = "rgba(60,40,30,0.3)";
  ctx.lineWidth = Math.max(1, h * 0.003);
  for (let i = 1; i <= 7; i++) {
    ctx.beginPath();
    ctx.ellipse(w * 0.87, h * 0.8, h * 0.012 * i, h * 0.016 * i, 0.3, 0.4, Math.PI * 1.7);
    ctx.stroke();
  }
  ctx.restore();

  // Barcode + stamp along the foot of the file.
  const r = rng(77);
  let bx = m;
  ctx.fillStyle = INK;
  while (bx < m + w * 0.28) {
    const bw = 1 + Math.floor(r() * 4);
    ctx.fillRect(bx, h * 0.83, bw, h * 0.07);
    bx += bw + 2 + Math.floor(r() * 3);
  }
  stamp(ctx, caseFile.stamp, w * 0.62, h * 0.87, h * 0.045, -0.12);
  ctx.textAlign = "center";
  type(ctx, "FILE 404-A  //  DO NOT REMOVE", w / 2, h * 0.965, h * 0.02, "rgba(31,27,23,0.55)");
  ctx.textAlign = "left";
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
    case "uiScreen": {
      // App mock-up: nav bar, hero block, card row.
      ctx.fillStyle = "#e3dccb";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#2f3a46";
      ctx.fillRect(0, 0, w, h * 0.14);
      ctx.fillStyle = "#d3a648";
      ctx.fillRect(w * 0.04, h * 0.045, w * 0.14, h * 0.05);
      ctx.fillStyle = "#8a8f94";
      for (let i = 0; i < 3; i++) ctx.fillRect(w * (0.6 + i * 0.12), h * 0.055, w * 0.08, h * 0.03);
      ctx.fillStyle = "#b7452c";
      ctx.fillRect(w * 0.06, h * 0.22, w * 0.88, h * 0.3);
      ctx.fillStyle = "#e8e0cf";
      ctx.fillRect(w * 0.1, h * 0.29, w * 0.4, h * 0.05);
      ctx.fillRect(w * 0.1, h * 0.38, w * 0.26, h * 0.03);
      ctx.fillStyle = "#2f3a46";
      ctx.fillRect(w * 0.1, h * 0.46, w * 0.12, h * 0.04);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = "#c9bfa8";
        ctx.fillRect(w * (0.06 + i * 0.3), h * 0.6, w * 0.28, h * 0.32);
        ctx.fillStyle = "#6d7a86";
        ctx.fillRect(w * (0.09 + i * 0.3), h * 0.64, w * 0.22, h * 0.12);
      }
      break;
    }
    case "browserPage": {
      // Web page screenshot: address bar, hero, text lines, button.
      ctx.fillStyle = "#e6e0d2";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#2c2f35";
      ctx.fillRect(0, 0, w, h * 0.13);
      ctx.fillStyle = "#c9c2b2";
      ctx.fillRect(w * 0.18, h * 0.035, w * 0.64, h * 0.06);
      ctx.fillStyle = "#2c2f35";
      ctx.fillRect(w * 0.08, h * 0.22, w * 0.5, h * 0.09);
      ctx.fillStyle = "#8a8f94";
      for (let i = 0; i < 3; i++)
        ctx.fillRect(w * 0.08, h * (0.38 + i * 0.07), w * (0.7 - i * 0.12), h * 0.035);
      ctx.fillStyle = "#b7452c";
      ctx.fillRect(w * 0.08, h * 0.66, w * 0.24, h * 0.1);
      ctx.fillStyle = "#6d7a86";
      ctx.fillRect(w * 0.64, h * 0.2, w * 0.28, h * 0.55);
      break;
    }
    case "phoneScreen": {
      // Mobile app mock-up on a dark ground.
      ctx.fillStyle = "#2a2926";
      ctx.fillRect(0, 0, w, h);
      const pw = w * 0.5;
      const px = (w - pw) / 2;
      ctx.fillStyle = "#14130f";
      ctx.fillRect(px - w * 0.03, h * 0.06, pw + w * 0.06, h * 0.88);
      ctx.fillStyle = "#e3dccb";
      ctx.fillRect(px, h * 0.1, pw, h * 0.8);
      ctx.fillStyle = "#b7452c";
      ctx.fillRect(px, h * 0.1, pw, h * 0.16);
      ctx.fillStyle = "#c9bfa8";
      for (let i = 0; i < 3; i++)
        ctx.fillRect(px + pw * 0.08, h * (0.32 + i * 0.18), pw * 0.84, h * 0.13);
      ctx.fillStyle = "#6d7a86";
      for (let i = 0; i < 3; i++)
        ctx.fillRect(px + pw * 0.12, h * (0.35 + i * 0.18), pw * 0.22, h * 0.07);
      break;
    }
    case "colorPalette": {
      // Brand swatches with a type specimen.
      ctx.fillStyle = "#ddd5c2";
      ctx.fillRect(0, 0, w, h);
      const swatches = ["#b7452c", "#d3a648", "#2d4a63", "#1f1b17", "#e8e0cf"];
      swatches.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(w * (0.06 + i * 0.176), h * 0.08, w * 0.15, h * 0.5);
      });
      ctx.fillStyle = "#1f1b17";
      ctx.font = `bold ${h * 0.26}px Georgia, "Times New Roman", serif`;
      ctx.fillText("Aa", w * 0.06, h * 0.9);
      ctx.fillRect(w * 0.42, h * 0.72, w * 0.5, h * 0.04);
      ctx.fillRect(w * 0.42, h * 0.82, w * 0.34, h * 0.04);
      break;
    }
    case "videoStill": {
      // Footage frame with a play marker and timecode.
      ctx.fillStyle = "#26231f";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#4d4a43";
      ctx.fillRect(w * 0.06, h * 0.08, w * 0.88, h * 0.62);
      ctx.fillStyle = "#d8d0c0";
      ctx.beginPath();
      ctx.moveTo(w * 0.42, h * 0.22);
      ctx.lineTo(w * 0.42, h * 0.56);
      ctx.lineTo(w * 0.62, h * 0.39);
      ctx.fill();
      ctx.font = `bold ${h * 0.09}px ${TYPE}`;
      ctx.fillStyle = "#c8c0b0";
      ctx.fillText("00:12:08", w * 0.08, h * 0.88);
      ctx.fillStyle = "#d33b2c";
      ctx.fillRect(w * 0.06, h * 0.72, w * 0.5, h * 0.025);
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
    case "evidenceCard": {
      // Central evidence tucked under the case file: a stamped archive card,
      // typed, no discipline of its own.
      agedPaper(ctx, w, h, "#d9cdb0", seed);
      stamp(ctx, "EVIDENCE", w / 2, h * 0.3, h * 0.13, -0.05);
      ctx.textAlign = "center";
      type(ctx, "LOG 404-B", w / 2, h * 0.58, h * 0.1);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(31,27,23,0.4)";
      ctx.fillRect(w * 0.18, h * 0.68, w * 0.64, 2);
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(w * 0.18, h * (0.77 + i * 0.07), w * (0.64 - i * 0.16), 2);
      }
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
  }
  grain(ctx, w, h, seed + 1, 0.07);
}

function paintPieces(ctx: Ctx, size: number) {
  pieces.forEach((p, i) => {
    const { w, h } = enterPiece(ctx, p.piece, size);
    if (p.keepOriginal) {
      // Leave the board's own baked-in photo untouched; just re-age it so it
      // matches the grain pass every other piece gets.
      grain(ctx, w, h, 100 + i * 17, 0.05);
      return;
    }
    if (p.kind === "wireframeSheet" || p.kind === "evidenceCard") {
      // Whole sheet repainted: loose paper, no photographic print border.
      paintKind(ctx, p.kind, w, h, 100 + i * 17);
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

/* ------------------------------------------------------------------ */
/* Cork + baked shadows                                                */
/* ------------------------------------------------------------------ */

// The cork's atlas island (a 4096px atlas) and its board-face extent. Its
// own shadow bake covers the whole face, so the interior is refilled from a
// clean linen sample; the scene's real shadows replace the baked ones.
const CORK = {
  quad: [
    [115, 2592],
    [2543, 2596],
    [2509, 3990],
    [71, 3990],
  ],
  sample: [2150, 3480, 300, 260],
  s: [-1.58, 0.52],
  t: [0.88, 2.05],
} as const;

function repaintCork(ctx: Ctx, atlas: CanvasImageSource, size: number) {
  const k = size / 4096;
  const [q0, q1, q2, q3] = CORK.quad.map(([x, y]) => [x * k, y * k]);
  const [sx, sy, sw, sh] = CORK.sample.map((n) => n * k);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(q0[0] + 14 * k, q0[1] + 14 * k);
  ctx.lineTo(q1[0] - 14 * k, q1[1] + 14 * k);
  ctx.lineTo(q2[0] - 14 * k, q2[1] - 14 * k);
  ctx.lineTo(q3[0] + 14 * k, q3[1] - 14 * k);
  ctx.closePath();
  ctx.clip();

  // Mirror-tiled linen so the repeat has no visible seams.
  const x0 = Math.min(q0[0], q3[0]);
  const y0 = Math.min(q0[1], q1[1]);
  const x1 = Math.max(q1[0], q2[0]);
  const y1 = Math.max(q2[1], q3[1]);
  for (let ty = 0; y0 + ty * sh < y1; ty++) {
    for (let tx = 0; x0 + tx * sw < x1; tx++) {
      ctx.save();
      ctx.translate(x0 + tx * sw + (tx % 2 ? sw : 0), y0 + ty * sh + (ty % 2 ? sh : 0));
      ctx.scale(tx % 2 ? -1 : 1, ty % 2 ? -1 : 1);
      ctx.drawImage(atlas, sx, sy, sw, sh, 0, 0, sw, sh);
      ctx.restore();
    }
  }

  ctx.restore();
}

/**
 * Copies the board's original colour atlas and repaints every paper piece
 * with CASE 404 content in place — same UV islands, same geometry. The
 * cork's baked shadows are replaced by clean linen.
 */
export function paintCaseBoard(atlas: ImageBitmap | HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = atlas.width;
  canvas.height = atlas.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(atlas, 0, 0);
  const size = canvas.width;
  repaintCork(ctx, atlas, size);
  paintMapAndCaseFile(ctx, atlas, size);
  paintPieces(ctx, size);
  paintTags(ctx, size);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}
