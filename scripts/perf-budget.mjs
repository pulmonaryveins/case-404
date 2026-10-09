#!/usr/bin/env node
/**
 * Load-performance guard. Fails (exit 1) when the shipped 3D assets or the
 * canvas-painting code break the budgets that keep CASE 404 loading fast.
 *
 * Usage: node scripts/perf-budget.mjs   (npm run perf:check)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

const BUDGET = {
  maxTextureSide: 2048, // px, any single texture
  maxVramMB: 750, // current baseline ~710; lower it if low-end GPUs struggle // decoded RGBA + mips, all models together
  maxFileMB: 9, // any single GLB
  maxTotalMB: 40, // all GLBs together
  maxLoopOpsInClip: 5000, // canvas ops looped in a file that also calls ctx.clip()
};

const walk = (dir, ext) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(join(dir, e.name), ext)
      : e.name.endsWith(ext)
        ? [join(dir, e.name)]
        : [],
  );
const fails = [];
const warn = [];

// 1. Assets: decoded size is what the GPU pays, not the file size.
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
let vram = 0;
let total = 0;
for (const f of walk("public/models", ".glb")) {
  const mb = statSync(f).size / 1e6;
  total += mb;
  if (mb > BUDGET.maxFileMB)
    fails.push(`${relative(".", f)}: ${mb.toFixed(1)}MB > ${BUDGET.maxFileMB}MB file`);
  const doc = await io.read(f);
  for (const t of doc.getRoot().listTextures()) {
    const [w, h] = t.getSize() ?? [0, 0];
    vram += (w * h * 4 * 1.34) / 1e6;
    if (Math.max(w, h) > BUDGET.maxTextureSide)
      fails.push(`${relative(".", f)}: ${w}x${h} texture > ${BUDGET.maxTextureSide}px`);
  }
}
if (total > BUDGET.maxTotalMB)
  fails.push(`models total ${total.toFixed(1)}MB > ${BUDGET.maxTotalMB}MB`);
if (vram > BUDGET.maxVramMB)
  fails.push(`texture VRAM ~${Math.round(vram)}MB > ${BUDGET.maxVramMB}MB`);

// 2. Code: the freeze came from thousands of canvas ops run under ctx.clip().
for (const f of walk("src/experience", ".ts").concat(walk("src/experience", ".tsx"))) {
  const src = readFileSync(f, "utf8");
  if (!/\.clip\(\)/.test(src)) continue;
  const big = [...src.matchAll(/i\s*<\s*(\d[\d_]*)/g)]
    .map((m) => +m[1].replace(/_/g, ""))
    .filter((n) => n >= BUDGET.maxLoopOpsInClip);
  if (big.length)
    fails.push(
      `${relative(".", f)}: loop of ${big[0]} ops in a file using ctx.clip(); paint on an unclipped layer, then clip once with drawImage`,
    );
}

console.log(`models ${total.toFixed(1)}MB, texture VRAM ~${Math.round(vram)}MB`);
warn.forEach((w) => console.warn("warn:", w));
if (fails.length) {
  fails.forEach((m) => console.error("FAIL:", m));
  process.exit(1);
}
console.log("perf budget OK");
