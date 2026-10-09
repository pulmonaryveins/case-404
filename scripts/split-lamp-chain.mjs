#!/usr/bin/env node
/**
 * Development-only: splits the desk lamp's bead pull-chain into its own mesh
 * (node `Lamp1_chain`) so the runtime can stop it casting a shadow.
 *
 * The chain hangs a few centimetres from the bulb, so the spot light projects
 * it as a huge beaded stripe on the far wall. The lamp is one welded mesh, so
 * the beads (many tiny separate triangle islands in one small column) are found
 * by connectivity and moved to a second primitive sharing the same vertices.
 *
 * Usage: node scripts/split-lamp-chain.mjs [in.glb] [out.glb]
 *   (defaults: public/models/case-404/props/desk-lamp.glb, in place)
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

const [input = "public/models/case-404/props/desk-lamp.glb", output = input] =
  process.argv.slice(2);

// Chain column in the lamp's own units (cm-ish): x 11.9–12.4, z 7.3–7.8.
const CHAIN = { x: [11.9, 12.4], z: [7.3, 7.8], maxSize: 0.35 };

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const root = doc.getRoot();

const node = root.listNodes().find((n) => n.getMesh());
const mesh = node.getMesh();
const prim = mesh.listPrimitives()[0];
const pos = prim.getAttribute("POSITION");
const idx = prim.getIndices();
const triCount = idx.getCount() / 3;

// Weld by position so seams do not split a bead, then union triangle islands.
const weld = new Map();
const vid = new Int32Array(pos.getCount());
for (let i = 0; i < pos.getCount(); i++) {
  const key = pos
    .getElement(i, [])
    .map((v) => Math.round(v * 1e5))
    .join(",");
  if (!weld.has(key)) weld.set(key, weld.size);
  vid[i] = weld.get(key);
}
const parent = Array.from({ length: weld.size }, (_, i) => i);
const find = (a) => {
  while (parent[a] !== a) {
    parent[a] = parent[parent[a]];
    a = parent[a];
  }
  return a;
};
const tri = (t) => [0, 1, 2].map((k) => idx.getScalar(t * 3 + k));
for (let t = 0; t < triCount; t++) {
  const [a, b, c] = tri(t).map((v) => vid[v]);
  parent[find(a)] = find(b);
  parent[find(b)] = find(c);
}

const islands = new Map();
for (let t = 0; t < triCount; t++) {
  const root_ = find(vid[tri(t)[0]]);
  let island = islands.get(root_);
  if (!island) {
    island = {
      tris: [],
      min: [Infinity, Infinity, Infinity],
      max: [-Infinity, -Infinity, -Infinity],
    };
    islands.set(root_, island);
  }
  island.tris.push(t);
  for (const v of tri(t)) {
    const p = pos.getElement(v, []);
    for (let a = 0; a < 3; a++) {
      island.min[a] = Math.min(island.min[a], p[a]);
      island.max[a] = Math.max(island.max[a], p[a]);
    }
  }
}

const chain = new Set();
let beads = 0;
for (const { tris, min, max } of islands.values()) {
  const small = [0, 1, 2].every((a) => max[a] - min[a] < CHAIN.maxSize);
  const inColumn =
    min[0] >= CHAIN.x[0] && max[0] <= CHAIN.x[1] && min[2] >= CHAIN.z[0] && max[2] <= CHAIN.z[1];
  if (small && inColumn) {
    beads++;
    tris.forEach((t) => chain.add(t));
  }
}
if (!chain.size) throw new Error("no chain beads found — has the model changed?");

const rest = [];
const beadIdx = [];
for (let t = 0; t < triCount; t++) {
  (chain.has(t) ? beadIdx : rest).push(...tri(t));
}

const buffer = root.listBuffers()[0];
const accessor = (array) =>
  doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(array)).setBuffer(buffer);

const chainPrim = prim.clone().setIndices(accessor(beadIdx));
prim.setIndices(accessor(rest));
const chainMesh = doc.createMesh("Lamp1_chain").addPrimitive(chainPrim);
const chainNode = doc.createNode("Lamp1_chain").setMesh(chainMesh);
const parentNode = node.getParentNode();
if (parentNode) parentNode.addChild(chainNode);
else doc.getRoot().getDefaultScene().addChild(chainNode);

await io.write(output, doc);
console.log(`split ${beads} chain beads (${chain.size} triangles) into Lamp1_chain → ${output}`);
