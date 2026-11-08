import { certificates } from "../../data/certificates";
import { contact } from "../../data/contact";
import { education } from "../../data/education";
import { experienceEntries } from "../../data/experience";
import { profile, profileSkills } from "../../data/profile";
import { projects } from "../../data/projects";

/**
 * The subject's resume as the typewriter prints it: one A4 page, laid out
 * like a professional resume (name and contact, college education,
 * experience, development projects, skills, certifications) in a
 * typed, old-office style:
 * typewriter capitals for the headings, a book serif for the reading text, on
 * warm paper. Painted from the site's own data, so it never drifts from it.
 *
 * Laid out on a 1240 x 1754 grid (A4 at 150 dpi) and drawn at any width: the
 * printed sheet's texture, the full-size preview and the PDF are all this one
 * painter at different resolutions.
 */
export const RESUME_GRID = { w: 1240, h: 1754 };

const TYPE = '"Courier New", Courier, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';
const INK = "#1e1b17";
const SOFT = "#332e26";
const MUTED = "#4f4637";
const RED = "#8a2a22";
const PAPER = "#f4eedf";
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

/** The contact line: location, then any real email and links on file. */
function contactLine() {
  const parts = [profile.location.replace(/\b(\w)(\w*)/g, (_, a, b) => a + b.toLowerCase())];
  if (contact.email && !/placeholder|example\.com/i.test(contact.email)) parts.push(contact.email);
  for (const link of contact.links) parts.push(link.url.replace(/^https?:\/\/(www\.)?/, ""));
  return parts.join("   ·   ");
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
  // A little paper: fibres and a faint warm vignette, light enough to print.
  let seed = 404;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = r() > 0.5 ? "rgba(120,96,58,0.05)" : "rgba(255,252,240,0.4)";
    ctx.fillRect(r() * RESUME_GRID.w, r() * RESUME_GRID.h, 2 + r() * 6, 0.8);
  }
  const edge = ctx.createRadialGradient(620, 877, 600, 620, 877, 1150);
  edge.addColorStop(0, "rgba(140,105,55,0)");
  edge.addColorStop(1, "rgba(140,105,55,0.12)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, RESUME_GRID.w, RESUME_GRID.h);

  const s = (px: number) => px * scale;
  const text = (t: string, x: number, y: number, font: string, color = INK) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(t, x, y);
  };
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Header: the name in typed capitals, the roles, the contact line, a double
  // rule. A fixed size (only the body scales), clear of the stamp beside it.
  let y = 132;
  tracking(ctx, 6);
  text(profile.name.join(" "), M, y, `bold 50px ${TYPE}`);
  tracking(ctx, 3);
  y += 40;
  text(profile.roles.join("  ·  "), M, y, `bold 19px ${TYPE}`, RED);
  tracking(ctx, 0);
  y += 34;
  text(contactLine(), M, y, `18px ${SERIF}`, SOFT);
  y += 22;
  ctx.fillStyle = INK;
  ctx.fillRect(M, y, WIDTH, 3);
  ctx.fillRect(M, y + 7, WIDTH, 1);
  y += s(30);

  // The case-closed stamp, top right, as the file's last mark.
  ctx.save();
  ctx.translate(RESUME_GRID.w - M - 120, 104);
  ctx.rotate(-0.12);
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = ctx.fillStyle = RED;
  ctx.lineWidth = 3;
  ctx.strokeRect(-118, -34, 236, 62);
  ctx.textAlign = "center";
  tracking(ctx, 3);
  ctx.font = `bold 26px ${TYPE}`;
  ctx.fillText("CASE CLOSED", 0, 7);
  tracking(ctx, 0);
  ctx.restore();

  const heading = (label: string) => {
    y += s(26);
    ctx.font = `bold ${s(19)}px ${TYPE}`;
    ctx.fillStyle = RED;
    tracking(ctx, 4);
    ctx.fillText(label, M, y);
    const w = ctx.measureText(label).width;
    tracking(ctx, 0);
    ctx.fillStyle = "rgba(138,42,34,0.45)";
    ctx.fillRect(M + w + 14, y - s(6), WIDTH - w - 14, 1.5);
    y += s(30);
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
    ctx.font = `bold ${s(14.5)}px ${TYPE}`;
    tracking(ctx, 1);
    const dw = ctx.measureText(date).width;
    ctx.fillStyle = MUTED;
    ctx.textAlign = "right";
    ctx.fillText(date, M + WIDTH, y);
    ctx.textAlign = "left";
    tracking(ctx, 0);
    ctx.font = `bold ${s(size)}px ${SERIF}`;
    const lines = wrap(ctx, title, WIDTH - dw - 30);
    lines.forEach((line, i) => text(line, M, y + i * s(size * 1.25), ctx.font));
    y += lines.length * s(size * 1.25);
  };

  heading("EDUCATION");
  for (const school of degrees()) {
    titled(school.institution, school.period.toUpperCase(), 16.5);
    paragraph(school.credential, M, WIDTH, `italic ${s(15.5)}px ${SERIF}`, s(22), MUTED);
    y += s(6);
  }

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
    ctx.font = `bold ${s(14)}px ${TYPE}`;
    tracking(ctx, 2);
    text(label, M, y, ctx.font, INK);
    tracking(ctx, 0);
    paragraph(value, M + 230, WIDTH - 230, `${s(16)}px ${SERIF}`, s(23));
    y += s(4);
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
