# CASE 404 — Architecture

Technical source of truth. Read this before making structural changes.
`DEVELOPMENT.md` covers agent/dev tooling only — not application
architecture.

## 1. Project identity

CASE 404 is an interactive 3D detective portfolio: a cinematic
investigation that happens to be a portfolio, not a portfolio with a
detective skin. The visitor investigates a believable detective's office
and gradually uncovers the subject's identity, skills, experience, work,
and credentials. "404" is a narrative metaphor — identity not found — not
a hacker/cyberpunk/glitch aesthetic.

## 2. Story plan (core project decision)

CASE 404 is an investigation through a **physical detective office**, not
a portfolio where every project lives on one computer. Different kinds of
work get different physical presentation, and the camera reveals new
evidence areas as the visitor scrolls deeper into the office. The opening
frame does not need to show every future area. Visual language: physical,
tactile, cinematic, late-night, restrained — not neon, horror, or SaaS.

### Narrative flow

`MYSTERY → EVIDENCE → IDENTITY → BACKGROUND → DIGITAL WORK →
PHYSICAL/CREATIVE WORK → VERIFIED CREDENTIALS → CONTACT → CASE CLOSED`

| #   | Chapter (`ChapterId`)                              | Zone                |
| --- | -------------------------------------------------- | ------------------- |
| 01  | Case Opened (`CASE_OPENED`)                        | Main Investigation  |
| 02  | Evidence Board (`EVIDENCE_BOARD`)                  | Main Investigation  |
| 03  | Subject Identity (`SUBJECT_PROFILE`)               | Main Investigation  |
| 04  | Education + Experience (`EDUCATION`, `EXPERIENCE`) | Main Investigation  |
| 05  | Digital Archive (`DIGITAL_ARCHIVE`)                | Digital Archive     |
| 06  | Creative Evidence (`CREATIVE_EVIDENCE`)            | Creative Evidence   |
| 07  | Credential Evidence (`CREDENTIALS`)                | Credential Evidence |
| 08  | Contact / Final File (`CONTACT`)                   | Main Investigation  |
| 09  | Case Solved (`CASE_SOLVED`)                        | Main Investigation  |

Source of truth in code: `src/story/chapters.ts` / `storyTypes.ts`.

### Office zones

One office, not separate pages. The camera **travels physically** between
zones (front view → board → desk/dossier → leaves the opening composition →
archive → creative evidence → credentials → contact → case solved). No
teleporting between unrelated scenes where travel can carry the transition.

- **Zone A — Main Investigation.** Desk, evidence board, dossier, working
  detective props. The desk is the _active investigation_, not a project
  showcase. Approved future desk inventory, and only this: primary
  dossier, a few papers, telephone, desk lamp, pens, cigarette. Never on
  the desk: project disks, merch, certificates, scattered evidence markers,
  posters, a computer.
- **Zone B — Digital Archive.** A 1970s data terminal (`computer-terminal.glb`,
  prepared with `scripts/prepare-terminal.mjs`; it replaced earlier IBM PCjr, flat-coloured
  PC and 90s PC models) with a slot drawn on its front panel, plus floppy disks, one per project. A second desk
  (same model as the main one) turned ~38° in the back-right corner, with an
  angled wall behind it (`ArchiveStation`, `RoomShell`). Separate workstation deeper in the office,
  **not** on the main desk. Holds **Development, UI/UX, Video Editing**
  only. Interaction concept: dark computer → disk/drive selected → boot →
  terminal → ACCESS GRANTED → archive (`> DEVELOPMENT  > UI / UX  > VIDEO
EDITING`) → project media, title, description, tools, link. Changing
  project/category may trigger loading / disk change / screen transition.
- **Zone C — Creative Evidence.** Work that reads better as physical
  evidence: **Graphic Design posters** as printed paper evidence (real
  poster images on paper surfaces — texture, bends, depth, shadow,
  overlap, evidence labels — never thumbnails on a monitor) and **Merch**
  (pins, T-shirts, hoodies, stickers) as physical objects or evidence
  photography; final representation decided after reviewing real project
  assets. Curated, few objects per camera state — not a storage room, not
  a grid.
- **Zone D — Credential Evidence.** Certificates as physical documents on
  a **user-provided 3D certificate-holder asset** (not yet supplied — do
  not source, substitute, or fake one). Possible later: step through
  certificates one at a time.

### Main Investigation details

- **Evidence board** (corkboard behind the desk) establishes the mystery of
  the unknown subject. Its baked generic content (city map, newspaper,
  documents, photos) is temporary and will be replaced/covered with CASE
  404 evidence: CASE 404, SUBJECT UNKNOWN, profile photo, discipline clues
  (Frontend Development, UI/UX Design, Graphic Design, Video Editing), red
  string, pins, notes, annotations, labels. Dedicated future phase.
