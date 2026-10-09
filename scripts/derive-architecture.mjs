#!/usr/bin/env node
/**
 * Development-only: builds lean runtime derivatives of the architecture
 * source GLBs by keeping only the nodes the scene uses and pruning the rest
 * (unused meshes, materials, textures). Source files are read, never written.
 *
 * Usage: node scripts/derive-architecture.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune } from "@gltf-transform/functions";

const SRC = "assets-source/case-404/environment/architecture";
const OUT = "public/models/case-404/environment/architecture";

const derivatives = [
  {
    // One plain plaster wall module (1.03 x 3.44m). Object_9 is a showcase
    // strip of separate panels — plain modules at x 1.76, 3.31, 4.66, 6.23
    // plus door/window panels — so only the triangles of the module at
    // x 3.31..4.34 are kept; the scene repeats it edge to edge.
    src: `${SRC}/room/classic_modular_walls_ceiling_fixed.glb`,
    out: `${OUT}/walls/plaster-wall-module.glb`,
    keep: ["Object_9"],
    keepX: [3.3, 4.35],
  },
  {
    // Material only: the file is a material-preview scene (a cube, a plane and
    // sample spheres, ~1M tris) sharing one tileable board material. All of it is dropped and a 1x1 quad
    // carries the material; the scene tiles it across the floor.
    src: `${SRC}/floors/dark_wooden_floor__tile_texture.glb`,
    out: `${OUT}/floors/dark-wood-floor.glb`,
    keep: [],
    materialOnly: true,
  },
];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

for (const { src, out, keep, keepX, materialOnly } of derivatives) {
  const doc = await io.read(src);
  const material = doc.getRoot().listMaterials()[0];
  for (const node of doc.getRoot().listNodes()) {
    if (node.getMesh() && !keep.includes(node.getName())) node.setMesh(null);
  }
  if (keepX) {
    // Drop triangles outside the local-x range (one module of the strip).
    for (const prim of doc
      .getRoot()
      .listMeshes()
      .flatMap((m) => m.listPrimitives())) {
      const pos = prim.getAttribute("POSITION");
      const indices = prim.getIndices();
      const tris = indices.getArray();
      const inRange = (i) => {
        const x = pos.getElement(i, [])[0];
        return x >= keepX[0] && x <= keepX[1];
      };
      const kept = [];
      for (let t = 0; t < tris.length; t += 3) {
        if (inRange(tris[t]) && inRange(tris[t + 1]) && inRange(tris[t + 2])) {
          kept.push(tris[t], tris[t + 1], tris[t + 2]);
        }
      }
      indices.setArray(new tris.constructor(kept));
    }
  }
  if (materialOnly) {
    const buffer = doc.getRoot().listBuffers()[0];
    const accessor = (type, array) =>
      doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
    const quad = doc
      .createPrimitive()
      .setMaterial(material)
      .setAttribute(
        "POSITION",
        accessor("VEC3", new Float32Array([0, 0, 0, 1, 0, 0, 1, 0, -1, 0, 0, -1])),
      )
      .setAttribute(
        "NORMAL",
        accessor("VEC3", new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0])),
      )
      .setAttribute("TEXCOORD_0", accessor("VEC2", new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])))
      .setIndices(accessor("SCALAR", new Uint16Array([0, 1, 2, 0, 2, 3])));
    const node = doc
      .createNode("MaterialCarrier")
      .setMesh(doc.createMesh("Quad").addPrimitive(quad));
    doc.getRoot().listScenes()[0].addChild(node);
  }
  await doc.transform(prune());
  mkdirSync(dirname(out), { recursive: true });
  await io.write(out, doc);
  console.log(`${src} -> ${out}`);
}
