#!/usr/bin/env node
/**
 * Development-only: shrinks a heavy source GLB into a runtime-ready one.
 * Textures are resized and re-encoded as WebP, the mesh is welded and
 * simplified, and unused data is pruned.
 *
 * Usage: node scripts/optimize-glb.mjs <in.glb> <out.glb> [maxTexture=1024] [triangleRatio=0.3]
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const [input, output, maxTexture = "1024", ratio = "0.3"] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    "usage: node scripts/optimize-glb.mjs <in.glb> <out.glb> [maxTexture] [triangleRatio]",
  );
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);

await MeshoptSimplifier.ready;
await doc.transform(
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: Number(ratio), error: 0.001 }),
  textureCompress({
    encoder: sharp,
    targetFormat: "webp",
    resize: [Number(maxTexture), Number(maxTexture)],
  }),
  prune(),
);

await io.write(output, doc);

let tris = 0;
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    tris += (prim.getIndices()?.getCount() ?? prim.getAttribute("POSITION").getCount()) / 3;
  }
}
console.log(`wrote ${output} — ${Math.round(tris)} triangles`);
