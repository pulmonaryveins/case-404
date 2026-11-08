/**
 * Cover artwork for the CASE 404 dossier: a typed file header, the embroidered
 * title, a typed index card and a red CONFIDENTIAL stamp.
 */
export const COVER_W = 1024;
const W = COVER_W;
const H = 1460;
const INK = "#292820";
const TYPE = '"Courier New", monospace';

type Ctx = CanvasRenderingContext2D;

function layer() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  return { c, g: c.getContext("2d")! };
}

/**
 * One embroidered shape: `shape` is drawn as a mask, then filled with thread
 * (`base`) and slanted satin stitches (`a`/`b` alternate every few rows).
 * Called twice, with the thread colours and with greys, so the colour map and
 * the bump map agree on every stitch.
 */
function thread(
  target: Ctx,
  shape: (g: Ctx) => void,
  base: string,
  a: string,
  b: string,
  shadow: string | null,
) {
  const { c, g } = layer();
  g.fillStyle = g.strokeStyle = "#000";
  shape(g);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-atop";
  g.lineWidth = 2.4;
  for (let i = -H; i < W + H; i += 4) {
    g.strokeStyle = (i / 4) % 7 < 3 ? a : b;
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + H * 0.58, H);
    g.stroke();
  }
  // Worn thread: a few filaments missing, so it is not a clean vector print.
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(0,0,0,${i % 3 ? 0.35 : 0.75})`;
    g.fillRect((i * 179 + 43) % W, (i * 311 + 17) % H, 1 + (i % 3), 1 + (i % 2));
  }
  target.save();
  if (shadow) {
    target.shadowColor = shadow;
    target.shadowBlur = 7;
    target.shadowOffsetX = 2;
    target.shadowOffsetY = 4;
  }
  target.drawImage(c, 0, 0);
  target.restore();
}

/** The embroidered CASE 404 patch: stitched border plus satin-stitched letters. */
function title(g: Ctx) {
  g.save();
  g.translate(512, 440);
  g.rotate(-0.025);
  g.lineWidth = 11;
  g.setLineDash([26, 5]);
  g.strokeRect(-422, -105, 844, 210);
  g.setLineDash([]);
  g.lineWidth = 3;
  g.strokeRect(-398, -81, 796, 162);
  g.textAlign = "center";
  g.font = 'bold 150px "Arial Narrow", Impact, sans-serif';
  g.lineWidth = 4;
  g.fillText("CASE 404", 0, 55, 740);
  g.strokeText("CASE 404", 0, 55, 740);
  g.restore();
}

/** Typed index label glued to the lower cover: the case facts. */
function caseLabel(g: Ctx) {
  const x = 190;
  const y = 700;
  const w = 644;
  const h = 330;
  g.save();
  g.translate(x + w / 2, y + h / 2);
  g.rotate(0.012);
  g.translate(-w / 2, -h / 2);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fillRect(5, 7, w, h);
  g.fillStyle = "#e9e1c6";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(120,100,60,0.55)";
  g.lineWidth = 2;
  g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = "#7a2a24";
  g.fillRect(10, 10, w - 20, 46);
  g.fillStyle = "#e9e1c6";
  g.font = `bold 24px ${TYPE}`;
  g.textAlign = "left";
  g.fillText("CASE FILE / INDEX CARD", 28, 42);
  g.textAlign = "right";
  g.fillText("No. 404", w - 28, 42);
  g.textAlign = "left";
  const rows: [string, string][] = [
    ["SUBJECT", "CLASSIFIED"],
    ["STATUS", "OPEN / UNDER REVIEW"],
    ["DIVISION", "DIGITAL & CREATIVE"],
    ["EVIDENCE", "DEV / UI-UX / VIDEO / DESIGN"],
    ["FILED", "CEBU FIELD OFFICE"],
  ];
  rows.forEach(([k, v], i) => {
    const ry = 98 + i * 46;
    g.fillStyle = "rgba(41,40,32,0.8)";
    g.font = `bold 19px ${TYPE}`;
    g.fillText(k, 30, ry);
    g.fillStyle = INK;
    g.font = `bold 23px ${TYPE}`;
    g.fillText(v, 190, ry);
    g.fillStyle = "rgba(41,40,32,0.22)";
    g.fillRect(28, ry + 11, w - 56, 1);
  });
  g.restore();
}

/** Paints the colour map and the matching bump map of the cover artwork. */
export function paintCover() {
  const color = layer();
  const height = layer();
  height.g.fillStyle = "#000";
  height.g.fillRect(0, 0, W, H);

  thread(color.g, title, "#8c2a22", "#b23a2e", "#6d1e18", "rgba(30,12,8,0.55)");
  thread(height.g, title, "#9a9a9a", "#ffffff", "#707070", null);

  const ctx = color.g;
  header(ctx);
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.8;
  ctx.font = `bold 30px ${TYPE}`;
  (ctx as Ctx & { letterSpacing: string }).letterSpacing = "10px";
  ctx.fillText("SUBJECT DOSSIER", 517, 625);
  (ctx as Ctx & { letterSpacing: string }).letterSpacing = "0px";
  ctx.globalAlpha = 1;

  caseLabel(ctx);
  stamp(ctx);
  return { color: color.c, height: height.c };
}

/** The typed file header across the top: department, file number, a rule. */
function header(g: Ctx) {
  g.save();
  g.fillStyle = INK;
  g.globalAlpha = 0.78;
  g.font = `bold 24px ${TYPE}`;
  g.textAlign = "left";
  g.fillText("DEPT. OF INVESTIGATION", 120, 215);
  g.textAlign = "right";
  g.fillText("FILE No. 404", 904, 215);
  g.fillRect(120, 232, 784, 3);
  g.fillRect(120, 240, 784, 1);
  g.restore();
}

/**
 * A red rubber CONFIDENTIAL stamp, a little crooked, its ink broken up where
 * the stamp did not meet the card (specks rubbed out of its own layer, never
 * drawn under a clip).
 */
function stamp(target: Ctx) {
  const { c, g } = layer();
  g.translate(512, 1180);
  g.rotate(-0.06);
  g.strokeStyle = g.fillStyle = "#a3271f";
  g.lineWidth = 7;
  g.strokeRect(-250, -62, 500, 124);
  g.lineWidth = 2.5;
  g.strokeRect(-236, -48, 472, 96);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `bold 64px ${TYPE}`;
  g.fillText("CONFIDENTIAL", 0, 4, 440);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "destination-out";
  let seed = 404;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.6})`;
    g.fillRect(250 + r() * 524, 1100 + r() * 160, 1 + r() * 4, 1 + r() * 2);
  }
  target.save();
  target.globalAlpha = 0.82;
  target.drawImage(c, 0, 0);
  target.restore();
}
