import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/functions";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f);
  const r = doc.getRoot();
  const b = getBounds(r.listScenes()[0]);
  console.log(
    "\n===",
    f,
    "size",
    b.max.map((v, i) => (v - b.min[i]).toFixed(2)),
    "min",
    b.min.map((v) => v.toFixed(2)),
  );
  console.log(
    "materials:",
    r
      .listMaterials()
      .map(
        (m) =>
          `${m.getName()}[base:${m.getBaseColorTexture()?.getSize()?.join("x") || "-"} n:${m.getNormalTexture()?.getSize()?.join("x") || "-"} mr:${m.getMetallicRoughnessTexture()?.getSize()?.join("x") || "-"} color:${m.getBaseColorFactor().map((v) => v.toFixed(2))}]`,
      )
      .join("\n  "),
  );
  console.log(
    "textures:",
    r
      .listTextures()
      .map((t) => `${t.getSize()?.join("x")} ${(t.getImage().byteLength / 1048576).toFixed(1)}MB`)
      .join(", "),
  );
  let total = 0;
  for (const n of r.listNodes()) {
    const m = n.getMesh();
    if (!m) continue;
    let tris = 0;
    for (const p of m.listPrimitives())
      tris += (p.getIndices()?.getCount() ?? p.getAttribute("POSITION").getCount()) / 3;
    total += tris;
    const nb = getBounds(n);
    console.log(
      `  ${n.getName().slice(0, 40).padEnd(40)} tris=${tris} mat=${m
        .listPrimitives()
        .map((p) => p.getMaterial()?.getName())
        .join(
          ",",
        )} size=[${nb.max.map((v, i) => (v - nb.min[i]).toFixed(2))}] ctr=[${nb.max.map((v, i) => ((v + nb.min[i]) / 2).toFixed(2))}]`,
    );
  }
  console.log("total tris", total, "meshes", r.listMeshes().length);
}
