#!/usr/bin/env node
/**
 * Development-only: reports TRUE world-space bounds (node transforms applied)
 * for the runtime GLBs under public/models/case-404. Used to work out
 * normalization scale factors for the office blockout.
 *
 * Usage: node scripts/measure-glb.mjs
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/functions";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const DIR = join(ROOT, "public", "models", "case-404");

function findGlb(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...findGlb(full));
    else if (extname(e.name).toLowerCase() === ".glb") out.push(full);
  }
  return out;
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

for (const file of findGlb(DIR).sort()) {
  const doc = await io.read(file);
  const scene = doc.getRoot().listScenes()[0];
  const { min, max } = getBounds(scene);
  const size = max.map((v, i) => v - min[i]);
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  console.log(
    `${rel.padEnd(48)} size=[${size.map((v) => v.toFixed(3)).join(", ")}]  min=[${min
      .map((v) => v.toFixed(2))
      .join(", ")}]  (${(statSync(file).size / 1024 / 1024).toFixed(1)} MB)`,
  );
}
