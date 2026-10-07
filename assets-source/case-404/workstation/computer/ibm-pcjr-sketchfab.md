# IBM PCjr 4863 Computer — External Sketchfab Embed

**Name:** IBM PCjr 4863 Computer
**Type:** External Sketchfab Embed
**Role:** CASE 404 Project Archive workstation computer
**Model ID:** `1c3c3cd0643d44d49a1771048da74c62`
**Model Page:** https://sketchfab.com/3d-models/ibm-pcjr-4863-computer-1c3c3cd0643d44d49a1771048da74c62
**Embed:** https://sketchfab.com/models/1c3c3cd0643d44d49a1771048da74c62/embed
**Local GLB:** No
**Integration:** Deferred

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