- **Dossier** (`Dossier.tsx`, asset `document_file_folder.glb` — the only
  folder in the library that can open: its cover has a recorded open/close
  as 210 per-frame morph targets, scrubbed by blending adjacent frames).
  Left page = persistent identity, right page = ABOUT with the
  ABOUT/EDUCATION/EXPERIENCE tab row; both are CanvasTextures painted from
  `src/data/profile.ts`, revealed only after the cover opens. The cover's
  third-party label/emblem are painted out at load and the label plate
  becomes a CASE 404 case label. Story: About → Education → Experience as a physical
  folder/document (SUBJECT UNKNOWN → dossier discovered → identity
  revealed → about → education → experience). Never a website card.

## 3. Technology stack

React, TypeScript (strict), Vite · Three.js, @react-three/fiber,
@react-three/drei · GSAP + ScrollTrigger · Lenis · Zustand · CSS Modules

- CSS custom properties. No Next.js/Astro, no Tailwind/Bootstrap/MUI, no
  postprocessing packages. Dependencies are added only when a real
  requirement needs them (Ponytail FULL).

## 4. Responsibility boundaries

- **React** — portfolio content, navigation, loading, accessibility, UI.
- **R3F / Three.js** — the detective office and everything physically in
  it: desk, evidence board, lamp, computer, folders, papers, photos,
  props, background, lighting, camera.
- **GSAP + ScrollTrigger** — story progression, camera choreography,
  scene transitions, content reveals.
- **Lenis** — smooth scrolling, one instance, owned at the app level.
- **Zustand** — current chapter, active project/experience, reduced
  motion, experience-ready flag. Nothing high-frequency.

React does not micromanage frame-by-frame WebGL animation; R3F/Three.js
own scene objects and rendering; GSAP owns deterministic cinematic
transforms.

## 5. Directory architecture

```
src/
├── app/                  App shell + providers (Lenis)
├── components/
│   ├── common/           CanvasErrorBoundary, WebGLFallbackNotice
│   └── ui/                (empty — Phase 0)
├── experience/
│   ├── Experience.tsx    React ↔ R3F boundary
│   ├── canvas/           ExperienceCanvas (the one Canvas)
│   ├── camera/           cameraTypes, cameraAnchors, CameraRig
│   ├── environment/      DetectiveOffice, worldAnchors, environmentConfig
│   ├── lighting/         OfficeLighting
│   ├── models/            (empty — Phase 1+)
│   ├── surfaces/         dynamic-content-surface concept (README only)
│   └── effects/           (empty — no postprocessing yet)
├── story/                StoryController, chapters, storyTypes
├── data/                 profile/skills/education/experience/projects/
│                         certificates/contact — content, no 3D
├── assets/               assetManifest.ts (centralized asset config)
├── store/                useExperienceStore.ts
├── hooks/                 (empty — Phase 0)
├── lib/                  gsap.ts (plugin registration), three.ts (renderer config)
├── styles/               tokens.css, globals.css
└── types/                shared cross-cutting types
```

`assets-source/case-404/` (master GLBs, mirrors production categories) and
`public/models/case-404/` (approved runtime GLBs) sit outside `src/`.

## 6. Single persistent Canvas architecture

`ExperienceCanvas.tsx` renders the **only** `<Canvas>` in the app. The
camera moves through one physical environment (`DetectiveOffice`); there
are no per-section canvases (no `HeroCanvas`, `AboutCanvas`, etc.).

## 7. React responsibilities

App composition, routing between chapters conceptually (not literal
routes), accessible UI, content data, reduced-motion/WebGL-fallback
decisions. React state holds meaningful application state only.

## 8. R3F responsibilities

Declarative scene graph for the office: environment, furniture,
workstation, dossier, props, lighting, camera rig. Owns `useFrame` where
genuinely needed (nothing in Phase 0 needs it — the office is static).

## 9. Three.js responsibilities

Underlying renderer/scene/camera primitives that R3F wraps. Direct
Three.js use is for anything R3F/drei doesn't already express well
(e.g. future `CanvasTexture` work in `experience/surfaces/`).

## 10. GSAP / ScrollTrigger ownership

`src/lib/gsap.ts` registers `ScrollTrigger` exactly once via
`registerGsap()` (idempotent; called by the Lenis provider and
StoryController). No component registers plugins itself.

