import { dossierTabs, profile } from "../../data/profile";
import { education } from "../../data/education";
import { experienceEntries } from "../../data/experience";

const INK = "#1f1b17";
const RED = "#8e221d";
const PAPER = "#f1eedb";
const TYPE = '"Courier New", Courier, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';

/** Page canvases are A4-proportioned (1 : 1.36), drawn at 1024 wide. */
export const PAGE_W = 1024;
export const PAGE_H = 1392;

type Ctx = CanvasRenderingContext2D;

function seededGrain(ctx: Ctx, seed: number) {
  let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 38000; i++) {
    ctx.fillStyle = r() > 0.5 ? "rgba(255,255,246,0.16)" : "rgba(95,82,48,0.07)";
    ctx.fillRect(r() * PAGE_W, r() * PAGE_H, 1 + r() * 2, 1);
  }
}

function page(seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  seededGrain(ctx, seed);
  const edge = ctx.createRadialGradient(
    PAGE_W / 2,
    PAGE_H / 2,
    PAGE_W * 0.45,
    PAGE_W / 2,
    PAGE_H / 2,
    PAGE_H * 0.75,
  );
  edge.addColorStop(0, "rgba(90,65,35,0)");
  edge.addColorStop(1, "rgba(110,91,48,0.12)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.strokeStyle = "rgba(110,91,48,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, PAGE_W - 10, PAGE_H - 10);
  ctx.fillStyle = "#756f5c";
  ctx.font = `20px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText(String(seed === 5 ? "01" : "02"), PAGE_W / 2, PAGE_H - 35);
  ctx.textAlign = "left";
  return { canvas, ctx };
}

function text(ctx: Ctx, s: string, x: number, y: number, px: number, font = TYPE, color = INK) {
  ctx.fillStyle = color;
  ctx.font = `bold ${px}px ${font}`;
  ctx.fillText(s, x, y);
}

/** Wraps `s` to `maxW`, returns the y after the last line. */
function paragraph(ctx: Ctx, s: string, x: number, y: number, maxW: number, px: number) {
  ctx.font = `${px}px ${SERIF}`;
  ctx.fillStyle = INK;
  let line = "";
  for (const word of s.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += px * 1.45;
    } else line = next;
  }
  ctx.fillText(line, x, y);
  return y + px * 1.45;
}

function drawPortraitSlot(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = "#b9b1a0";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#6f675a";
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 16, y + 16, w - 32, h - 32);
  ctx.setLineDash([]);
  ctx.textAlign = "center";
  text(ctx, "PORTRAIT", x + w / 2, y + h / 2 - 8, 34, TYPE, "#5b5448");
  text(ctx, "TO BE SUPPLIED", x + w / 2, y + h / 2 + 36, 24, TYPE, "#5b5448");
  ctx.textAlign = "left";
}

/** Left page: persistent subject identity. */
export function paintProfilePage(onPortrait: () => void) {
  const { canvas, ctx } = page(5);
  const px = 110;
  const py = 120;
  const pw = 380;
  const ph = 460;

  const drawClip = () => {
    ctx.save();
    ctx.strokeStyle = "rgba(30,25,20,0.3)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(px + 63, py - 47, 44, 150, 22);
    ctx.stroke();
    ctx.strokeStyle = "#b8bbb7";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(px + 60, py - 50, 44, 150, 22);
    ctx.stroke();
    ctx.strokeStyle = "#e1e0d8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(px + 70, py - 34, 23, 112, 11);
    ctx.stroke();
    ctx.restore();
  };

  ctx.fillStyle = "rgba(40,30,20,0.18)";
  ctx.fillRect(px - 12, py - 12, pw + 40, ph + 60);
  ctx.fillStyle = "#faf6e9";
  ctx.fillRect(px - 20, py - 20, pw + 40, ph + 60);
  drawPortraitSlot(ctx, px, py, pw, ph);

  if (profile.photo) {
    const img = new Image();
    img.onload = () => {
      const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
      const sw = pw / scale;
      const sh = ph / scale;
      ctx.drawImage(
        img,
        (img.naturalWidth - sw) / 2,
        (img.naturalHeight - sh) / 2,
        sw,
        sh,
        px,
        py,
        pw,
        ph,
      );
      drawClip();
      onPortrait();
    };
    img.src = profile.photo;
  }
  drawClip();

  let y = py + ph + 110;
  text(ctx, profile.name[0], px, y, 64);
  text(ctx, profile.name[1], px, y + 76, 64);
  y += 150;
  ctx.fillStyle = INK;
  ctx.fillRect(px, y, PAGE_W - px * 2, 3);
  y += 70;
  text(ctx, profile.status, px, y, 36);
  text(ctx, profile.location, px, y + 52, 36);
  y += 130;
  profile.roles.forEach((role, i) => text(ctx, role, px, y + i * 52, 36, TYPE, RED));

  // "Identity found" stamp answers the board's SUBJECT UNKNOWN.
  ctx.save();
  ctx.translate(PAGE_W - 270, 330);
  ctx.rotate(-0.16);
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = RED;
  ctx.lineWidth = 6;
  ctx.strokeRect(-190, -60, 380, 110);
  ctx.textAlign = "center";
  text(ctx, "IDENTITY", 0, -10, 40, TYPE, RED);
  text(ctx, "FOUND", 0, 38, 40, TYPE, RED);
  ctx.restore();
  return canvas;
}

/** Right page: the changing record — ABOUT for now, with the tab row. */
export function paintAboutPage(section = 0, entry = 0) {
  const { canvas, ctx } = page(9);
  const m = 100;
  const tabW = (PAGE_W - m * 2) / dossierTabs.length;
  dossierTabs.forEach((tab, i) => {
    const x = m + i * tabW;
    const active = i === section;
    ctx.fillStyle = active ? INK : "rgba(31,27,23,0.12)";
    ctx.fillRect(x + 4, 90, tabW - 8, 70);
    ctx.textAlign = "center";
    text(ctx, tab, x + tabW / 2, 138, 30, TYPE, active ? PAPER : "#5b5448");
    ctx.textAlign = "left";
  });
  ctx.fillStyle = INK;
  ctx.fillRect(m, 160, PAGE_W - m * 2, 4);

  if (section !== 0) {
    text(ctx, "SUBJECT RECORD", m, 235, 24, TYPE, "#756f5c");
    text(ctx, section === 1 ? "Education record" : "Experience record", m, 300, 58, SERIF);
    ctx.fillStyle = RED;
    ctx.fillRect(m, 316, 140, 5);
    const school = education[entry];
    const job = experienceEntries[entry];
    let y = 420;
    if (section === 1 && school) {
      y = paragraph(ctx, school.institution, m, y, PAGE_W - m * 2, 42);
      y = paragraph(ctx, school.credential, m, y + 35, PAGE_W - m * 2, 36);
      paragraph(ctx, school.period, m, y + 35, PAGE_W - m * 2, 32);
    } else if (section === 2 && job) {
      y = paragraph(ctx, job.organization, m, y, PAGE_W - m * 2, 42);
      y = paragraph(ctx, job.role, m, y + 25, PAGE_W - m * 2, 36);
      y = paragraph(ctx, job.period, m, y + 25, PAGE_W - m * 2, 30);
      paragraph(ctx, job.summary, m, y + 50, PAGE_W - m * 2, 34);
    } else paragraph(ctx, "Records have not been supplied yet.", m, y, PAGE_W - m * 2, 36);
    const count = Math.max(1, section === 1 ? education.length : experienceEntries.length);
    text(
      ctx,
      `FILE REF. CASE 404 / ${entry + 1} OF ${count}`,
      m,
      PAGE_H - 110,
      24,
      TYPE,
      "#6b6458",
    );
    if (count > 1) {
      text(ctx, "< PREV", 580, PAGE_H - 110, 24, TYPE, entry > 0 ? INK : "#aaa18a");
      text(ctx, "NEXT >", 795, PAGE_H - 110, 24, TYPE, entry < count - 1 ? INK : "#aaa18a");
    }
    return canvas;
  }
  text(ctx, "SUBJECT RECORD", m, 235, 24, TYPE, "#756f5c");
  text(ctx, "About the subject", m, 300, 58, SERIF);
  ctx.fillStyle = RED;
  ctx.fillRect(m, 316, 140, 5);
  paragraph(ctx, profile.about, m, 420, PAGE_W - m * 2, 38);
  ctx.strokeStyle = "#aaa18a";
  ctx.lineWidth = 2;
  ctx.strokeRect(m, 860, PAGE_W - m * 2, 240);
  text(ctx, "FILE METADATA", m + 28, 910, 27, SERIF);
  text(ctx, "LOCATION", m + 28, 970, 23);
  text(ctx, profile.location, m + 250, 970, 23, SERIF);
  text(ctx, "STATUS", m + 28, 1025, 23);
  text(ctx, profile.status, m + 250, 1025, 23, SERIF);

  text(ctx, "FILE REF. CASE 404 / P-01", m, PAGE_H - 110, 24, TYPE, "#6b6458");
  return canvas;
}
