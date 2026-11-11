import { certificates } from "../../data/certificates";
import { contact } from "../../data/contact";
import { education } from "../../data/education";
import { experienceEntries } from "../../data/experience";
import { profile, profileSkills } from "../../data/profile";
import { projects } from "../../data/projects";

/**
 * The subject's resume, as a plain black-and-white one-page A4 resume (name
 * and contact, profile, experience, development projects, skills, college
 * education, certifications): black sans-serif type on white, bold capital
 * headings with a thin rule. Painted from the site's own data, so it never
 * drifts from it.
 *
 * Laid out on a 1240 x 1754 grid (A4 at 150 dpi) and drawn at any width: the
 * printed sheet, the full-size preview and the PDF are all this one painter at
 * different resolutions.
 */
export const RESUME_GRID = { w: 1240, h: 1754 };

const TYPE = 'Arial, Helvetica, "Liberation Sans", sans-serif';
const SERIF = TYPE;
const INK = "#000000";
const SOFT = "#1a1a1a";
const MUTED = "#4a4a4a";
const PAPER = "#ffffff";
const M = 92;
const WIDTH = RESUME_GRID.w - M * 2;

type Ctx = CanvasRenderingContext2D;

const tracking = (ctx: Ctx, px: number) => {
  (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${px}px`;
};

/** Words of `s` broken into lines no wider than `maxW` in the current font. */
function wrap(ctx: Ctx, s: string, maxW: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of s.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxW) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** The contact lines: location and emails, then the profile links. */
function contactLines() {
  const place = profile.location.replace(/\b(\w)(\w*)/g, (_, a, b) => a + b.toLowerCase());
  return [
    [place, ...contact.emails.map((e) => e.address)].join("   |   "),
    contact.links
      .map((l) => l.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))
      .join("   |   "),
  ];
}

/** Short tool list for a project line. */
const toolList = (tools: string[], n = 5) => tools.slice(0, n).join(", ");

/** The projects on the resume: the real development ones, in the archive's order. */
const selectedProjects = () =>
  projects.filter((p) => p.category === "Development" && !/placeholder/i.test(p.description));

/** The schooling on the resume: degrees only (college), not secondary school. */
const degrees = () =>
  education.filter((e) => /bachelor|associate|master|doctor/i.test(e.credential));

/**
 * Paints the resume onto `ctx`, sized `width` px wide (A4 proportions).
 * `scale` shrinks every size a little if the content would run off the page;
 * returns the bottom of the content on the grid, to check for that.
 */
function paint(ctx: Ctx, width: number, scale: number) {
  const k = width / RESUME_GRID.w;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, RESUME_GRID.w, RESUME_GRID.h);

  const s = (px: number) => px * scale;
  const text = (t: string, x: number, y: number, font: string, color = INK) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(t, x, y);
  };
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Header: the name, the roles, the contact line, a rule.
  let y = 120;
  tracking(ctx, 2);
  text(profile.name.join(" ").toUpperCase(), M, y, `bold 46px ${TYPE}`);
  tracking(ctx, 0);
  y += 36;
  text(profile.roles.join("  |  "), M, y, `bold 19px ${TYPE}`, SOFT);
  y += 30;
  for (const line of contactLines()) {
    text(line, M, y, `16.5px ${SERIF}`, SOFT);
    y += 24;
  }
  y -= 4;
  ctx.fillStyle = INK;
  ctx.fillRect(M, y, WIDTH, 2);
  y += s(24);

  const heading = (label: string) => {
    y += s(26);
    ctx.font = `bold ${s(17.5)}px ${TYPE}`;
    ctx.fillStyle = INK;
    tracking(ctx, 2);
    ctx.fillText(label, M, y);
    tracking(ctx, 0);
    ctx.fillRect(M, y + s(8), WIDTH, 1.2);
    y += s(32);
  };
  const paragraph = (
    t: string,
    x: number,
    maxW: number,
    font: string,
    lh: number,
    color = SOFT,
  ) => {
    ctx.font = font;
    ctx.fillStyle = color;
    for (const line of wrap(ctx, t, maxW)) {
      ctx.fillText(line, x, y);
      y += lh;
    }
  };
  /** A bold line with a right-aligned date; returns nothing, moves `y` on. */
  const titled = (title: string, date: string, size: number) => {
    ctx.font = `${s(15)}px ${TYPE}`;
    const dw = ctx.measureText(date).width;
    ctx.fillStyle = MUTED;
    ctx.textAlign = "right";
    ctx.fillText(date, M + WIDTH, y);
    ctx.textAlign = "left";
    ctx.font = `bold ${s(size)}px ${SERIF}`;
    const lines = wrap(ctx, title, WIDTH - dw - 30);
    lines.forEach((line, i) => text(line, M, y + i * s(size * 1.25), ctx.font));
    y += lines.length * s(size * 1.25);
  };

  heading("PROFILE");
  paragraph(profile.about, M, WIDTH, `${s(17.5)}px ${SERIF}`, s(27));

  heading("EXPERIENCE");
  for (const job of experienceEntries) {
    titled(job.role, job.period.toUpperCase(), 18);
    paragraph(job.organization, M, WIDTH, `italic ${s(16.5)}px ${SERIF}`, s(23), MUTED);
    if (job.summary) paragraph(job.summary, M, WIDTH, `${s(16)}px ${SERIF}`, s(23));
    for (const b of job.bullets ?? [])
      paragraph(`–  ${b}`, M + 10, WIDTH - 10, `${s(16)}px ${SERIF}`, s(23));
    y += s(10);
  }

  heading("DEVELOPMENT PROJECTS");
  // Two columns, filled row by row.
  const colW = (WIDTH - 40) / 2;
  const items = selectedProjects();
  for (let i = 0; i < items.length; i += 2) {
    const top = y;
    let bottom = y;
    items.slice(i, i + 2).forEach((p, j) => {
      y = top;
      const x = M + j * (colW + 40);
      text(p.title, x, y, `bold ${s(16.5)}px ${SERIF}`);
      y += s(22);
      paragraph(p.tagline ?? p.description, x, colW, `${s(14.5)}px ${SERIF}`, s(20));
      paragraph(toolList(p.tools), x, colW, `italic ${s(13.5)}px ${SERIF}`, s(19), MUTED);
      bottom = Math.max(bottom, y);
    });
    y = bottom + s(12);
  }

  heading("SKILLS");
  for (const { label, value } of profileSkills) {
    text(label, M, y, `bold ${s(15.5)}px ${TYPE}`, INK);
    paragraph(value, M + 230, WIDTH - 230, `${s(16)}px ${SERIF}`, s(23));
    y += s(4);
  }

  heading("EDUCATION");
  for (const school of degrees()) {
    titled(school.institution, school.period.toUpperCase(), 16.5);
    paragraph(school.credential, M, WIDTH, `italic ${s(15.5)}px ${SERIF}`, s(22), MUTED);
    y += s(6);
  }

  heading("CERTIFICATIONS");
  for (const cert of certificates) {
    titled(cert.title, cert.year, 15.5);
    paragraph(cert.issuer, M, WIDTH, `italic ${s(14.5)}px ${SERIF}`, s(21), MUTED);
    y += s(4);
  }
  return y;
}

/**
 * The resume on a new canvas `width` px wide. The type is set as large as
 * fits: from a little over its base size down a step at a time, until the
 * content ends above the page's bottom margin.
 */
export function paintResume(width: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round((width * RESUME_GRID.h) / RESUME_GRID.w);
  const ctx = canvas.getContext("2d")!;
  for (let scale = 1.2; scale > 0.6; scale -= 0.03) {
    if (paint(ctx, width, scale) <= RESUME_GRID.h - 80) break;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}
