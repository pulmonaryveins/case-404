#!/usr/bin/env node
/**
 * Development-only: turns the three downloaded Sketchfab posters into runtime
 * assets for the graphic-design wall. Each file is a flat plane authored at
 * its own scale and facing a different way, so every one is baked, turned to
 * face +Z, scaled to a real poster height, and centred with its back on z = 0.
 * Only the base-colour map is kept (re-encoded as 1024px WebP); the 2048px
 * normal and roughness maps are dropped, and the paper is made matte.
 *
 * Usage: node scripts/prepare-posters.mjs <assets-source dir> <out dir>
 */
import { statSync } from "node:fs";
import { join } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  flatten,
  getBounds,
  prune,
  textureCompress,
  transformMesh,
} from "@gltf-transform/functions";
import sharp from "sharp";

/** `turn`: extra yaw so the art faces the right way; `roll`: extra spin in the plane. */
const POSTERS = [
  {
    in: "no_drink_soviet_poster_1.glb",
    out: "poster-portrait.glb",
    height: 0.62,
    keep: "pPlane1",
    flip: true,
  },
  { in: "russian_poster_1.glb", out: "poster-square.glb", height: 0.36 },
  { in: "russian_poster_2.glb", out: "poster-landscape.glb", height: 0.36 },
];

const [srcDir, outDir] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

const mul = (a, b) => {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
};
const rotY = (a) => [
  Math.cos(a),
  0,
  -Math.sin(a),
  0,
  0,
  1,
  0,
  0,
  Math.sin(a),
  0,
  Math.cos(a),
  0,
  0,
  0,
  0,
  1,
];
const rotX = (a) => [
  1,
  0,
  0,
  0,
  0,
  Math.cos(a),
  Math.sin(a),
  0,
  0,
  -Math.sin(a),
  Math.cos(a),
  0,
  0,
  0,
  0,
  1,
];
const rotZ = (a) => [
  Math.cos(a),
  Math.sin(a),
  0,
  0,
  -Math.sin(a),
  Math.cos(a),
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  0,
  1,
];

for (const p of POSTERS) {
  const doc = await io.read(join(srcDir, p.in));
  const scene = doc.getRoot().listScenes()[0];
  await doc.transform(flatten());
  for (const node of doc.getRoot().listNodes()) {
    if (p.keep && node.getMesh() && !node.getName().startsWith(p.keep)) node.setMesh(null);
  }
  const apply = (m) => {
    for (const node of doc.getRoot().listNodes()) {
      const mesh = node.getMesh();
      if (mesh) transformMesh(mesh, m);
    }
  };
  // Bake the node transforms into the vertices.
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    transformMesh(mesh, node.getWorldMatrix());
    node.setTranslation([0, 0, 0]).setRotation([0, 0, 0, 1]).setScale([1, 1, 1]);
  }
  // Turn the thinnest axis to Z.
  let b = getBounds(scene);
  const dims = b.max.map((v, i) => v - b.min[i]);
  const thin = dims.indexOf(Math.min(...dims));
  if (thin === 0) apply(rotY(Math.PI / 2));
  else if (thin === 1) apply(rotX(-Math.PI / 2));
  b = getBounds(scene);
  // The long in-plane side: portrait stands on its long side, others on y.
  const w = b.max[0] - b.min[0];
  const h = b.max[1] - b.min[1];
  if (p.out.includes("portrait") && w > h) apply(rotZ(Math.PI / 2));
  // The portrait plane is single-sided and authored facing -Z.
  if (p.flip) apply(rotY(Math.PI));
  b = getBounds(scene);
  const s = p.height / (b.max[1] - b.min[1]);
  apply([
    s,
    0,
    0,
    0,
    0,
    s,
    0,
    0,
    0,
    0,
    s,
    0,
    (-(b.min[0] + b.max[0]) / 2) * s,
    (-(b.min[1] + b.max[1]) / 2) * s,
    -b.min[2] * s,
    1,
  ]);

  for (const m of doc.getRoot().listMaterials()) {
    m.setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null);
    m.setRoughnessFactor(0.85).setMetallicFactor(0).setDoubleSided(false);
  }
  await doc.transform(
    textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024], quality: 90 }),
    prune(),
  );
  const o = getBounds(scene);
  const out = join(outDir, p.out);
  await io.write(out, doc);
  console.log(
    p.out,
    o.min.map((v) => +v.toFixed(3)),
    o.max.map((v) => +v.toFixed(3)),
    `${(statSync(out).size / 1e6).toFixed(2)} MB`,
  );
}
