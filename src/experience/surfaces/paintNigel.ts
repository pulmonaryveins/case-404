import type { ChatLine } from "../nigel/nigelChat";
import { SCREEN_H, SCREEN_W } from "./paintArchive";

/**
 * N.I.G.E.L.'s screens on the archive CRT: the splash while the program loads
 * and the chat. Its mascot is a little pixel face (drawn small, shown with
 * hard pixels): a monitor-shaped head, one eye behind a monocle, the right
 * eyebrow permanently raised, and a neat moustache.
 */

const PHOSPHOR = "#7dffb0";
const DIM = "rgba(125,255,176,0.55)";
const MONO = '"Courier New", Courier, monospace';
const BG = "#04120a";

type Ctx = CanvasRenderingContext2D;
export type NigelFace = "idle" | "blink" | "talk" | "think";

const FACE_W = 48;
const FACE_H = 40;
const faces = new Map<NigelFace, HTMLCanvasElement>();

/** The mascot at its own size (48 x 40), cached per expression. */
function face(expr: NigelFace) {
  let canvas = faces.get(expr);
  if (canvas) return canvas;
  canvas = document.createElement("canvas");
  canvas.width = FACE_W;
  canvas.height = FACE_H;
  const c = canvas.getContext("2d")!;
  c.strokeStyle = c.fillStyle = PHOSPHOR;
  c.lineCap = "round";
  // The head: a little monitor.
  c.lineWidth = 2;
  c.beginPath();
  c.roundRect(4, 3, 40, 34, 6);
  c.stroke();
  // Left eye, or a shut line.
  if (expr === "blink") c.fillRect(13, 17, 6, 1.5);
  else c.fillRect(14, 15, 4, 4);
  // Right eye behind the monocle, with its chain.
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(32, 17, 6, 0, Math.PI * 2);
  c.stroke();
  if (expr === "blink") c.fillRect(29, 17, 6, 1.5);
  else c.fillRect(30, 15, 4, 4);
  c.beginPath();
  c.moveTo(37, 21);
  c.quadraticCurveTo(41, 27, 40, 34);
  c.stroke();
  // Brows: the right one always up; thinking lifts the left too.
  c.lineWidth = 2;
  c.beginPath();
  if (expr === "think") {
    c.moveTo(11, 9);
    c.lineTo(20, 7);
  } else {
    c.moveTo(11, 10);
    c.lineTo(20, 10);
  }
  c.moveTo(26, 8);
  c.quadraticCurveTo(32, 3, 38, 6);
  c.stroke();
  // The moustache: two curled wings.
  c.beginPath();
  c.moveTo(24, 25);
  c.quadraticCurveTo(19, 23, 15, 27);
  c.quadraticCurveTo(14, 24, 17, 23.5);
  c.quadraticCurveTo(21, 22.5, 24, 24);
  c.quadraticCurveTo(27, 22.5, 31, 23.5);
  c.quadraticCurveTo(34, 24, 33, 27);
  c.quadraticCurveTo(29, 23, 24, 25);
  c.fill();
  // Mouth: a smirk, an open "o" while it talks, pursed while it thinks.
  if (expr === "talk") {
    c.fillRect(21, 29, 7, 3);
  } else if (expr === "think") {
    c.fillRect(23, 30, 3, 2);
  } else {
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(20, 31);
    c.lineTo(27, 31);
    c.lineTo(30, 29.5);
    c.stroke();
  }
  faces.set(expr, canvas);
  return canvas;
}

/** Draws the mascot `scale` times its size with hard pixels, its top left at (x, y). */
function drawFace(ctx: Ctx, expr: NigelFace, x: number, y: number, scale: number) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = PHOSPHOR;
  ctx.shadowBlur = 10;
  ctx.drawImage(face(expr), x, y, FACE_W * scale, FACE_H * scale);
  ctx.restore();
}

function glow(ctx: Ctx) {
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = PHOSPHOR;
  ctx.shadowBlur = 4;
  ctx.fillStyle = PHOSPHOR;
}

/** The mascot's expression at a moment: blinks now and then, talks while typing. */
export function nigelFaceAt(now: number, talking: boolean, thinking: boolean): NigelFace {
  if (thinking) return "think";
  if (talking) return Math.floor(now / 110) % 2 ? "talk" : "idle";
  return now % 4200 < 140 ? "blink" : "idle";
}

/** The program loading: the mascot, its name plate and a progress bar. `t` runs 0 to 1. */
export function paintNigelSplash(ctx: Ctx, t: number, now: number) {
  ctx.shadowBlur = 0;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  drawFace(ctx, nigelFaceAt(now, false, t < 0.5), 70, 150, 6);
  glow(ctx);
  const x = 400;
  ctx.font = `bold 66px ${MONO}`;
  ctx.fillText("N.I.G.E.L.", x, 220);
  ctx.font = `bold 30px ${MONO}`;
  ctx.fillText("MK-I", x, 262);
  ctx.fillStyle = DIM;
  ctx.font = `bold 24px ${MONO}`;
  ctx.fillText("NETWORKED INQUIRY &", x, 320);
  ctx.fillText("GENERAL EVIDENCE LOCATOR", x, 352);
  ctx.fillText("ATTIC SYSTEMS LTD.  1974", x, 404);
  ctx.fillStyle = PHOSPHOR;
  ctx.font = `bold 26px ${MONO}`;
  const dots = ".".repeat(1 + (Math.floor(t * 14) % 3));
  ctx.fillText(t < 0.55 ? `LOADING PERSONALITY MATRIX${dots}` : `WARMING VALVES${dots}`, 70, 520);
  ctx.strokeStyle = PHOSPHOR;
  ctx.lineWidth = 3;
  ctx.strokeRect(70, 545, SCREEN_W - 140, 34);
  ctx.fillRect(76, 551, (SCREEN_W - 152) * Math.min(1, t), 22);
}

