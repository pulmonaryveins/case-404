#!/usr/bin/env node
/**
 * Development-only: turns the raw `window-2.glb` (a casement window authored
 * on a 60° diagonal, in odd units, with white metal frames) into a runtime
 * model: yawed square to the axes, centred on its own middle, scaled to
 * metres (~1.5 m), frames recoloured brown, glass faint. Run after dropping
 * the source at assets-source/window-2.glb.
 *
 * Usage: node scripts/prepare-window-2.mjs [in.glb] [out.glb]
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune } from "@gltf-transform/functions";

const [
  input = "assets-source/window-2.glb",
  output = "public/models/case-404/environment/window-2.glb",
] = process.argv.slice(2);

const YAW = Math.PI / 3; // the frame's top bar runs along (0.5, 0, 0.866)
const SCALE = 0.032; // 46 units wide -> ~1.5 m
// Centre of the frame after yaw, measured from the model (x, y, z).
const CENTRE = [0.85, 38.2, -5.67];
const BROWN = [0.2, 0.115, 0.06, 1];

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const scene = doc.getRoot().listScenes()[0];

const wrapper = doc.createNode("window-2");
for (const child of scene.listChildren()) {
  scene.removeChild(child);
  wrapper.addChild(child);
}
scene.addChild(wrapper);
// three/glTF rotation about +y by YAW: q = (0, sin(YAW/2), 0, cos(YAW/2)).
wrapper.setRotation([0, Math.sin(YAW / 2), 0, Math.cos(YAW / 2)]);
wrapper.setScale([SCALE, SCALE, SCALE]);
wrapper.setTranslation(CENTRE.map((v) => -v * SCALE));

for (const m of doc.getRoot().listMaterials()) {
  const name = m.getName();
  if (name === "metal_blanco")
    m.setBaseColorFactor(BROWN).setRoughnessFactor(0.55).setMetallicFactor(0);
  if (name === "Generic")
    m.setBaseColorFactor([0.35, 0.24, 0.1, 1]).setMetallicFactor(0.6).setRoughnessFactor(0.4);
  if (name === "tornillos") m.setBaseColorFactor([0.3, 0.25, 0.2, 1]);
}

await doc.transform(dedup(), prune());
await io.write(output, doc);
console.log(`wrote ${output}`);
