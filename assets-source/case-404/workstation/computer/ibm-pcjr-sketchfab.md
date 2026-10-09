# IBM PCjr 4863 Computer — External Sketchfab Embed

**Name:** IBM PCjr 4863 Computer
**Type:** External Sketchfab Embed
**Role:** CASE 404 Project Archive workstation computer
**Model ID:** `1c3c3cd0643d44d49a1771048da74c62`
**Model Page:** https://sketchfab.com/3d-models/ibm-pcjr-4863-computer-1c3c3cd0643d44d49a1771048da74c62
**Embed:** https://sketchfab.com/models/1c3c3cd0643d44d49a1771048da74c62/embed
**Author:** Freepoly.org (@blackrray) — https://sketchfab.com/blackrray
**Size:** 307K triangles, 164K vertices, no animation
**Downloadable:** No — the model page shows only Add To / Embed / Share / Report, no Download button (checked by the project owner)
**Licence:** not shown on the page when reviewed — confirm on the model page
**Tag:** NoAI — not to be used in AI datasets or as generative-AI input
**Local GLB:** No — not offered for download
**Integration:** Deferred

## Plan

A downloadable copy is now in the project (`ibm-pcjr.glb` here, 68 MB, gitignored).
An optimised runtime copy for review is `public/models/case-404/workstation/ibm-pcjr.glb`
(2.3 MB, 37K tris, 1024² WebP maps, made with `scripts/optimize-glb.mjs`).
Credit Freepoly.org with a link. Confirm the licence of the downloaded copy
before shipping.

## Customisation review

Reviewed from the source file and rendered in the dev scene:

- Seven materials, each a separate part: screen (`default_1003`), monitor
  housing (`default_1002`), system unit (`default_1004`), monitor back and
  front trim (`default_1001`), floppy-drive details (`default_1005`), keyboard
  (`default_1006`), cables and mouse (`default_1007`). All named
  `defaultMaterial` as nodes, so parts are told apart by material.
- **Case colour:** works per part by tinting the material's base colour.
- **Screen:** confirmed — a canvas texture (our terminal) renders on the CRT.
  The glass is the largest island of `default_1003`; it needs its own UVs
  (planar, 0–1) and a vertical flip, then an emissive CanvasTexture.
- **Keyboard keys:** ~64 separate islands, so they can be recoloured or
  animated if split into their own mesh.
- Maps are baked PBR (no emissive), so any glow comes from our own emissive
  material.

## Restrictions

- Official embed only
- No scraping
- No unofficial extraction
- Not part of the R3F scene graph
- Not treated as local geometry

## Separate concerns

The IBM PCjr visual model and the CASE 404 Project Archive UI (boot
sequence, project categories, CRT screen content) are separate concerns.
The embed supplies the physical computer's appearance; the Project
Archive's actual interactive content is application-controlled and does
not depend on what the embed can or can't expose.

## Known limitations (not solved in Phase 1A)

The future iframe:

- is not an R3F mesh
- cannot receive Three.js lighting
- cannot cast native R3F shadows
- cannot naturally participate in R3F occlusion
- cannot have its internal materials controlled by our scene
- requires DOM/iframe integration

Art direction for the Project Archive chapter must account for these
limitations when it's designed (Phase 6).

Not scraped, not downloaded, not integrated during Phase 1A.
