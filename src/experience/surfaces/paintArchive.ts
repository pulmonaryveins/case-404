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
  /** A disk has just gone into the drive; `t` runs 0 to 1 while it is read. */
  | { kind: "insert"; project: Project; t: number }
  /** Welcome menu, or the record of the disk in the drive. */
  | { kind: "menu"; active: Project | null; projects: Project[]; video?: HTMLVideoElement };

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
  ctx.shadowBlur = 4;
  ctx.fillStyle = PHOSPHOR;
}

function header(ctx: Ctx) {
  glow(ctx);
  ctx.font = `bold 36px ${MONO}`;
  ctx.fillText("EDEN DATA SYSTEMS / CASE 404 ARCHIVE", 60, 84);
  ctx.fillRect(60, 104, SCREEN_W - 120, 3);
}

/** Scanlines, once per frame: cheap and sells the tube. */
function scanlines(ctx: Ctx) {
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.1)";
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

/** "Disk inserted" read-out shown while the drive reads a disk. */
function paintInserted(ctx: Ctx, project: Project, t: number) {
  glow(ctx);
  ctx.font = `bold 30px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.fillText("DRIVE A:", 60, 200);
  ctx.fillStyle = PHOSPHOR;
  ctx.font = `bold 54px ${MONO}`;
  ctx.fillText("DISK INSERTED", 60, 280);
  ctx.font = `bold 40px ${MONO}`;
  const y = wrap(ctx, `"${project.title.toUpperCase()}"`, 60, 350, SCREEN_W - 120, 50);
  ctx.font = `bold 30px ${MONO}`;
  const dots = ".".repeat(1 + (Math.floor(t * 12) % 3));
  ctx.fillText(`READING${dots}`, 60, y + 40);
  ctx.strokeStyle = PHOSPHOR;
  ctx.lineWidth = 3;
  ctx.strokeRect(60, y + 70, SCREEN_W - 120, 36);
  ctx.fillRect(66, y + 76, (SCREEN_W - 132) * Math.min(1, t), 24);
}

/** Where the fixed header band ends; the body scrolls beneath it. */
const BODY_TOP = 124;

function paintMenu(ctx: Ctx, projects: Project[]) {
  ctx.font = `bold 60px ${MONO}`;
  ctx.fillText("WELCOME, DETECTIVE.", 60, 200);
  ctx.font = `bold 32px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.fillText("SELECT A DISK TO OPEN ITS FILE.", 60, 255);

  const columns: [string, string, number][] = [
    ["DEVELOPMENT", "Development", 50],
    ["UI / UX", "UI/UX", 380],
    ["VIDEO EDIT", "Video Editing", 710],
  ];
  for (const [title, category, x] of columns) {
    ctx.fillStyle = DIM;
    ctx.font = `bold 30px ${MONO}`;
    ctx.fillText(title, x, 340);
    ctx.fillRect(x, 354, 290, 3);
    ctx.fillStyle = PHOSPHOR;
    ctx.font = `bold 28px ${MONO}`;
    projects
      .filter((p) => p.category === category)
      .forEach((p, i) => {
        // "Dev Project One" -> "PROJECT ONE": the column already names the kind.
        ctx.fillText(p.title.replace(/^(Dev|UI\/UX|Video) /, "").toUpperCase(), x, 410 + i * 56);
      });
  }
  ctx.font = `bold 34px ${MONO}`;
  ctx.fillText("A:\\> _", 60, 620);

  // Below the fold: reached by scrolling the terminal.
  ctx.fillStyle = DIM;
  ctx.fillRect(60, 680, SCREEN_W - 120, 3);
  ctx.font = `bold 34px ${MONO}`;
  ctx.fillText("HOW TO USE THIS TERMINAL", 60, 740);
  ctx.fillStyle = PHOSPHOR;
  ctx.font = `bold 30px ${MONO}`;
  let y = 800;
  for (const line of [
    "1. PICK A DISK FROM THE DESK.",
    "2. IT SLIDES INTO DRIVE A: AND ITS FILE OPENS HERE.",
    "3. SCROLL TO READ THE WHOLE FILE.",
    "4. SELECT THE DISK AGAIN TO EJECT IT.",
  ]) {
    y = wrap(ctx, line, 60, y, SCREEN_W - 120, 40) + 12;
  }
  return y + 40;
}

