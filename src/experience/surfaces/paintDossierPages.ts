import { profile, profileSkills } from "../../data/profile";
import { experienceEntries } from "../../data/experience";
import { education } from "../../data/education";
import { certificates } from "../../data/certificates";
import { dossierPages } from "../../data/dossier";
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

const pad = (n: number) => String(n).padStart(2, "0");

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
  return { canvas, ctx };
}

function text(ctx: Ctx, s: string, x: number, y: number, px: number, font = TYPE, color = INK) {
  ctx.fillStyle = color;
  ctx.font = `bold ${px}px ${font}`;
  ctx.fillText(s, x, y);
}

/** Wraps `s` to `maxW`, returns the y after the last line. */
function paragraph(
  ctx: Ctx,
  s: string,
  x: number,
  y: number,
  maxW: number,
  px: number,
  color = INK,
  lineHeight = 1.45,
  style = "",
) {
  ctx.font = `${style ? style + " " : ""}${px}px ${SERIF}`;
  ctx.fillStyle = color;
  let line = "";
  for (const word of s.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += px * lineHeight;
    } else line = next;
  }
  ctx.fillText(line, x, y);
  return y + px * lineHeight;
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

const M = 80;
const WIDTH = PAGE_W - M * 2;
/** Content stops above the file reference at the foot of the sheet. */
const FOOT = 1290;

/**
 * Type, from loudest to quietest, so a sheet reads in order:
 *  1. the name or employer: large bold serif, near-black;
 *  2. the title under it (a degree, a role): italic serif, muted brown;
 *  3. the body (a summary, a value): regular serif, soft black;
 *  4. labels, dates and section heads: small typewriter caps, tracked out,
 *     in red (dates, headings) or muted brown (labels).
 * Entries are set apart by hairline dividers.
 */
const SOFT = "#2b2822";
const MUTED = "#6a5f4c";
/** Small table labels: darker than MUTED, for contrast at their size. */
const LABEL = "#4f4636";