**Opening sequence (Phase 4A).** `StoryController.tsx` owns ONE GSAP
timeline scrubbed by ONE ScrollTrigger over an 800vh scroll stage; the R3F
canvas is `position: fixed` behind it. The timeline tweens only the plain
`storyRig` object (`src/story/storyRig.ts`: camera position/target,
`dossierOpen`, `profileReveal`); `CameraRig` and `Dossier` read it in
`useFrame`. Zustand only receives chapter changes (CASE_OPENED →
EVIDENCE_BOARD → SUBJECT_PROFILE). Everything derives from scroll progress,
so reverse scroll, scrubbing and mid-page refresh are stateless. Camera
waypoints live in `cameraAnchors.ts` (`roomOverview → boardApproach →
evidenceBoard → caseFile → leaveBoard → subjectProfile → dossierOpen`).
Reduced motion: no camera travel — the same scroll range jumps between
three states (room, case file, open dossier). `?story` (dev only) shows a
progress/chapter overlay.

## 11. Lenis ownership

`src/app/providers/LenisProvider.tsx` is the single owner: it creates one
`Lenis` instance on mount, drives it from GSAP's ticker (so one RAF loop
serves both), forwards its scroll events to `ScrollTrigger.update`, and
destroys it on unmount. No other file may instantiate
Lenis.

## 12. Zustand ownership

`useExperienceStore`: `currentChapter`, `activeExperienceId`,
`activeProjectId`, `activeProjectCategory`, `reducedMotion`,
`isExperienceReady`. Each is global because more than one subtree needs
to read it (UI chrome, story controller, future chapter content). No
per-frame values live here.

## 13. High-frequency animation strategy

Camera transforms, scroll progress, and per-object animation state must
use refs, GSAP, or direct Three.js/R3F transforms — never React state or
Zustand on every frame. This is a hard rule, not a style preference,
because it's the difference between a scroll experience that stays at
60fps and one that doesn't.

## 14. Source asset architecture

`assets-source/case-404/<category>/<subcategory>/` holds untouched
original downloads, mirrored by category (environment, furniture,
workstation, dossier, props, textures). Never edited, never loaded at
runtime. See `assets-source/case-404/README.md`.

## 15. Production asset architecture

`public/models/case-404/<category>/` holds only optimized, normalized,
approved runtime GLBs. Empty in Phase 0 — nothing has been approved yet.

## 16. Asset pipeline

`DOWNLOAD → SOURCE → AUDIT → OPTIMIZE → NORMALIZE → APPROVE → PRODUCTION
→ RUNTIME`. Full description in `assets-source/case-404/README.md`.
Audits are tracked in `ASSET_INVENTORY.md`, attribution in
`ASSET_CREDITS.md`.

## 17. Asset manifest

`src/assets/assetManifest.ts` defines `ManifestAsset` (id, url, category,
preloadPriority, transform, shadow flags, optional attribution) and an
empty `assetManifest` array. Scene code looks up assets by id here —
never hardcodes a `public/models/...` path inline.

## 18. Coordinate convention

Right-handed: `+X` right, `-X` left, `+Y` up, `-Y` down, `+Z` toward the
camera / out of the room (deeper into the office is increasingly negative
Z). Documented in `src/experience/environment/worldAnchors.ts`. Do not
change this convention without updating every anchor.

## 19. World anchors

`worldAnchors.ts` exports semantic anchors `mainDesk`, `evidenceBoard`,
`dossier`, `digitalArchive`, `creativeEvidence`, `credentials`, `contact`.
Only blocked-out zones have coordinates; the rest are `null` until a
visual blockout places them. Never fill them with guesses.

## 20. Camera anchors

`cameraTypes.ts` + `cameraAnchors.ts` define semantic camera states
(`roomOverview`, `caseOpened`, `evidenceBoard`, `subjectProfile`,
`education`, `experience`, `digitalArchive`, `creativeEvidence`,
`credentials`, `contact`, `caseSolved`). Only `roomOverview` is real (the
approved Phase 1B.1 frontal opening); the rest are placeholders.
`CameraRig.tsx` applies `roomOverview` on mount — travel between anchors
is the scroll-choreography phase.

## 21. Story / chapter architecture

`story/storyTypes.ts` defines `ChapterId` (10 chapters: `CASE_OPENED` →
`CASE_SOLVED`, see §2), `OfficeZone`, and `Chapter` (id, label, order,
zone, cameraAnchor).
`story/chapters.ts` lists them in order. `StoryController.tsx` currently
only flips `isExperienceReady`; it will own scroll progression, chapter
activation, and content reveals once ScrollTrigger timelines exist.

## 22. Dynamic content surfaces

`src/experience/surfaces/README.md` documents the concept: downloaded
models provide geometry, surfaces provide application-controlled content
on top of it. First implementation: the CASE 404 evidence board — the
board's colour atlas is repainted at load into each paper's existing UV
island (`paintCaseBoard.ts`, content in `src/data/evidenceBoard.ts`), so
geometry, pins, strings and draw calls are unchanged. The subject's name
never appears on the board.