function paintRecord(ctx: Ctx, project: Project) {
  ctx.font = `bold 30px ${MONO}`;
  ctx.fillStyle = DIM;
  ctx.fillText(`DRIVE A: ${project.category.toUpperCase()}`, 60, 176);
  ctx.fillStyle = PHOSPHOR;
  ctx.font = `bold 58px ${MONO}`;
  let y = wrap(ctx, project.title.toUpperCase(), 60, 252, SCREEN_W - 120, 66);
  ctx.font = `bold 34px ${MONO}`;
  y = wrap(ctx, project.description, 60, y + 20, SCREEN_W - 120, 46);
  ctx.fillStyle = DIM;
  ctx.fillText("TOOLS", 60, y + 36);
  ctx.fillStyle = PHOSPHOR;
  y = wrap(ctx, project.tools.join("  /  "), 60, y + 82, SCREEN_W - 120, 46);
  if (project.link) {
    ctx.fillStyle = DIM;
    ctx.fillText("LINK", 60, y + 30);
    ctx.fillStyle = PHOSPHOR;
    y = wrap(ctx, project.link, 60, y + 76, SCREEN_W - 120, 46);
  }
  return paintFileDetails(ctx, project, y + 30);
}

/** The rest of a disk's file, below the fold. */
function paintFileDetails(ctx: Ctx, project: Project, top: number) {
  ctx.fillStyle = DIM;
  ctx.fillRect(60, top, SCREEN_W - 120, 3);
  ctx.font = `bold 34px ${MONO}`;
  ctx.fillText("FILE DETAILS", 60, top + 60);
  ctx.fillStyle = PHOSPHOR;
  ctx.font = `bold 30px ${MONO}`;
  let y = top + 112;
  for (const line of [
    `DISK ID ....... ${project.id.toUpperCase()}`,
    `CATEGORY ...... ${project.category.toUpperCase()}`,
    `TOOLS ......... ${project.tools.length}`,
    "STATUS ........ ARCHIVED",
    "FILED UNDER ... CASE 404",
  ]) {
    ctx.fillText(line, 60, y);
    y += 46;
  }
  ctx.fillStyle = DIM;
  ctx.fillText("-- END OF FILE --", 60, y + 40);
  ctx.fillText("SELECT THE DISK AGAIN TO EJECT", 60, y + 90);
  return y + 130;
}