/** Letter spacing on the canvas, in px (set back to 0 after tracked text). */
function tracking(ctx: Ctx, px: number) {
  (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${px}px`;
}

/** A sheet's header (record line, section title, red rule) and footer. */
function sheet(index: number, title: string) {
  const { canvas, ctx } = page(9 + index * 7);
  text(ctx, "CASE 404 / SUBJECT RECORD", M, 78, 24, TYPE, INK);
  ctx.textAlign = "right";
  text(ctx, `SECTION ${pad(index + 1)}`, PAGE_W - M, 78, 22, TYPE, RED);
  ctx.textAlign = "left";
  text(ctx, title, M, 129, 30, SERIF);
  ctx.fillStyle = RED;
  ctx.fillRect(M, 147, WIDTH, 3);
  const tab = dossierPages[index].tab.toUpperCase();
  text(ctx, `FILE REF. CASE 404 / ${tab} / ${pad(index + 1)}`, M, 1330, 23, TYPE, INK);
  return { canvas, ctx };
}

/** A hairline divider across the sheet. */
function rule(ctx: Ctx, y: number) {
  ctx.fillStyle = "rgba(40,35,25,0.35)";
  ctx.fillRect(M, y, WIDTH, 1);
}

/** A section heading: red typewriter caps, tracked out, a hairline running on to the margin. */
function sectionHead(ctx: Ctx, label: string, y: number) {
  ctx.font = `bold 22px ${TYPE}`;
  ctx.fillStyle = RED;
  tracking(ctx, 4);
  ctx.fillText(label, M, y);
  const w = ctx.measureText(label).width;
  tracking(ctx, 0);
  ctx.fillStyle = "rgba(100,27,24,0.35)";
  ctx.fillRect(M + w + 14, y - 8, WIDTH - w - 14, 1.5);
}

/**
 * A heading with its date right-aligned on its first line: bold serif for the
 * title, the date in tracked red typewriter caps. A long title is shrunk a
 * little to stay on one line; one too long for that (a society's full name)
 * wraps at the smallest size instead, clear of the date. Returns the baseline
 * of the heading's last line.
 */
function headingWithDate(ctx: Ctx, title: string, date: string, y: number, px: number) {
  ctx.font = `bold 21px ${TYPE}`;
  tracking(ctx, 1);
  const dateWidth = ctx.measureText(date).width;
  tracking(ctx, 0);
  const room = WIDTH - dateWidth - 40;
  const floor = Math.min(px, 30);
  let size = px;
  ctx.font = `bold ${size}px ${SERIF}`;
  while (size > floor && ctx.measureText(title).width > room) {
    size -= 2;
    ctx.font = `bold ${size}px ${SERIF}`;
  }
  let lines = [title];
  if (ctx.measureText(title).width > room) {
    lines = [];
    let line = "";
    for (const word of title.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > room && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  lines.forEach((l, i) => text(ctx, l, M, y + i * size * 1.2, size, SERIF, INK));
  ctx.textAlign = "right";
  tracking(ctx, 1);
  text(ctx, date, PAGE_W - M, y, 21, TYPE, RED);
  tracking(ctx, 0);
  ctx.textAlign = "left";
  return y + (lines.length - 1) * size * 1.2;
}

/**
 * A ruled row of a table: a small muted label at the left, its value beside it
 * in serif, wrapping, and a hairline under. Returns the baseline of the next row.
 */
function row(ctx: Ctx, label: string, value: string, y: number, col = 232) {
  const px = 27;
  const lh = 1.38;
  ctx.font = `bold 20px ${TYPE}`;
  tracking(ctx, 2);
  ctx.fillStyle = LABEL;
  ctx.fillText(label, M, y);
  tracking(ctx, 0);
  const last = paragraph(ctx, value, M + col, y, WIDTH - col, px, SOFT, lh) - px * lh;
  ctx.fillStyle = "rgba(40,35,25,0.18)";
  ctx.fillRect(M, last + 20, WIDTH, 1);
  return last + 56;
}

/** A dash and a wrapped line, hanging; returns the baseline after it (with a little air). */
function bullet(ctx: Ctx, s: string, y: number) {
  text(ctx, "–", M + 4, y, 26, SERIF);
  return paragraph(ctx, s, M + 34, y, WIDTH - 34, 26, SOFT, 1.4) + 8;
}

/** A closing line under a list, as a record file ends. */
function endMark(ctx: Ctx, y: number) {
  ctx.font = `bold 19px ${TYPE}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  tracking(ctx, 5);
  ctx.fillText("END OF RECORD", PAGE_W / 2, y);
  tracking(ctx, 0);
  ctx.textAlign = "left";
}

/**
 * A comma list as items separated by dots. Each item is held together with
 * non-breaking spaces, and its dot with it, so a line never ends on a dot or
 * splits "After Effects"; the dot leads the next line instead.
 */
function dotted(list: string) {
  return list
    .split(", ")
    .map((item, i) => (i ? "· " : "") + item.replace(/ /g, " "))
    .join(" ");
}

/** 01: who the subject is, the case on them, and their toolkit. */
function paintCasePage(index: number) {
  const { canvas, ctx } = sheet(index, "Case info: about the subject");
  text(ctx, profile.name.join(" "), M, 226, 54, SERIF);
  ctx.font = `bold 21px ${TYPE}`;
  ctx.fillStyle = RED;
  tracking(ctx, 3);
  ctx.fillText("UI/UX DESIGNER & FRONTEND DEVELOPER", M, 276);
  tracking(ctx, 0);
  let y = paragraph(ctx, profile.about, M, 340, WIDTH, 30, SOFT, 1.5) + 36;

  sectionHead(ctx, "CASE DETAILS", y);
  y += 50;
  y = row(ctx, "CASE NO.", "404", y);
  y = row(ctx, "STATUS", "Open: under review", y);
  y = row(ctx, "LOCATION", "Cebu City, Philippines", y);
  y = row(ctx, "DISCIPLINES", "Frontend development, UI/UX design, graphic design, video", y);
  const now = experienceEntries[0];
  if (now) y = row(ctx, "CURRENT POST", `${now.role}, ${now.organization}`, y);

  y += 14;
  sectionHead(ctx, "SKILLS / TOOLKIT", y);
  y += 50;
  for (const { label, value } of profileSkills) y = row(ctx, label, dotted(value), y);
  return canvas;
}

/** 02: schools, newest first, each its own entry between dividers: the school, its degree, its years. */
function paintEducationPage(index: number) {
  const { canvas, ctx } = sheet(index, "Education: academic record");
  ctx.font = `bold 20px ${TYPE}`;
  ctx.fillStyle = MUTED;
  tracking(ctx, 2);
  ctx.fillText("TRANSCRIPTS ON FILE / VERIFIED BY THE BUREAU", M, 210);
  tracking(ctx, 0);
  let y = 330;
  for (const school of education) {
    if (y > FOOT - 140) break;
    rule(ctx, y - 54);
    y = headingWithDate(ctx, school.institution, school.period, y, 40);
    y = paragraph(ctx, school.credential, M, y + 46, WIDTH, 32, MUTED, 1.4, "italic");
    if (school.detail) y = paragraph(ctx, school.detail, M, y, WIDTH, 26, SOFT, 1.4);
    y += 100;
  }
  rule(ctx, y - 54);
  endMark(ctx, y - 14);
  return canvas;
}

/**
 * What goes under a post's title: its summary, bullets and tools. `y` is the
 * baseline for the first line; returns the baseline after.
 */
function jobDetails(ctx: Ctx, job: (typeof experienceEntries)[number], y: number) {
  if (job.summary) y = paragraph(ctx, job.summary, M, y, WIDTH, 26, SOFT, 1.4);
  for (const b of job.bullets ?? []) y = bullet(ctx, b, y);
  if (job.tools) {
    ctx.font = `bold 19px ${TYPE}`;
    ctx.fillStyle = RED;
    tracking(ctx, 2);
    ctx.fillText("TOOLS", M, y + 4);
    tracking(ctx, 0);
    y = paragraph(ctx, job.tools, M + 104, y + 4, WIDTH - 104, 25, SOFT, 1.4);
  }
  return y;
}

/**
 * A sheet of posts, newest first, each its own entry between dividers: the
 * organisation (bold, large) with its dates, the role in italics under it,
 * then what was done. Two posts at one organisation are two entries.
 */
function paintPosts(index: number, title: string, tally: string, posts: typeof experienceEntries) {
  const { canvas, ctx } = sheet(index, title);
  ctx.font = `bold 20px ${TYPE}`;
  ctx.fillStyle = MUTED;
  tracking(ctx, 2);
  ctx.fillText(`${tally}: ${posts.length}`, M, 210);
  tracking(ctx, 0);
  let y = 290;
  for (const job of posts) {
    if (y > FOOT - 130) break;
    rule(ctx, y - 46);
    y = headingWithDate(ctx, job.organization, job.period, y, 34);
    y = paragraph(ctx, job.role, M, y + 40, WIDTH, 28, MUTED, 1.4, "italic");
    y = jobDetails(ctx, job, y);
    y += 32;
  }
  rule(ctx, y - 46);
  endMark(ctx, y - 6);
  return canvas;
}

/** 03: work. */
function paintExperiencePage(index: number) {
  return paintPosts(index, "Experience: known employment", "POSTS ON FILE", experienceEntries);
}

/** A small gold seal, as on the certificates on the shelf. */
function seal(ctx: Ctx, x: number, y: number, r: number) {
  ctx.fillStyle = "#9a7a3e";
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r : r * 1.15;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.fill();
  ctx.strokeStyle = "#e2c98a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.68, 0, Math.PI * 2);
  ctx.stroke();
}

/** 04: certificates and awards (written; its sheet is off until there are real ones). */
function paintAchievementsPage(index: number) {
  const { canvas, ctx } = sheet(index, "Achievements: commendations");
  text(ctx, `COMMENDATIONS ON FILE: ${certificates.length}`, M, 206, 22, TYPE, INK);
  let y = 270;
  for (const cert of certificates) {
    if (y > FOOT - 100) break;
    rule(ctx, y - 34);
    seal(ctx, M + 34, y + 18, 30);
    text(ctx, cert.title, M + 96, y + 10, 32, SERIF);
    text(ctx, `${cert.issuer} · ${cert.year}`, M + 96, y + 52, 23, TYPE, INK);
    y += 118;
  }
  return canvas;
}

const PAINTERS = {
  case: paintCasePage,
  education: paintEducationPage,
  experience: paintExperiencePage,
  achievements: paintAchievementsPage,
} as const;

/** One dossier sheet by its index in `dossierPages`. */
export function paintDossierPage(index: number) {
  return PAINTERS[dossierPages[index].id](index);
}
