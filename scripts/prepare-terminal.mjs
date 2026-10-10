#!/usr/bin/env node
/**
 * Development-only: turns the downloaded computer_terminal.glb into the
 * runtime asset. The file ships with the Sketchfab preview's baked "shadow"
 * and "background" planes (blended quads that would draw a dark patch and a
 * blue backdrop on the desk), which are removed; its four 2048px textures
 * (~76 MB of GPU memory) are re-encoded as 1024px WebP.
 *
 * Usage: node scripts/prepare-terminal.mjs <in.glb> <out.glb>
 */
import { statSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";

const PREVIEW_ONLY = new Set(["ShadowMaterial", "BackgroundMaterial"]);

const [input, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (mesh?.listPrimitives().some((p) => PREVIEW_ONLY.has(p.getMaterial()?.getName() ?? ""))) {
    node.setMesh(null);
  }
}
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024], quality: 88 }),
  dedup(),
  prune(),
);
await io.write(output, doc);
console.log(`wrote ${output}: ${(statSync(output).size / 1e6).toFixed(2)} MB`);