/** A video disk: the clip playing on the tube, tinted to the phosphor. */
function paintVideo(ctx: Ctx, project: Project, video: HTMLVideoElement) {
  const x = 60;
  const y = 140;
  const w = SCREEN_W - 120;
  const h = 420;
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#000";
  ctx.fillRect(x, y, w, h);
  if (video.videoWidth) {
    const k = Math.min(w / video.videoWidth, h / video.videoHeight);
    const vw = video.videoWidth * k;
    const vh = video.videoHeight * k;
    const dx = x + (w - vw) / 2;
    const dy = y + (h - vh) / 2;
    ctx.drawImage(video, dx, dy, vw, vh);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "#b4ffd2";
    ctx.fillRect(dx, dy, vw, vh);
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.strokeStyle = PHOSPHOR;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  // Progress bar.
  const p = video.duration ? video.currentTime / video.duration : 0;
  ctx.fillStyle = DIM;
  ctx.fillRect(x, y + h + 18, w, 6);
  ctx.fillStyle = PHOSPHOR;
  ctx.fillRect(x, y + h + 18, w * p, 6);
  glow(ctx);
  ctx.font = `bold 34px ${MONO}`;
  ctx.fillText(project.title.toUpperCase(), 60, 640);
  ctx.fillStyle = DIM;
  ctx.font = `bold 26px ${MONO}`;
  ctx.fillText(`DRIVE A: ${project.category.toUpperCase()}`, 60, 680);
  ctx.fillStyle = PHOSPHOR;
  ctx.font = `bold 34px ${MONO}`;
  let ty = wrap(ctx, project.description, 60, 750, SCREEN_W - 120, 46);
  ctx.fillStyle = DIM;
  ctx.fillText("TOOLS", 60, ty + 30);
  ctx.fillStyle = PHOSPHOR;
  ty = wrap(ctx, project.tools.join("  /  "), 60, ty + 76, SCREEN_W - 120, 46);
  return paintFileDetails(ctx, project, ty + 30);
}

/**
 * Paints the CRT's current contents. The header stays put and the body
 * scrolls by `scroll` px; returns how far it can scroll.
 */
export function paintArchiveScreen(canvas: HTMLCanvasElement, view: ScreenView, scroll = 0) {
  const ctx = canvas.getContext("2d")!;
  const bg = view.kind === "off" ? "#020403" : "#04120a";
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  if (view.kind === "off") return 0;

  if (view.kind === "boot") {
    paintBoot(ctx, view.t);
    scanlines(ctx);
    return 0;
  }

  if (view.kind === "insert") {
    header(ctx);
    paintInserted(ctx, view.project, view.t);
    scanlines(ctx);
    return 0;
  }

  glow(ctx);
  ctx.save();
  ctx.translate(0, -scroll);
  let end: number;
  if (view.active?.video && view.video) end = paintVideo(ctx, view.active, view.video);
  else if (view.active) end = paintRecord(ctx, view.active);
  else end = paintMenu(ctx, view.projects);
  ctx.restore();

  const max = Math.max(0, end - SCREEN_H);
  // Header band over whatever scrolled beneath it.
  ctx.shadowBlur = 0;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SCREEN_W, BODY_TOP);
  header(ctx);

  if (max > 0) {
    ctx.shadowBlur = 0;
    const track = SCREEN_H - BODY_TOP - 20;
    const thumb = Math.max(40, (track * SCREEN_H) / end);
    ctx.fillStyle = "rgba(125,255,176,0.2)";
    ctx.fillRect(SCREEN_W - 22, BODY_TOP + 10, 8, track);
    ctx.fillStyle = PHOSPHOR;
    ctx.fillRect(SCREEN_W - 22, BODY_TOP + 10 + (track - thumb) * (scroll / max), 8, thumb);
    if (scroll < max - 4) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, SCREEN_H - 40, SCREEN_W, 40);
      glow(ctx);
      ctx.font = `bold 24px ${MONO}`;
      ctx.textAlign = "right";
      ctx.fillText("SCROLL DOWN v", SCREEN_W - 50, SCREEN_H - 12);
      ctx.textAlign = "left";
    }
  }
  scanlines(ctx);
  return max;
}

/** Handwritten title on the disk's paper label: big and dark, so it reads at a distance. */
export function paintDiskLabel(canvas: HTMLCanvasElement, project: Project, index: number) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f1ecda";
  ctx.fillRect(0, 0, LABEL_W, LABEL_H);

  const dev = project.category === "Development";
  const vid = project.category === "Video Editing";
  ctx.fillStyle = dev ? "#8a2a22" : vid ? "#5a2a72" : "#1f4a72";
  ctx.fillRect(0, 0, LABEL_W, 92);
  ctx.fillStyle = "#f1ecda";
  ctx.font = `bold 52px ${MONO}`;
  ctx.textAlign = "left";
  ctx.fillText(dev ? "DEV" : vid ? "VIDEO" : "UI/UX", 24, 66);
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
