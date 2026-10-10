import type { Project } from "../../data/projects";

const PHOSPHOR = "#7dffb0";
const DIM = "rgba(125,255,176,0.55)";
const MONO = '"Courier New", Courier, monospace';

export const SCREEN_W = 1024;
export const SCREEN_H = 768;
export const LABEL_W = 612;
export const LABEL_H = 395;

type Ctx = CanvasRenderingContext2D;

function wrap(ctx: Ctx, text: string, x: number, y: number, maxW: number, lineH: number) {
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineH;
    } else line = next;
  }
  ctx.fillText(line, x, y);
  return y + lineH;
}

/** CRT contents: the idle prompt, or the record of the inserted disk. */
export function paintArchiveScreen(canvas: HTMLCanvasElement, project: Project | null) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#04120a";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = PHOSPHOR;
  ctx.shadowBlur = 8;
  ctx.fillStyle = PHOSPHOR;
  ctx.font = `bold 34px ${MONO}`;
  ctx.fillText("CASE 404 / PROJECT ARCHIVE", 60, 90);
  ctx.fillRect(60, 110, SCREEN_W - 120, 3);

  if (!project) {
    ctx.font = `30px ${MONO}`;
    ctx.fillText("A:\\> DIR", 60, 190);
    ctx.fillStyle = DIM;
    ctx.fillText("NO DISK IN DRIVE A:", 60, 260);
    ctx.fillText("SELECT A DISK TO LOAD IT", 60, 310);
    ctx.fillStyle = PHOSPHOR;
    ctx.fillText("A:\\> _", 60, 420);
  } else {
    ctx.font = `26px ${MONO}`;
    ctx.fillStyle = DIM;
    ctx.fillText(`DRIVE A: ${project.category.toUpperCase()}`, 60, 165);
    ctx.fillStyle = PHOSPHOR;
    ctx.font = `bold 48px ${MONO}`;
    let y = wrap(ctx, project.title.toUpperCase(), 60, 240, SCREEN_W - 120, 56);
    ctx.font = `28px ${MONO}`;
    y = wrap(ctx, project.description, 60, y + 24, SCREEN_W - 120, 38);
    ctx.fillStyle = DIM;
    ctx.fillText("TOOLS", 60, y + 40);
    ctx.fillStyle = PHOSPHOR;
    ctx.fillText(project.tools.join("  /  "), 60, y + 82);
    if (project.link) {
      ctx.fillStyle = DIM;
      ctx.fillText("LINK", 60, y + 140);
      ctx.fillStyle = PHOSPHOR;
      ctx.fillText(project.link, 60, y + 182);
    }
  }

  // Scanlines, once: cheap and sells the tube.
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  for (let y = 0; y < SCREEN_H; y += 4) ctx.fillRect(0, y, SCREEN_W, 2);
}

/** Handwritten title on the disk's paper label. */
export function paintDiskLabel(canvas: HTMLCanvasElement, project: Project, index: number) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ece6d2";
  ctx.fillRect(0, 0, LABEL_W, LABEL_H);
  ctx.fillStyle = "rgba(60,90,140,0.35)";
  for (let y = 120; y < LABEL_H; y += 54) ctx.fillRect(18, y, LABEL_W - 36, 2);

  const dev = project.category === "Development";
  ctx.fillStyle = dev ? "#7a2a24" : "#1f4a6e";
  ctx.fillRect(0, 0, LABEL_W, 62);
  ctx.fillStyle = "#ece6d2";
  ctx.font = `bold 34px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText(dev ? "DEVELOPMENT" : "UI / UX", 22, 43);
  ctx.textAlign = "right";
  ctx.fillText(`A-0${index + 1}`, LABEL_W - 22, 43);

  ctx.textAlign = "left";
  ctx.fillStyle = "#1c1a16";
  let size = 56;
  ctx.font = `${size}px "Segoe Print", "Bradley Hand", cursive`;
  while (ctx.measureText(project.title).width > LABEL_W - 44 && size > 26) {
    size -= 2;
    ctx.font = `${size}px "Segoe Print", "Bradley Hand", cursive`;
  }
  ctx.fillText(project.title, 22, 170);
}
