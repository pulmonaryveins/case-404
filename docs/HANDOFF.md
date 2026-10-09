# CASE 404 — Handoff notes

Session of 2026-10-08/09 on branch `feat/board`. Read this before continuing on
another device. `ARCHITECTURE.md` stays the source of truth for structure; this
file records what changed and what is still open.

## Setting up on a new device

1. `git pull`, then `npm install`.
2. **Source models are not in git.** `assets-source/**/*.glb` is gitignored, so
   the originals (revolver 100 MB, IBM PCjr 68 MB, window originals, hat, badge,
   phone, `window-2.glb`) must be copied over by hand. The optimised runtime
   copies in `public/models/case-404/` ARE committed, so the app runs without them.
   You only need the originals to re-run the optimise scripts.
3. `npm run dev`. Open `/?story` for the scroll-progress overlay.
4. Checks: `npm run typecheck && npm run lint && npm run build`.

Reviewing the scene in a browser tab: the first frame after load is blank until
the page is scrolled a few pixels; nudge `window.scrollTo(0, 4)` then `3`.

## What changed

### Evidence board (`src/data/evidenceBoard.ts`, `surfaces/paintCaseBoard.ts`, `EvidenceBoard.tsx`)

- Four role piles (Frontend UL, UI/UX LL, Graphic Design UR, Video Editing LR):
  three photos plus a role card each, overlapping with a per-paper depth `lift`.
  Positions are `movedPieces` in `evidenceBoard.ts`.
- New painted photo kinds: browser page, phone screen, colour palette, video
  still, app mock-up. Stray photos/notes/pins hidden (`hiddenPieces`).
- Baked cork/map shadows replaced (`repaintCork`, `mapStains`).
- One master pin on the CASE 404 file's top edge; straight red strings to all 16
  remaining pins (`connections`).
- CASE 404 file redrawn: bigger, unknown-subject "?" photo slot, realistic faded
  fingerprints (`fingerprint()`), location field, coffee ring.
- The light from above the board was **removed** (see Lighting).

### Dossier (`DossierEvidence.tsx`, `surfaces/paintDossierPhotos.ts`)

- Philippines map replaced by a sepia apartment-block "Residence Record" card.
- Two location polaroids replaced by blurred silhouette portraits. All imagery is
  drawn in code (no external images).

### Desk props (`DeskProps.tsx`, `assetManifest.ts`)

Current layout (world x/z, desk top 0.778). Edit the manifest entries to move things.

| Prop | Where | Notes |
| --- | --- | --- |
| Lamp | back left | pull-chain split into own mesh so it casts no shadow (`scripts/split-lamp-chain.mjs`) |
| Ashtray + smoke | (-0.32, -2.26) | `SMOKE_AT` in DeskProps must track it |
| Colt Python revolver | (-0.38, -1.88) | `rotation` yaw -2.3; optimised from 100 MB (`scripts/optimize-glb.mjs`); chambered rounds hidden |
| 3 loose .357 rounds | behind revolver | `BULLETS` list; contact-shadow blobs |
| Sheriff badge | (-0.37, -2.0) | face-up; Fallout New Vegas badge (IP: check rights) |
| Folder / dossier | centre | unchanged; open cover reaches x ≈ -0.30 left, ≈ 0.64 right |
| Aluminium pen | (0.27, -2.0) | |
| Fedora (black) | (0.41, -1.93) | colour set via GLB base-colour factor; may clash with open dossier's right page |
| Black phone | (0.62, -1.97) | tilted -0.6; body recoloured black in the GLB |
| Creeper | (0.6, -2.2) | Minecraft IP: check rights; NearestFilter texture |
| Plant | right back | unchanged |

Parked (model + manifest entry kept, not placed): `fountainPens`.
`DESK_PROPS` in `DeskProps.tsx` is the list of what is placed.

### Room / lighting

- `MoonWindow.tsx`: the left wall now has a cut opening with `window-2.glb`
  (brown frames, built by `scripts/prepare-window-2.mjs`), dark night + small
  moon behind it, and one cool shadow-casting spot light (`MOON`) from outside.
  The window itself is outside the default camera frame; its light and bar
  shadows on the back wall are what shows.
- `OfficeLighting.tsx`: the board spotlight was deleted. Only the desk lamp,
  the moonlight, a hemisphere fill (1.15) and contact shadows remain. If the
  board looks too dark, raise the hemisphere value first.
- Moon and lamp both dim as the dossier opens (`storyRig.dossierOpen`).
- Lamp: brighter bulb glow/halo, `LAMP` 10, decay 0.9.

### New scripts (`scripts/`)

- `optimize-glb.mjs in out [maxTexture] [triangleRatio]` — resize textures to
  WebP, simplify mesh.
- `split-lamp-chain.mjs` — splits the pull-chain beads out of `desk-lamp.glb`.
- `prepare-window-2.mjs` — squares, centres, scales and recolours `window-2.glb`.

## Assets (all in `ASSET_INVENTORY.md` / `ASSET_CREDITS.md`)

Runtime GLBs added under `public/models/case-404/`: `props/` revolver, magnum
bullets, aluminium pen, fountain pens (parked), creeper, fedora, sheriff badge,
phone (optimised), `environment/window-2.glb`, `workstation/ibm-pcjr.glb`.
Removed: `props/handgun.glb`.

**Licences / authors are unknown for most of these**; the asset docs say so.
Third-party IP to check before publishing: Minecraft creeper, Fallout sheriff
badge. Credit **Freepoly.org** for the IBM PCjr.

## On hold

- **IBM PCjr evidence station** (right side of the room, Zone B). Reviewed:
  downloadable copy is in `assets-source/case-404/workstation/computer/ibm-pcjr.glb`;
  a 37k-tri preview is at `public/models/case-404/workstation/ibm-pcjr.glb` but is
  **not placed**. Confirmed customisable per material (case, keyboard, cables) and
  the CRT screen takes a canvas texture (needs planar UVs and a vertical flip).
  Model is tagged NoAI. Confirm the download licence first.

## Open items / ideas

- Fedora (x 0.41) overlaps the open dossier's right page; hide it while the
  dossier is open or move it.
- Desk right side is crowded (phone, creeper, fedora, pen).
- Moonlight/ambient were tuned only at the default view; check the camera moves
  and the dossier close-up.
- Left wall window is off-screen at the default camera; a short camera pan would
  show it.
- Repo size: `public/models` is large and committed in plain git (consider LFS).
- `ARCHITECTURE.md` is stale in places (still says Phase 0 for models/manifest).
