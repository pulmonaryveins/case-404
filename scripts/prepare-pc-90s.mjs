#!/usr/bin/env node
/**
 * Development-only: turns the downloaded 90s_-_00s_pc.glb into the runtime
 * asset. Eleven 2048px textures would cost ~250 MB of GPU memory, so they are
 * re-encoded as 1024px WebP. The clearcoat and specular material extensions
 * are dropped: they turn every material into the much larger physical shader,
 * and none of this plastic needs them.
 *
 * Usage: node scripts/prepare-pc-90s.mjs <in.glb> <out.glb>
 */
import { statSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
for (const ext of doc.getRoot().listExtensionsUsed()) {
  if (["KHR_materials_clearcoat", "KHR_materials_specular"].includes(ext.extensionName))
    ext.dispose();
}
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024], quality: 88 }),
  dedup(),
  prune(),
);
await io.write(output, doc);
console.log(`wrote ${output}: ${(statSync(output).size / 1e6).toFixed(2)} MB`);
