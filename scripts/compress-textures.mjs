#!/usr/bin/env node
/**
 * Development-only: in-place texture diet for runtime GLBs. Re-encodes every
 * texture as WebP and caps its size; geometry is untouched.
 *
 * Usage: node scripts/compress-textures.mjs <maxTexture> <a.glb> [b.glb ...]
 */
import { statSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";

const [max, ...files] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of files) {
  const before = statSync(f).size;
  const doc = await io.read(f);
  await doc.transform(
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [Number(max), Number(max)],
      quality: 90,
    }),
  );
  await io.write(f, doc);
  console.log(`${f}: ${(before / 1e6).toFixed(1)}MB -> ${(statSync(f).size / 1e6).toFixed(1)}MB`);
}