## 23. Office geography

Built so far: Zone A's opening composition only — frontal view of the
investigation board above the antique desk, one dossier, and the room
(`RoomShell.tsx`): a back wall of 7 repeated plaster modules (GLB), a 12m
wood-plank floor (plank GLB material, tiled), and temporary primitive side
walls + ceiling. No window, no cabinet. Architecture derivatives are built
by `scripts/derive-architecture.mjs`. Zones B–D sit deeper in the office and are not built;
the opening shot does not reserve empty space for them — the camera
travels there later (§2).

## 24. Lighting philosophy

Phase 5: the **desk lamp is the dominant, visible source**.
`DeskLampLight.tsx` is a warm spotlight parented to the lamp prop at its
measured bulb (just below it — the bulb is closed geometry and would
shadow a light placed inside it), aimed down across the desk. It is the
desk's shadow caster; its shadow camera is bounded to the desk's reach
(`far` 1.6 m), which measured as the difference between 60 and 30 fps.

`OfficeLighting.tsx` only supports it: a dim, broad wash from above that
keeps the board readable (a desk-height lamp cannot light a board hung
above and behind it without looking staged), kept as a shadow caster
because the board's pinned papers need their contact shadows; a low
neutral-cool hemisphere so shadows stay dark grey; `ContactShadows`
rendered once for the desk's feet. Two shadow casters total. Spotlight
targets must be in the scene graph — setting `target-position` alone
leaves the target at the origin. Later: localized green/blue phosphor for
the Digital Archive.

## 25. Loading strategy

`assetManifest.ts`'s `preloadPriority` (1–5) is the foundation for future
prioritized loading: office essentials first, then evidence board,
dossier, workstation, background/decoration last. Not implemented beyond
the type — no assets exist yet to prioritize.

## 26. Performance strategy

One Canvas. No per-frame React/Zustand writes. DPR capped
(`DPR_RANGE = [1, 1.5]` in `lib/three.ts`) instead of raw
`devicePixelRatio`. Static props stay static (no speculative
`useFrame`). GLTF caching, instancing, and shadow/texture budgets are
documented as Phase 1+ concerns (see the Phase 0 brief sections on
light/shadow and texture performance) — nothing to tune yet with zero
real assets loaded.

## 27. Responsive strategy

Architecture anticipates desktop (full experience), tablet (reduced
secondary props/effects, adjusted camera), and mobile (recomposed, not
just shrunk) tiers. No final per-device camera coordinates yet — that
follows real geometry.

## 28. Reduced-motion strategy

`globals.css` has a `prefers-reduced-motion: reduce` block that collapses
animation/transition durations. `useExperienceStore.reducedMotion` is the
hook point for StoryController/CameraRig to skip cinematic travel later
while keeping content and navigation fully functional.

## 29. Accessibility

Portfolio content must stay reachable without WebGL. Semantic HTML,
keyboard-accessible controls, sufficient contrast, and the
reduced-motion path are architectural requirements, not nice-to-haves —
the detective framing never gets to block access to the underlying
information.

## 30. WebGL fallback strategy

`CanvasErrorBoundary` wraps `ExperienceCanvas`; on failure it renders
`WebGLFallbackNotice`, a minimal accessible notice. A full non-WebGL
portfolio presentation is future work, but the application is already
structured so content isn't trapped exclusively inside the Canvas tree.

## 31. Git / large-file policy

`assets-source/**/*.glb` (and `.gltf`/`.fbx`/`.blend`/`.bin`) are
git-ignored — originals can be tens of MB each and are not committed.
Directory structure and docs (`.gitkeep`, README, inventory, credits)
stay tracked. `public/models/case-404/` production assets ARE committed
(required for deployment). Git LFS is intentionally not configured; it's
only worth adopting if production asset weight actually demands it later.

## 32. Development roadmap

- **Phase 0** — foundation/scaffolding (this document's state).
- **Phase 1** — asset audit + static detective-office blockout (desk →
  evidence board → lamp → window → background furniture → a few props),
  reviewed for scale/orientation/materials/composition/lighting/
  performance before any scroll choreography.
- **Phase 2** — materials + atmosphere + cinematic lighting.
  2A = opening lighting/shadows, 2B = surfacing/materials.
- **Phase 3** — evidence board / CASE 404 content.
- **Phase 4** — scroll choreography + cinematic camera travel.
- **Phase 5** — dossier / About / Education / Experience.
- **Phase 6** — Digital Archive (data terminal and floppy disks; Development, UI/UX, Video).
- **Phase 7** — Creative Evidence (posters, merch) + Credential Evidence
  (needs user's certificate-holder asset) + contact.
- **Phase 8** — case solved.
- **Phase 9** — responsive + accessibility + performance polish.
