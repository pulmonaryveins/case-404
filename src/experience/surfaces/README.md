# Dynamic Content Surfaces

Downloaded models provide physical geometry. This directory provides
dynamic content on top of that geometry — the application-controlled
layer that makes a 3D object display real portfolio data.

Future concepts (not implemented in Phase 0):

- `PaperSurface` — 3D paper + CASE 404 document content
- `PhotoSurface` — 3D Polaroid + project/experience image
- `EvidenceSurface` — 3D corkboard + evidence content
- `DossierPage` — 3D dossier + About/Education/Experience content
- `LabelSurface` — 3D floppy disk + project label
- `CRTScreen` — 3D CRT shell + interactive project archive

Likely implementation techniques (Phase 5+): Three.js planes, `CanvasTexture`,
texture replacement, or an HTML/DOM surface where readability demands it.
