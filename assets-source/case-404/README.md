# CASE 404 — Source Assets

This directory holds **original, untouched** downloaded 3D assets (GLB/glTF)
for CASE 404. It is master storage, never runtime storage.

## Source vs. production

- `assets-source/case-404/` — immutable originals. Never edited, never
  overwritten, never loaded directly by the running application.
- `public/models/case-404/` — optimized, normalized, approved runtime
  copies. Only files that completed the pipeline below belong here.

## Pipeline

```
DOWNLOAD → SOURCE → AUDIT → OPTIMIZE → NORMALIZE → APPROVE → PRODUCTION → RUNTIME
```

1. **Download** — acquire a legitimately downloadable GLB/glTF.
2. **Source** — place the untouched original here, under the matching
   category folder.
3. **Audit** — inspect size, mesh/vertex/triangle counts, materials,
   texture count/dimensions, animations, embedded cameras/lights,
   duplicate nodes, bounding box, orientation, units/scale, pivot. Record
   findings in `ASSET_INVENTORY.md`.
4. **Optimize** — reduce web cost (geometry simplification, texture
   resizing/compression, removing unused nodes/cameras/lights, merging
   safe static geometry, instancing repeated props) without unacceptable
   visual loss.
5. **Normalize** — correct orientation, scale, and pivot for integration.
6. **Approve** — visually and technically verify the result.
7. **Production** — place the optimized copy in
   `public/models/case-404/<category>/`.
8. **Runtime** — load through `src/assets/assetManifest.ts`, never via a
   path hardcoded inside a scene component.

File size alone is never proof that an asset is production-ready.
