#!/usr/bin/env node
/**
 * Development-only: prepares assets-source/wall-eanimated.glb for the desk.
 * Drops the eyes' KHR_materials_transmission (it forces a whole extra scene
 * render pass for a ~15% effect) in favour of plain glossy dark glass,
 * simplifies the mesh, and re-encodes the three 2048px PNGs as 1024px WebP.
 * The node animation (tracks, arms, neck, eyes) is kept as is.
 *
 * Usage: node scripts/prepare-walle.mjs <in.glb> <out.glb> [triangleRatio=0.35]
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const [input, output, ratio = "0.35"] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/prepare-walle.mjs <in.glb> <out.glb> [triangleRatio]");
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);

for (const material of doc.getRoot().listMaterials()) {
  const transmission = material.getExtension("KHR_materials_transmission");
  if (!transmission) continue;
  transmission.dispose();
  material.setAlphaMode("OPAQUE").setBaseColorFactor([0.02, 0.025, 0.03, 1]);
  material.setRoughnessFactor(0.08).setMetallicFactor(0.2);
}

await MeshoptSimplifier.ready;
await doc.transform(
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: Number(ratio), error: 0.002 }),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024] }),
  prune(),
);
await io.write(output, doc);

let tris = 0;
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    tris += (prim.getIndices()?.getCount() ?? prim.getAttribute("POSITION").getCount()) / 3;
  }
}
console.log(
  `wrote ${output} — ${Math.round(tris)} triangles, ${doc.getRoot().listAnimations().length} animation(s)`,
);
