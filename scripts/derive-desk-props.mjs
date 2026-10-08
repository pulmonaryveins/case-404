#!/usr/bin/env node
/**
 * Development-only: builds runtime derivatives of the Phase 5 desk props.
 * Source GLBs under assets-source/ are read, never written.
 *
 * Only what each asset genuinely needs is changed:
 * - desk lamp:  4 x 4096² maps -> 2048². Decoded, the originals are ~357 MB
 *               of VRAM for a 44 cm prop that never fills more than a fraction
 *               of the frame.
 * - handgun:    1 x 4096² -> 1024². A 21 cm background prop. Its material is
 *               also authored KHR_materials_unlit, which ignores every light:
 *               in a lamp-lit room it would render at flat full brightness,
 *               unshaded and unshadowed. It is made lit, as dark gunmetal.
 * - plant:      KHR_materials_pbrSpecularGlossiness -> metal/rough. three.js
 *               no longer supports spec/gloss, so the original renders as flat
 *               untextured grey. It carries no spec/gloss texture, only factors
 *               plus a diffuse map, so the conversion is lossless. Also
 *               decimated: 112K triangles for a 40 cm background plant, drawn
 *               in the main pass and both shadow maps, measurably dropped
 *               frames in the opening view.
 *
 * `sharp` is not a direct dependency: it ships with @gltf-transform/functions
 * (via ndarray-pixels), which this script already requires.
 *
 * Usage: node scripts/derive-desk-props.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { metalRough, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";

const SRC = "assets-source/case-404";
const OUT = "public/models/case-404/props";

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

async function derive(src, out, transforms) {
  const doc = await io.read(`${SRC}/${src}`);
  await doc.transform(...transforms, prune());
  mkdirSync(dirname(`${OUT}/${out}`), { recursive: true });
  await io.write(`${OUT}/${out}`, doc);
  console.log(`${src} -> ${OUT}/${out}`);
}

const resize = (px) => textureCompress({ encoder: sharp, resize: [px, px] });

/** Strips KHR_materials_unlit so the material responds to the scene's lights. */
const lit = (metalness, roughness) => (doc) => {
  for (const ext of doc.getRoot().listExtensionsUsed()) {
    if (ext.extensionName === "KHR_materials_unlit") ext.dispose();
  }
  for (const m of doc.getRoot().listMaterials()) {
    m.setMetallicFactor(metalness).setRoughnessFactor(roughness);
  }
};

await derive("props/lamp/old_vintage_desk_lamp.glb", "desk-lamp.glb", [resize(2048)]);
await derive("props/miscellaneous/sp226_airsoft_handgun.glb", "handgun.glb", [
  resize(1024),
  lit(0.75, 0.42),
]);
await derive("props/plant/paper_tablet.glb", "plant.glb", [
  metalRough(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.25, error: 0.002 }),
]);

