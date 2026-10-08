import { profile, profileSkills } from "../../data/profile";
import { experienceEntries } from "../../data/experience";
import { paintPaperFinish } from "./paperFinish";

const INK = "#10110f";
const RED = "#641b18";
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
  paintPaperFinish(ctx, PAGE_W, PAGE_H);
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

/** Single-page profile, using the original scene-lit paper style. */
export function paintAboutPage() {
  const { canvas, ctx } = page(9);
  const m = 80;
  const width = PAGE_W - m * 2;
  text(ctx, "CASE 404 / SUBJECT RECORD", m, 78, 24, TYPE, INK);
  text(ctx, "About the subject", m, 129, 30, SERIF);
  ctx.fillStyle = RED;
  ctx.fillRect(m, 147, width, 3);
  text(ctx, profile.name.join(" "), m, 219, 48, SERIF);
  paragraph(ctx, "UI/UX Designer & Frontend Developer", m, 277, width, 31);
  text(ctx, "IT STUDENT / CEBU CITY, PHILIPPINES", m, 334, 23, TYPE, INK);
  paragraph(ctx, profile.about, m, 365, width, 32);
  text(ctx, "SKILLS / TOOLKIT", m, 515, 28, TYPE, RED);
  profileSkills.forEach(({ label, value }, index) => {
    const y = 558 + index * 43;
    text(ctx, label, m, y, 22, TYPE, INK);
    paragraph(ctx, value, m + 225, y, width - 225, 28);
  });
  text(ctx, "SELECTED EXPERIENCE", m, 706, 28, TYPE, RED);
  experienceEntries.forEach((job, index) => {
    const y = 752 + index * 138;
    ctx.fillStyle = "rgba(40,35,25,0.35)";
    ctx.fillRect(m, y - 26, width, 1);
    text(ctx, job.organization, m, y + 12, 31, SERIF);
    text(ctx, job.period, m, y + 50, 23, SERIF, INK);
    paragraph(ctx, job.role, m + 245, y + 50, width - 245, 27);
    paragraph(ctx, job.summary, m, y + 94, width, 29);
  });
  text(ctx, "FILE REF. CASE 404 / PROFILE / 01", m, 1330, 23, TYPE, INK);
  return canvas;
}
