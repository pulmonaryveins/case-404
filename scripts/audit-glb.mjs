#!/usr/bin/env node
/**
 * Development-only GLB/glTF audit tool for CASE 404.
 *
 * Scans assets-source/case-404 (recursively) for .glb/.gltf files, extracts
 * measurable technical data via @gltf-transform/core, and writes:
 *   - assets-source/case-404/catalog.json   (machine-readable, used by the
 *     dev model inspector)
 *   - a Markdown table printed to stdout, for pasting into ASSET_INVENTORY.md
 *
 * Never fabricates values it can't measure — missing data is reported as
 * "unknown" rather than guessed. Read-only: does not modify any .glb.
 *
 * Usage: node scripts/audit-glb.mjs
 */
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE_DIR = process.argv[2]
  ? join(ROOT, process.argv[2])
  : join(ROOT, "assets-source", "case-404");

function findGlbFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findGlbFiles(full));
    } else if ([".glb", ".gltf"].includes(extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

async function auditFile(io, filePath) {
  const size = statSync(filePath).size;
  const relPath = relative(ROOT, filePath).replace(/\\/g, "/");
  const name = basename(filePath);

  let document;
  try {
    document = await io.read(filePath);
  } catch (err) {
    return {
      name,
      relPath,
      sizeBytes: size,
      sizeLabel: formatBytes(size),
      error: `failed to parse: ${err.message}`,
    };
  }

  const root = document.getRoot();
  const meshes = root.listMeshes();
  const materials = root.listMaterials();
  const textures = root.listTextures();
  const animations = root.listAnimations();
  const cameras = root.listCameras();
  const scenes = root.listScenes();
  const nodes = root.listNodes();

  let primitiveCount = 0;
  let vertexCount = 0;
  let triangleCount = 0;
  for (const mesh of meshes) {
    for (const prim of mesh.listPrimitives()) {
      primitiveCount++;
      const position = prim.getAttribute("POSITION");
      const vCount = position ? position.getCount() : 0;
      vertexCount += vCount;
      const indices = prim.getIndices();
      if (indices) {
        triangleCount += Math.round(indices.getCount() / 3);
      } else if (prim.getMode() === 4 /* TRIANGLES */) {
        triangleCount += Math.round(vCount / 3);
      }
    }
  }

  let largestTexture = null;
  const textureSizes = [];
  for (const tex of textures) {
    const size2 = tex.getSize();
    if (size2) {
      textureSizes.push(size2);
      if (!largestTexture || size2[0] * size2[1] > largestTexture[0] * largestTexture[1]) {
        largestTexture = size2;
      }
    }
  }

  // Approx untransformed local bounding box from accessor min/max across
  // all mesh primitives (does not account for node transforms — a rough
  // per-asset scale signal, not a precise world-space bound).
  let bboxMin = null;
  let bboxMax = null;
  for (const mesh of meshes) {
    for (const prim of mesh.listPrimitives()) {
      const position = prim.getAttribute("POSITION");
      if (!position) continue;
      const min = position.getMinNormalized ? position.getMinNormalized([]) : null;
      const max = position.getMaxNormalized ? position.getMaxNormalized([]) : null;
      if (min && max) {
        bboxMin = bboxMin ? bboxMin.map((v, i) => Math.min(v, min[i])) : min;
        bboxMax = bboxMax ? bboxMax.map((v, i) => Math.max(v, max[i])) : max;
      }
    }
  }
  const dimensions =
    bboxMin && bboxMax ? bboxMax.map((v, i) => Number((v - bboxMin[i]).toFixed(3))) : null;

  const extensionsUsed = document
    .getRoot()
    .listExtensionsUsed()
    .map((e) => e.extensionName);
  const hasLights = extensionsUsed.includes("KHR_lights_punctual");
  const lightCount = hasLights ? root.listExtensionsUsed().length : 0;

  return {
    name,
    relPath,
    sizeBytes: size,
    sizeLabel: formatBytes(size),
    sceneCount: scenes.length,
    nodeCount: nodes.length,
    meshCount: meshes.length,
    primitiveCount,
    vertexCount,
    triangleCount,
    materialCount: materials.length,
    textureCount: textures.length,
    largestTexture: largestTexture ? `${largestTexture[0]}x${largestTexture[1]}` : "not detected",
    animationCount: animations.length,
    cameraCount: cameras.length,
    lightsDetected: hasLights,
    dimensions: dimensions ? dimensions.map((d) => d.toFixed(2)).join(" x ") : "unknown",
    nodeNames: nodes
      .slice(0, 12)
      .map((n) => n.getName())
      .filter(Boolean),
    materialNames: materials
      .slice(0, 12)
      .map((m) => m.getName())
      .filter(Boolean),
    extensionsUsed,
  };
}

async function main() {
  const files = findGlbFiles(SOURCE_DIR).sort();
  if (files.length === 0) {
    console.error(`No .glb/.gltf files found under ${SOURCE_DIR}`);
    process.exit(0);
  }

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const results = [];
  for (const f of files) {
    results.push(await auditFile(io, f));
  }

  const catalogPath = join(SOURCE_DIR, "catalog.json");
  writeFileSync(catalogPath, JSON.stringify(results, null, 2) + "\n");
  console.error(`Wrote ${catalogPath}`);

  const header =
    "| Asset | Source Path | File Size | Meshes | Triangles | Materials | Textures | Largest Texture | Animations | Dimensions (local, approx) | Notes |";
  const divider = "|---|---|---|---|---|---|---|---|---|---|---|";
  const rows = results.map((r) => {
    if (r.error) {
      return `| ${r.name} | ${r.relPath} | ${r.sizeLabel} | — | — | — | — | — | — | — | ${r.error} |`;
    }
    const notes = [
      r.lightsDetected ? "embedded lights" : "",
      r.cameraCount > 0 ? `${r.cameraCount} embedded camera(s)` : "",
      r.extensionsUsed.length ? `ext: ${r.extensionsUsed.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("; ");
    return `| ${r.name} | ${r.relPath} | ${r.sizeLabel} | ${r.meshCount} | ${r.triangleCount} | ${r.materialCount} | ${r.textureCount} | ${r.largestTexture} | ${r.animationCount} | ${r.dimensions} | ${notes} |`;
  });

  console.log([header, divider, ...rows].join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
