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

## 2. Creative/narrative concept

Narrative arc: Mystery → Evidence → Identity → Experience → Work →
Credentials → Contact → Case Solved. Visual language: physical, tactile,
cinematic, late-night, restrained — not neon, not horror, not generic
SaaS. Portfolio concepts map to physical objects (About → dossier, Skills
→ evidence notes, Projects → digital archive/CRT, etc.). See the original
Phase 0 brief for full creative direction, palette, and chapter sequence;
this file stays focused on the technical structure that supports it.

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
`registerGsap()`, called from `App.tsx`. No component registers plugins
itself. Timelines/choreography are Phase 4 work.

## 11. Lenis ownership

`src/app/providers/LenisProvider.tsx` is the single owner: it creates one
`Lenis` instance on mount, drives it from GSAP's ticker (so one RAF loop
serves both), and destroys it on unmount. No other file may instantiate
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

`worldAnchors.ts` exports placeholder `Vector3Tuple` positions for `room`,
`desk`, `evidenceBoard`, `dossier`, `workstation`, `credentials`,
`contact`, `lamp`, `window`, `background`. These are semantic placeholders
— final coordinates are set after the real GLBs are audited (Phase 1).

## 20. Camera anchors

`cameraTypes.ts` + `cameraAnchors.ts` define semantic camera states
(`roomOverview`, `caseOpened`, `evidenceBoard`, `subjectProfile`,
`education`, `experience`, `workstation`, `credentials`, `contact`,
`caseSolved`), each with a placeholder position/target/fov. `CameraRig.tsx`
currently just applies `roomOverview` on mount — cinematic travel between
anchors is Phase 4.

## 21. Story / chapter architecture

`story/storyTypes.ts` defines `ChapterId` (9 chapters: `CASE_OPENED` →
`CASE_SOLVED`) and `Chapter` (id, label, order, cameraAnchor).
`story/chapters.ts` lists them in order. `StoryController.tsx` currently
only flips `isExperienceReady`; it will own scroll progression, chapter
activation, and content reveals once ScrollTrigger timelines exist.

## 22. Dynamic content surfaces

`src/experience/surfaces/README.md` documents the concept: downloaded
models provide geometry, surfaces provide application-controlled content
on top of it (`PaperSurface`, `PhotoSurface`, `DossierPage`, `CRTScreen`,
etc.). Not implemented yet.

## 23. Office geography

Conceptual layout (center/back: evidence board; center/foreground: desk;
left: CRT workstation; right: dossier; background: window/storage;
edges: secondary props) is a creative-direction concern, not yet encoded
in actual geometry. `worldAnchors.ts` placeholders are a rough
approximation only.

## 24. Lighting philosophy

Phase 0 lighting (`OfficeLighting.tsx`) is a flat ambient + directional
pair, enough to verify the scene renders. Future strategy: warm tungsten
practical (desk lamp) as primary, restrained cool exterior/window as
secondary, localized green/blue phosphor for the CRT/archive chapter,
and a very restrained ambient fill. Prefer deep shadows over uniform
illumination; avoid many realtime shadow casters.

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
- **Phase 3** — evidence board / CASE 404 content.
- **Phase 4** — scroll choreography + cinematic camera.
- **Phase 5** — dossier / About / Education / Experience.
- **Phase 6** — CRT project archive.
- **Phase 7** — credentials + contact.
- **Phase 8** — case solved.
- **Phase 9** — responsive + accessibility + performance polish.
