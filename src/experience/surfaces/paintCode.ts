type Ctx = CanvasRenderingContext2D;

const MONO = '"Cascadia Code", Consolas, "Courier New", monospace';

const KEYWORDS = new Set([
  "const",
  "let",
  "for",
  "if",
  "else",
  "return",
  "function",
  "new",
  "import",
  "export",
  "from",
  "true",
  "false",
  "null",
]);

/** Editor colours: a dark theme, roughly as the code is written in. */
const THEME = {
  ground: "#1e1f24",
  gutter: "#26272d",
  lineNo: "#5d6068",
  text: "#c9ccd3",
  keyword: "#c58fe0",
  string: "#a6cc84",
  number: "#e3a066",
  comment: "#6f7a6e",
  call: "#7fb6e8",
};

/** Splits a line into coloured runs: comments, strings, numbers, keywords, calls. */
function tokens(line: string, colours: typeof THEME) {
  const out: [string, string][] = [];
  const re = /(\/\/.*$)|("[^"]*"|'[^']*'|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+|.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [all, comment, str, num, word] = m;
    let colour = colours.text;
    if (comment) colour = colours.comment;
    else if (str) colour = colours.string;
    else if (num) colour = colours.number;
    else if (word && KEYWORDS.has(word)) colour = colours.keyword;
    else if (word && line[re.lastIndex] === "(") colour = colours.call;
    out.push([all, colour]);
  }
  return out;
}

function drawLine(ctx: Ctx, line: string, x: number, y: number, colours: typeof THEME) {
  for (const [text, colour] of tokens(line, colours)) {
    ctx.fillStyle = colour;
    ctx.fillText(text, x, y);
    x += ctx.measureText(text).width;
  }
}

/** Sizes the font so the longest line fits `width`, capped at `max`. */
function fitFont(ctx: Ctx, lines: string[], width: number, max: number) {
  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), "");
  ctx.font = `${max}px ${MONO}`;
  const px = Math.min(max, (max * width) / Math.max(1, ctx.measureText(longest).width));
  ctx.font = `${px}px ${MONO}`;
  return px;
}

/** A screenshot of a code editor: a tab with the file's name, line numbers, highlighted code. */
export function paintCodeEditor(ctx: Ctx, w: number, h: number, file: string, lines: string[]) {
  ctx.fillStyle = THEME.ground;
  ctx.fillRect(0, 0, w, h);
  const tabH = h * 0.08;
  ctx.fillStyle = "#17181c";
  ctx.fillRect(0, 0, w, tabH);
  ctx.fillStyle = THEME.ground;
  ctx.fillRect(w * 0.02, tabH * 0.18, w * 0.26, tabH * 0.82);
  ctx.fillStyle = "#d6d8de";
  ctx.font = `${tabH * 0.45}px ${MONO}`;
  ctx.textBaseline = "middle";
  ctx.fillText(file, w * 0.04, tabH * 0.6);
  const gutter = w * 0.07;
  ctx.fillStyle = THEME.gutter;
  ctx.fillRect(0, tabH, gutter, h - tabH);

  const lh = (h - tabH * 1.4) / lines.length;
  const px = fitFont(ctx, lines, w - gutter * 1.3, lh * 0.78);
  lines.forEach((line, i) => {
    const y = tabH * 1.2 + lh * (i + 0.5);
    ctx.fillStyle = THEME.lineNo;
    ctx.font = `${px * 0.85}px ${MONO}`;
    ctx.textAlign = "right";
    ctx.fillText(String(i + 1), gutter * 0.8, y);
    ctx.textAlign = "left";
    ctx.font = `${px}px ${MONO}`;
    drawLine(ctx, line, gutter * 1.15, y, THEME);
  });
  ctx.textBaseline = "alphabetic";
}

/** Columns on the printed sheet: longer lines wrap, as a printer wraps them. */
const PRINT_COLUMNS = 44;

/** Breaks a line at PRINT_COLUMNS, continuing it indented under itself. */
function wrap(line: string) {
  const indent = line.match(/^\s*/)![0] + "  ";
  const out: string[] = [];
  let rest = line;
  while (rest.length > PRINT_COLUMNS) {
    let cut = rest.lastIndexOf(" ", PRINT_COLUMNS);
    if (cut <= indent.length) cut = PRINT_COLUMNS;
    out.push(rest.slice(0, cut));
    rest = indent + rest.slice(cut).trimStart();
  }
  out.push(rest);
  return out;
}

/**
 * Code printed on paper: black monospace, a header with the file's name (clear
 * of the pin in the top margin), a faint rule, then the code at a size set by
 * the sheet's columns, as many lines as fit.
 */
export function paintCodePrintout(ctx: Ctx, w: number, h: number, file: string, source: string[]) {
  ctx.fillStyle = "#e4dccb";
  ctx.fillRect(0, 0, w, h);
  const m = w * 0.07;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#3a352e";
  ctx.font = `bold ${h * 0.03}px ${MONO}`;
  ctx.fillText(file, m, h * 0.1);
  ctx.fillStyle = "rgba(58,53,46,0.4)";
  ctx.fillRect(m, h * 0.125, w - m * 2, 1.5);
  fitFont(ctx, ["x".repeat(PRINT_COLUMNS)], w - m * 2, h);
  const lh = parseFloat(ctx.font) * 1.3;
  const lines = source.flatMap(wrap).slice(0, Math.floor((h * 0.83) / lh));
  const ink = {
    ...THEME,
    text: "#24211c",
    keyword: "#24211c",
    call: "#24211c",
    string: "#4a4438",
    number: "#24211c",
    comment: "#7b7466",
  };
  lines.forEach((line, i) => drawLine(ctx, line, m, h * 0.155 + lh * (i + 0.5), ink));
  ctx.textBaseline = "alphabetic";
}

/** A terminal window: title bar with its three dots, then the session's lines. */
export function paintTerminal(ctx: Ctx, w: number, h: number, lines: string[]) {
  ctx.fillStyle = "#121315";
  ctx.fillRect(0, 0, w, h);
  const bar = h * 0.08;
  ctx.fillStyle = "#2b2c30";
  ctx.fillRect(0, 0, w, bar);
  ["#d9584c", "#e0b14a", "#62b65c"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(w * (0.05 + i * 0.045), bar / 2, bar * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });
  const m = w * 0.05;
  const lh = (h - bar * 1.5) / lines.length;
  fitFont(ctx, lines, w - m * 2, lh * 0.72);
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => {
    ctx.fillStyle = line.startsWith("$")
      ? "#e8e8e8"
      : line.includes("ready") || line.includes("OK")
        ? "#7fd18a"
        : "#9aa0a8";
    ctx.fillText(line, m, bar * 1.3 + lh * (i + 0.5));
  });
  ctx.textBaseline = "alphabetic";
}
