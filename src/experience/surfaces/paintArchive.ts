import type { Project } from "../../data/projects";

const PHOSPHOR = "#7dffb0";
const DIM = "rgba(125,255,176,0.55)";
const MONO = '"Courier New", Courier, monospace';

export const SCREEN_W = 1024;
export const SCREEN_H = 683;
export const LABEL_W = 612;
export const LABEL_H = 395;

/** What the terminal is showing. */
export type ScreenView =
  | { kind: "off" }
  /** Power-on and boot; `t` runs 0 to 1. */
  | { kind: "boot"; t: number }
  /** Welcome menu, or the record of the disk in the drive. */
  | { kind: "menu"; active: Project | null; projects: Project[] };

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

function glow(ctx: Ctx) {
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = PHOSPHOR;
  ctx.shadowBlur = 8;
  ctx.fillStyle = PHOSPHOR;
}

function header(ctx: Ctx) {
  glow(ctx);
  ctx.font = `bold 32px ${MONO}`;
  ctx.fillText("EDEN DATA SYSTEMS / CASE 404 ARCHIVE", 60, 84);
  ctx.fillRect(60, 104, SCREEN_W - 120, 3);
}

/** Scanlines, once per frame: cheap and sells the tube. */
function scanlines(ctx: Ctx) {
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  for (let y = 0; y < SCREEN_H; y += 4) ctx.fillRect(0, y, SCREEN_W, 2);
}

/** The CRT warming up: a bright line that opens into the picture. */
function powerOn(ctx: Ctx, p: number) {
  const w = SCREEN_W * Math.min(1, p * 1.6);
  const h = 3 + Math.max(0, p - 0.45) * 2 * SCREEN_H * 0.05;
  ctx.shadowColor = "#d6ffe6";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#e8fff0";
  ctx.fillRect((SCREEN_W - w) / 2, (SCREEN_H - h) / 2, w, h);
}

const BOOT_LINES = [
  "EDEN DATA SYSTEMS  MODEL 404",
  "MEMORY TEST ............ 64K OK",
  "KEYBOARD ............... OK",
  "DISK DRIVE A: .......... READY",
  "LOADING CASE 404 ARCHIVE",
];

function paintBoot(ctx: Ctx, t: number) {
  // The first slice of the boot is the tube warming up.
  const ON = 0.1;
  if (t < ON) {
    powerOn(ctx, t / ON);
    return;
  }
  const b = (t - ON) / (1 - ON);
  glow(ctx);
  ctx.font = `28px ${MONO}`;
  BOOT_LINES.forEach((line, i) => {
    if (b < 0.1 + i * 0.16) return;
    ctx.fillText(line, 60, 100 + i * 46);
  });
  if (b > 0.7) {
    const fill = Math.min(1, (b - 0.7) / 0.28);
    ctx.strokeStyle = PHOSPHOR;
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 360, SCREEN_W - 120, 36);
    ctx.fillRect(66, 366, (SCREEN_W - 132) * fill, 24);
  }
}

function paintMenu(ctx: Ctx, projects: Project[]) {
  header(ctx);
  ctx.font = `bold 52px ${MONO}`;
  ctx.fillText("WELCOME, DETECTIVE.", 60, 196);
  ctx.font = `28px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.fillText("SELECT A DISK TO OPEN ITS FILE.", 60, 246);

  const columns: [string, string, number][] = [
    ["DEVELOPMENT", "Development", 60],
    ["UI / UX", "UI/UX", 540],
  ];
  for (const [title, category, x] of columns) {
    ctx.fillStyle = DIM;
    ctx.font = `bold 24px ${MONO}`;
    ctx.fillText(title, x, 330);
    ctx.fillRect(x, 342, 420, 2);
    ctx.fillStyle = PHOSPHOR;
    ctx.font = `26px ${MONO}`;
    projects
      .filter((p) => p.category === category)
      .forEach((p, i) => {
        const index = projects.indexOf(p) + 1;
        ctx.fillText(
          `${String(index).padStart(2, "0")}  ${p.title.toUpperCase()}`,
          x,
          388 + i * 48,
        );
      });
  }
  ctx.font = `28px ${MONO}`;
  ctx.fillText("A:\\> _", 60, 610);
}

function paintRecord(ctx: Ctx, project: Project) {
  header(ctx);
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
  ctx.fillStyle = DIM;
  ctx.font = `22px ${MONO}`;
  ctx.fillText("SELECT THE DISK AGAIN TO EJECT", 60, 640);
}

/** Paints the CRT's current contents. */
export function paintArchiveScreen(canvas: HTMLCanvasElement, view: ScreenView) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = view.kind === "off" ? "#020403" : "#04120a";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  if (view.kind === "off") return;

  if (view.kind === "boot") paintBoot(ctx, view.t);
  else if (view.active) paintRecord(ctx, view.active);
  else paintMenu(ctx, view.projects);
  scanlines(ctx);
}

/** Handwritten title on the disk's paper label: big and dark, so it reads at a distance. */
export function paintDiskLabel(canvas: HTMLCanvasElement, project: Project, index: number) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f1ecda";
  ctx.fillRect(0, 0, LABEL_W, LABEL_H);

  const dev = project.category === "Development";
  ctx.fillStyle = dev ? "#8a2a22" : "#1f4a72";
  ctx.fillRect(0, 0, LABEL_W, 92);
  ctx.fillStyle = "#f1ecda";
  ctx.font = `bold 52px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText(dev ? "DEV" : "UI/UX", 24, 66);
  ctx.textAlign = "right";
  ctx.fillText(`A-0${index + 1}`, LABEL_W - 24, 66);

  // Title: as large as fits, on up to two lines.
  ctx.textAlign = "left";
  ctx.fillStyle = "#14120e";
  const words = project.title.split(" ");
  const fit = (size: number) => {
    ctx.font = `bold ${size}px "Segoe Print", "Bradley Hand", cursive`;
  };
  let size = 84;
  const lines = () => {
    fit(size);
    const out: string[] = [];
    let line = "";
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > LABEL_W - 48 && line) {
        out.push(line);
        line = w;
      } else line = next;
    }
    out.push(line);
    return out;
  };
  let rows = lines();
  while (
    (rows.length > 2 || rows.some((r) => ctx.measureText(r).width > LABEL_W - 48)) &&
    size > 30
  ) {
    size -= 4;
    rows = lines();
  }
  const top = 92 + (LABEL_H - 92) / 2 - ((rows.length - 1) * size * 1.05) / 2;
  rows.forEach((r, i) => ctx.fillText(r, 24, top + size * 0.3 + i * size * 1.05));
}
