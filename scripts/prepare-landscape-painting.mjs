#!/usr/bin/env node
/**
 * Development-only: cuts one painting out of free_medieval_paintings_pack.glb
 * for the typewriter corner. Keeps cuadro_17 (a Flemish village landscape in
 * a gilt frame, 1.99 x 1 m) and drops the other 22, then crops the shared
 * 1024px atlas to the part this painting's UVs use (its picture and the frame
 * strip), remapping the UVs to match, and re-encodes it as WebP. A 1024px
 * atlas would cost ~5.6 MB of GPU memory for a picture that uses a sixth of it.
 *
 * Usage: node scripts/prepare-landscape-painting.mjs <pack.glb> <out.glb>
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, textureCompress } from "@gltf-transform/functions";
import sharp from "sharp";

const KEEP = "cuadro_17";
const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/prepare-landscape-painting.mjs <pack.glb> <out.glb>");
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const root = doc.getRoot();

// Everything but the kept painting's own subtree (and its ancestors) goes.
const keep = root.listNodes().find((n) => n.getName() === KEEP);
if (!keep) throw new Error(`${KEEP} not found`);
const kept = new Set();
keep.traverse((n) => kept.add(n));
for (let p = keep.getParentNode(); p; p = p.getParentNode()) kept.add(p);
for (const n of root.listNodes()) if (!kept.has(n)) n.dispose();
await doc.transform(prune());

// The UV region it uses, padded a few pixels, becomes the whole texture.
const prims = keep
  .listChildren()
  .concat(keep)
  .flatMap((n) => n.getMesh()?.listPrimitives() ?? []);
let [u0, v0, u1, v1] = [1, 1, 0, 0];
const t = [0, 0];
for (const p of prims) {
  const uv = p.getAttribute("TEXCOORD_0");
  for (let i = 0; i < uv.getCount(); i++) {
    uv.getElement(i, t);
    [u0, v0, u1, v1] = [
      Math.min(u0, t[0]),
      Math.min(v0, t[1]),
      Math.max(u1, t[0]),
      Math.max(v1, t[1]),
    ];
  }
}
const texture = prims[0].getMaterial().getBaseColorTexture();
const image = Buffer.from(texture.getImage());
const { width: W, height: H } = await sharp(image).metadata();
const pad = 2;
const left = Math.max(0, Math.floor(u0 * W) - pad);
const top = Math.max(0, Math.floor(v0 * H) - pad);
const right = Math.min(W, Math.ceil(u1 * W) + pad);
const bottom = Math.min(H, Math.ceil(v1 * H) + pad);
const cropped = await sharp(image)
  .extract({ left, top, width: right - left, height: bottom - top })
  .png()
  .toBuffer();
texture.setImage(new Uint8Array(cropped)).setMimeType("image/png");

// Remap every UV into the cropped rectangle (accessors are copied first: the
// pack's primitives may share them).
for (const p of prims) {
  const uv = p.getAttribute("TEXCOORD_0").clone();
  for (let i = 0; i < uv.getCount(); i++) {
    uv.getElement(i, t);
    uv.setElement(i, [(t[0] * W - left) / (right - left), (t[1] * H - top) / (bottom - top)]);
  }
  p.setAttribute("TEXCOORD_0", uv);
}

await doc.transform(textureCompress({ encoder: sharp, targetFormat: "webp" }), prune());
await io.write(output, doc);
console.log(`wrote ${output}: ${KEEP}, texture ${right - left}x${bottom - top}`);
