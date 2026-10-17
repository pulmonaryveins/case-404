import smokeSource from "../experience/environment/DeskSmoke.tsx?raw";
import audioSource from "../experience/audio/computerAudio.ts?raw";

/**
 * Real code from this site, for the FRONTEND cluster's prints on the evidence
 * board: read from the source files themselves at build time, so the excerpts
 * stay true as the code changes. Each starts at a line containing `from` and
 * runs `count` lines (shorter if the file ends first, or at an `until` line).
 */
function excerpt(source: string, from: string, count: number, until?: string) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const start = Math.max(
    0,
    lines.findIndex((line) => line.includes(from)),
  );
  const slice = lines.slice(start, start + count);
  // Up to and including the first line that is `until` (the block's end).
  const end = until ? slice.findIndex((line) => line === until) : -1;
  return end >= 0 ? slice.slice(0, end + 1) : slice;
}

/** The code editor screenshot: the desk smoke's frame loop. */
export const editorCode = {
  file: "DeskSmoke.tsx",
  lines: excerpt(smokeSource, "useFrame(({ clock", 22),
};

/** The printed sheet: the archive terminal's disk-insert sound. */
export const printoutCode = {
  file: "computerAudio.ts",
  lines: excerpt(audioSource, "  insert(seconds", 20, "  },"),
};

/** The terminal: the commands that build and check this site. */
export const terminalLines = [
  "$ npm run dev",
  "",
  "  VITE v8.3.3  ready in 812 ms",
  "",
  "  ➜  Local:   http://localhost:5173/",
  "",
  "$ npx tsc -b",
  "$ npx eslint src",
  "$ npm run perf:check",
  "models 39.2MB, texture VRAM ~749MB",
  "perf budget OK",
  "$ _",
];