const TEXT_PX = 26;
const LINE_H = 34;
const LEFT = 60;
const BODY_TOP = 150;
const INPUT_Y = 640;
const BODY_BOTTOM = INPUT_Y - 46;

/** Wraps a line of monospace text to `cols` columns at word breaks. */
function wrapCols(text: string, cols: number) {
  const rows: string[] = [];
  for (const para of text.split("\n")) {
    let row = "";
    for (const word of para.split(" ")) {
      if (!row) row = word;
      else if (row.length + 1 + word.length <= cols) row += ` ${word}`;
      else {
        rows.push(row);
        row = word;
      }
      while (row.length > cols) {
        rows.push(row.slice(0, cols));
        row = row.slice(cols);
      }
    }
    rows.push(row);
  }
  return rows;
}

export interface NigelChatView {
  lines: ChatLine[];
  input: string;
  thinking: boolean;
  /** The camera is on the screen, so the keyboard reaches it. */
  focused: boolean;
}

/**
 * The chat: a header with the mascot, the conversation's tail (N.I.G.E.L.'s
 * lines in full phosphor, the visitor's dimmer behind a ">"), and the prompt.
 */
export function paintNigelChat(ctx: Ctx, view: NigelChatView, now: number) {
  ctx.shadowBlur = 0;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  const talking = view.lines.some((l) => l.who === "nigel" && l.shown < l.text.length);

  // Header: name plate and the mascot in the corner.
  glow(ctx);
  ctx.font = `bold 36px ${MONO}`;
  ctx.fillText("N.I.G.E.L. MK-I", LEFT, 70);
  ctx.fillStyle = DIM;
  ctx.font = `bold 22px ${MONO}`;
  ctx.fillText("ATTIC SYSTEMS LTD.  ·  CASE 404 INQUIRY PROGRAM", LEFT, 104);
  ctx.fillRect(LEFT, 120, SCREEN_W - 120, 3);
  drawFace(ctx, nigelFaceAt(now, talking, view.thinking), SCREEN_W - 60 - 96, 16, 2);

  // The conversation, bottom-aligned: the newest rows that fit.
  glow(ctx);
  ctx.font = `bold ${TEXT_PX}px ${MONO}`;
  const charW = ctx.measureText("M").width;
  const cols = Math.floor((SCREEN_W - LEFT * 2 - 20) / charW);
  const rows: { text: string; who: ChatLine["who"] }[] = [];
  for (const line of view.lines) {
    const shown = line.text.slice(0, line.shown).toUpperCase();
    const prefix = line.who === "you" ? "> " : line.who === "note" ? "* " : "";
    for (const text of wrapCols(prefix + shown, cols)) rows.push({ text, who: line.who });
    rows.push({ text: "", who: line.who });
    if (line.shown < line.text.length) break; // nothing after a line still typing
  }
  const fit = Math.floor((BODY_BOTTOM - BODY_TOP) / LINE_H);
  // Without the blank after the last line.
  const tail = rows.slice(0, -1).slice(-fit);
  while (tail[0]?.text === "") tail.shift();
  tail.forEach((row, i) => {
    ctx.fillStyle = row.who === "nigel" ? PHOSPHOR : DIM;
    ctx.fillText(row.text, LEFT, BODY_TOP + 24 + i * LINE_H);
  });

  // The prompt line.
  ctx.fillStyle = DIM;
  ctx.fillRect(LEFT, INPUT_Y - 40, SCREEN_W - 120, 2);
  ctx.fillStyle = PHOSPHOR;
  ctx.font = `bold 28px ${MONO}`;
  const prompt = "A:\\NIGEL> ";
  if (view.thinking) {
    const dots = ".".repeat(1 + (Math.floor(now / 300) % 3));
    ctx.fillText(`CONSULTING THE FILES${dots}`, LEFT, INPUT_Y);
  } else if (!view.focused) {
    ctx.fillText(`${prompt}CLICK THE SCREEN TO TYPE`, LEFT, INPUT_Y);
  } else {
    const inputCols =
      Math.floor((SCREEN_W - LEFT * 2) / ctx.measureText("M").width) - prompt.length - 1;
    const text = view.input.toUpperCase();
    const visible =
      text.length > inputCols ? text.slice(text.length - inputCols).trimStart() : text;
    ctx.fillText(prompt + visible, LEFT, INPUT_Y);
    if (Math.floor(now / 500) % 2 === 0) {
      const x = LEFT + ctx.measureText(prompt + visible).width;
      ctx.fillRect(x + 2, INPUT_Y - 24, 16, 28);
    }
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = DIM;
  ctx.font = `bold 18px ${MONO}`;
  ctx.textAlign = "right";
  ctx.fillText('ENTER TO ASK  ·  "EXIT" TO EJECT', SCREEN_W - LEFT, INPUT_Y + 30);
  ctx.textAlign = "left";
}
