# Graph Report - CASE-404  (2026-11-08)

## Corpus Check
- 166 files · ~4,228,561 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 73 file(s) not represented in the graph (top: .glb 38, (none) 23, .css 10)

## Summary
- 1167 nodes · 2484 edges · 77 communities (66 shown, 11 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1dc504c2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DeskProps.tsx
- paintCaseBoard.ts
- paintDossierPages.ts
- loadProgress.ts
- diskRackLayout.ts
- ArchiveStation.tsx
- PersonalComputer.tsx
- computerAudio.ts
- CASE 404 — Architecture
- DesignPosters.tsx
- paintResume.ts
- AchievementShelf.tsx
- paintArchive.ts
- package.json
- split-lamp-chain.mjs
- DetectiveOffice.tsx
- useExperienceStore
- compilerOptions
- RoomShell.tsx
- useExperienceStore.ts
- nigelFile.ts
- devDependencies
- @gltf-transform/core
- MoonWindow.tsx
- FileCabinets.tsx
- compilerOptions
- projects.ts
- nigelChat.ts
- paintNigel.ts
- Dossier.tsx
- storyNav.ts
- DossierRecords.tsx
- TypewriterStation.tsx
- assetManifest.ts
- compilerOptions
- ASSET_INVENTORY.md
- CASE 404 — Handoff notes
- scripts
- ResumePrint.tsx
- focus.ts
- index.ts
- StoryController.tsx
- dependencies
- ref_node_fs
- measure-glb.mjs
- prepare-posters.mjs
- IBM PCjr 4863 Computer — External Sketchfab Embed
- ExperienceCanvas.tsx
- audit-glb.mjs
- cursorStore.ts
- paintDossierCover.ts
- DossierEvidence.tsx
- MusketDisplay.tsx
- board-islands.mjs
- perf-budget.mjs
- prepare-window-2.mjs
- N.I.G.E.L. Worker
- CASE 404 — Asset Credits
- CASE 404 — Source Assets
- .prettierrc.json
- CLAUDE.md
- DossierTabs.tsx
- externalAssets.ts
- skills.ts
- Dynamic Content Surfaces
- tsconfig.json
- CREDITS.md
- images/README.md
- nctvwork/README.md
- README.md
- environmentConfig.ts
- react
- Development Tooling
- CASE 404: Session notes, 2026-10-12
- derive-desk-props.mjs
- CASE 404 — Session notes, 2026-10-11
- perf-guardian.md

## God Nodes (most connected - your core abstractions)
1. `react` - 57 edges
2. `three` - 48 edges
3. `ArchiveStation()` - 47 edges
4. `useExperienceStore` - 35 edges
5. `CASE 404 — Architecture` - 33 edges
6. `@react-three/fiber` - 28 edges
7. `@react-three/drei` - 27 edges
8. `assetManifest` - 23 edges
9. `CASE 404: Session notes, 2026-10-14 to 15` - 20 edges
10. `compilerOptions` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Loader` --references--> `SceneNav()`  [INFERRED]
  docs/SESSION-2026-10-12.md → src/experience/SceneNav.tsx
- `6. Single persistent Canvas architecture` --references--> `DetectiveOffice()`  [INFERRED]
  ARCHITECTURE.md → src/experience/environment/DetectiveOffice.tsx
- `Mist` --references--> `OfficeLighting()`  [INFERRED]
  docs/SESSION-2026-10-15.md → src/experience/lighting/OfficeLighting.tsx
- `Narrative flow` --references--> `ChapterId`  [INFERRED]
  ARCHITECTURE.md → src/story/storyTypes.ts
- `Model Inspector (dev only)` --references--> `fetch()`  [INFERRED]
  DEVELOPMENT.md → worker/nigel/src/index.ts

## Import Cycles
- None detected.

## Communities (77 total, 11 thin omitted)

### Community 0 - "DeskProps.tsx"
Cohesion: 0.24
Nodes (13): ContactShadow(), Bulb, BULLETS, DESK_PROPS, DeskProp(), DeskProps(), MagnumBullets(), RevolverShadow() (+5 more)

### Community 1 - "paintCaseBoard.ts"
Cohesion: 0.05
Nodes (73): Evidence board (`src/data/evidenceBoard.ts`, `surfaces/paintCaseBoard.ts`, `EvidenceBoard.tsx`), Evidence board, Terminal power, lamps, board web, smoke, editorCode, printoutCode, terminalLines, BoardPhotoId, boardPhotos (+65 more)

### Community 2 - "paintDossierPages.ts"
Cohesion: 0.18
Nodes (26): bullet(), Ctx, dotted(), drawPortraitSlot(), endMark(), headingWithDate(), jobDetails(), pad() (+18 more)

### Community 3 - "loadProgress.ts"
Cohesion: 0.06
Nodes (40): react-dom, CatalogEntry, InspectedModel(), ModelInspectorApp(), build(), burst(), buzz(), crackleBuffer() (+32 more)

### Community 4 - "diskRackLayout.ts"
Cohesion: 0.08
Nodes (40): Disk 4: OJT Tracker (and a fourth rack tier), Axis, box(), DiskRack(), paintTags(), profile(), useRackWood(), woodUVs() (+32 more)

### Community 5 - "ArchiveStation.tsx"
Cohesion: 0.08
Nodes (37): Archive desk (computer), Archive terminal: disk sounds and eject transition, ArchiveStation(), copyOf(), crtTransition, FLAT, insertPhase, LAMP_AIM (+29 more)

### Community 6 - "PersonalComputer.tsx"
Cohesion: 0.28
Nodes (7): ComputerPlacement, PC_MODEL, placeComputer(), PersonalComputer(), Props, styleComputer(), styled

### Community 7 - "computerAudio.ts"
Cohesion: 0.24
Nodes (17): click(), computerAudio, Engine, engineNow(), envelope(), fan(), get(), hiss() (+9 more)

### Community 8 - "CASE 404 — Architecture"
Cohesion: 0.05
Nodes (39): 11. Lenis ownership, 12. Zustand ownership, 13. High-frequency animation strategy, 14. Source asset architecture, 15. Production asset architecture, 16. Asset pipeline, 17. Asset manifest, 18. Coordinate convention (+31 more)

### Community 9 - "DesignPosters.tsx"
Cohesion: 0.05
Nodes (52): CASE 404: Session notes, 2026-10-14 to 15, Design evidence wall (computer side), Disk 2: NTV360 Dev Portal, Disk 3: Component Pantry, Lighting (committed in 8f610eb), Loader, Mist, Music on page load (+44 more)

### Community 10 - "paintResume.ts"
Cohesion: 0.19
Nodes (13): contact, ContactInfo, experienceEntries, ExperienceEntry, contactLine(), Ctx, degrees(), paint() (+5 more)

### Community 11 - "AchievementShelf.tsx"
Cohesion: 0.12
Nodes (20): frontOf(), AchievementShelf(), Diploma(), FRAMES, PANEL, SHEET, BRASS, CRADLES (+12 more)

### Community 12 - "paintArchive.ts"
Cohesion: 0.10
Nodes (42): Disk 1: CASE 404, Open items, bodyType(), BOOT_LINES, breakWord(), bullets(), buttonsShown, cache (+34 more)

### Community 13 - "package.json"
Cohesion: 0.11
Nodes (19): name, private, type, version, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks (+11 more)

### Community 14 - "split-lamp-chain.mjs"
Cohesion: 0.09
Nodes (18): beadIdx, CHAIN, chainMesh, chainNode, chainPrim, idx, [input = "public/models/case-404/props/desk-lamp.glb", output = input], io (+10 more)

### Community 15 - "DetectiveOffice.tsx"
Cohesion: 0.16
Nodes (22): @react-three/fiber, Carpet(), DetectiveOffice(), LampPoint(), LampSpot(), PointProps, Props, AIM (+14 more)

### Community 16 - "useExperienceStore"
Cohesion: 0.20
Nodes (8): archiveProjects, ArchivePicker(), GROUPS, ExperienceCanvas(), Experience(), PosterFlipControl(), ScreenFocusControls(), useExperienceStore

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 18 - "RoomShell.tsx"
Cohesion: 0.24
Nodes (14): Lighting and room, plasterUVs(), BoardFloor(), CornerFillets(), cornerPlane(), CornerWall(), fillet(), RightWall() (+6 more)

### Community 19 - "useExperienceStore.ts"
Cohesion: 0.16
Nodes (16): 21. Story / chapter architecture, CameraAnchorId, LampStory(), orderOf(), TURN, DRIFT, FOG, Mist() (+8 more)

### Community 20 - "nigelFile.ts"
Cohesion: 0.18
Nodes (13): education, EducationEntry, fullName, GENERIC, isReal(), NIGEL_GREETING, nigelCaseFile(), nigelOffline() (+5 more)

### Community 21 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @gltf-transform/core (+11 more)

### Community 22 - "@gltf-transform/core"
Cohesion: 0.17
Nodes (13): @gltf-transform/core, @gltf-transform/extensions, @gltf-transform/functions, io, io, [max, ...files], [input, output, maxTexture = "1024", ratio = "0.3"], io (+5 more)

### Community 23 - "MoonWindow.tsx"
Cohesion: 0.15
Nodes (18): assetManifest, BAR_X, BOUNCE, EXT, EXT_AIM, extensionPicture(), MOON_AIM, MOON_AT (+10 more)

### Community 24 - "FileCabinets.tsx"
Cohesion: 0.36
Nodes (7): BODY, CABINETS, DRAWER_TOPS, FileCabinet(), FileCabinets(), paintLabel(), useCabinetParts()

### Community 25 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 26 - "projects.ts"
Cohesion: 0.22
Nodes (8): Project, ProjectCategory, projectClips(), projects, Props, cache, loadProjectImages(), projectImages

### Community 27 - "nigelChat.ts"
Cohesion: 0.28
Nodes (12): askLine(), ENDPOINT, history(), MAX_INPUT, nigel, nigelReset(), nigelSkip(), nigelStep() (+4 more)

### Community 28 - "paintNigel.ts"
Cohesion: 0.22
Nodes (14): ChatLine, SCREEN_H, SCREEN_W, Ctx, drawFace(), face(), faces, glow() (+6 more)

### Community 29 - "Dossier.tsx"
Cohesion: 0.16
Nodes (21): The incident you exist to prevent, Dossier: a stack of sheets with index tabs, attachFolder(), brandCover(), canvases, coverArtwork(), Dossier(), hideLogos() (+13 more)

### Community 30 - "storyNav.ts"
Cohesion: 0.20
Nodes (12): lenis, Props, ICONS, SceneNav(), checkpointProgress(), CHECKPOINTS, goToCheckpoint(), registry (+4 more)

### Community 31 - "DossierRecords.tsx"
Cohesion: 0.20
Nodes (8): Certificate, certificates, DossierPageId, dossierPages, sheets, dossierTabs, profile, profileSkills

### Community 32 - "TypewriterStation.tsx"
Cohesion: 0.14
Nodes (17): Gramophone(), MedievalPaintings(), Painting(), PAINTINGS, useAgedMaterial(), GRAMOPHONE_AT, LAMP_AIM, LAMP_AT (+9 more)

### Community 33 - "assetManifest.ts"
Cohesion: 0.22
Nodes (8): AssetCategory, AssetId, PreloadPriority, CameraAnchor, DustMotes(), Props, Props, Vector3Tuple

### Community 34 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowImportingTsExtensions, lib, module, moduleResolution, noEmit, skipLibCheck, strict (+3 more)

### Community 35 - "ASSET_INVENTORY.md"
Cohesion: 0.18
Nodes (10): Board swap (post Phase 2A), CASE 404 — Asset Inventory, Desk additions (floor, noob, magnifying glass), Not individually visually inspected this pass, Phase 1B — Runtime Promotion, Phase 2B.0 — Investigation board structure audit, Phase 2B — Room architecture (wall + floor), Phase 4A — Dossier swap (+2 more)

### Community 36 - "CASE 404 — Handoff notes"
Cohesion: 0.18
Nodes (10): Assets (all in `ASSET_INVENTORY.md` / `ASSET_CREDITS.md`), CASE 404 — Handoff notes, Desk props (`DeskProps.tsx`, `assetManifest.ts`), Dossier (`DossierEvidence.tsx`, `surfaces/paintDossierPhotos.ts`), New scripts (`scripts/`), On hold, Open items / ideas, Room / lighting (+2 more)

### Community 37 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, build, dev, format, format:check, lint, perf:check, prebuild (+3 more)

### Community 38 - "ResumePrint.tsx"
Cohesion: 0.25
Nodes (10): pageTexture(), PLATEN, ResumePrint(), downloadResume(), DownloadButton(), ResumeOverlay(), useResume, paintResume() (+2 more)

### Community 39 - "focus.ts"
Cohesion: 0.23
Nodes (11): 10. GSAP / ScrollTrigger ownership, Close-ups (shared), Archive wall (computer side), CameraRig(), box, focusFromFront(), focusOnFlat(), FocusOptions (+3 more)

### Community 40 - "index.ts"
Cohesion: 0.33
Nodes (9): NIGEL_PERSONA, ask(), cors(), Env, fetch(), json(), Message, newestFlash() (+1 more)

### Community 41 - "StoryController.tsx"
Cohesion: 0.26
Nodes (11): gsap, App(), LenisProvider(), registerGsap(), applyAnchor(), chapterAt(), chapterAtTime(), REDUCED (+3 more)

### Community 42 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, gsap, lenis, react, react-dom, @react-three/drei, @react-three/fiber, three (+1 more)

### Community 43 - "ref_node_fs"
Cohesion: 0.25
Nodes (6): country, [cx, cy], paths, project(), { glb, images }, sizes

### Community 44 - "measure-glb.mjs"
Cohesion: 0.22
Nodes (6): derivatives, io, DIR, findGlb(), io, ROOT

### Community 45 - "prepare-posters.mjs"
Cohesion: 0.25
Nodes (3): io, POSTERS, [srcDir, outDir]

### Community 46 - "IBM PCjr 4863 Computer — External Sketchfab Embed"
Cohesion: 0.29
Nodes (6): Customisation review, IBM PCjr 4863 Computer — External Sketchfab Embed, Known limitations (not solved in Phase 1A), Plan, Restrictions, Separate concerns

### Community 47 - "ExperienceCanvas.tsx"
Cohesion: 0.30
Nodes (6): zustand, cameraAnchors, DossierState, DEFAULT_CAMERA, DPR_RANGE, storyRig

### Community 48 - "audit-glb.mjs"
Cohesion: 0.43
Nodes (6): auditFile(), __dirname, findGlbFiles(), formatBytes(), main(), ROOT

### Community 49 - "cursorStore.ts"
Cohesion: 0.29
Nodes (6): CursorKind, CursorState, useCursor, CustomCursor(), finePointer(), ICONS

### Community 50 - "paintDossierCover.ts"
Cohesion: 0.32
Nodes (10): DossierCoverDesign(), caseLabel(), COVER_W, Ctx, header(), layer(), paintCover(), stamp() (+2 more)

### Community 51 - "DossierEvidence.tsx"
Cohesion: 0.30
Nodes (9): DossierEvidence(), monoAndGrain(), paintPolaroid(), PHOTOS, POLAROID, POLAROID_SIZE, PaperContactShadow(), createPaperBump() (+1 more)

### Community 52 - "MusketDisplay.tsx"
Cohesion: 0.22
Nodes (9): AT, BRASS, inspectable(), MusketDisplay(), PEGS, ROD, ROSE, TIP (+1 more)

### Community 53 - "board-islands.mjs"
Cohesion: 0.33
Nodes (3): body, io, islands

### Community 54 - "perf-budget.mjs"
Cohesion: 0.33
Nodes (5): BUDGET, fails, io, walk(), warn

### Community 55 - "prepare-window-2.mjs"
Cohesion: 0.33
Nodes (5): BROWN, CENTRE, [
  input = "assets-source/window-2.glb",
  output = "public/models/case-404/environment/window-2.glb",
], io, wrapper

### Community 56 - "N.I.G.E.L. Worker"
Cohesion: 0.40
Nodes (4): N.I.G.E.L. Worker, Notes, Set up (once), Settings (`wrangler.toml`)

### Community 57 - "CASE 404 — Asset Credits"
Cohesion: 0.50
Nodes (3): Archive shelf and back-wall paintings, CASE 404 — Asset Credits, Phase 5 promotions

### Community 58 - "CASE 404 — Source Assets"
Cohesion: 0.50
Nodes (3): CASE 404 — Source Assets, Pipeline, Source vs. production

### Community 59 - ".prettierrc.json"
Cohesion: 0.50
Nodes (3): printWidth, semi, trailingComma

### Community 61 - "DossierTabs.tsx"
Cohesion: 0.33
Nodes (8): hoverCursor(), dossierReadable(), useDossier, DossierTabs(), paintTab(), TAB, TAB_PLANES, WIDTH

### Community 71 - "react"
Cohesion: 0.24
Nodes (9): react, @react-three/drei, three, at, SPINNING, ownPrint(), PolaroidPhotos(), PRINTS (+1 more)

### Community 72 - "Development Tooling"
Cohesion: 0.25
Nodes (7): Addy Osmani Agent Skills, Development Tooling, GLB Audit Script, Graphify, Model Inspector (dev only), OmniRoute, Ponytail

### Community 73 - "CASE 404: Session notes, 2026-10-12"
Cohesion: 0.29
Nodes (6): Assets, CASE 404: Session notes, 2026-10-12, Loader, Merch corner, Open items, Paintings (parked)

### Community 75 - "CASE 404 — Session notes, 2026-10-11"
Cohesion: 0.33
Nodes (5): CASE 404 — Session notes, 2026-10-11, Cursor, Dossier, Fixes, Open items

### Community 76 - "perf-guardian.md"
Cohesion: 0.40
Nodes (4): Balance (the other half of the job), Procedure, Report format, Rules to enforce

## Knowledge Gaps
- **439 isolated node(s):** `printWidth`, `semi`, `trailingComma`, `name`, `private` (+434 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 489 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `DeskProps.tsx`, `paintCaseBoard.ts`, `loadProgress.ts`, `diskRackLayout.ts`, `ArchiveStation.tsx`, `PersonalComputer.tsx`, `CASE 404 — Architecture`, `DesignPosters.tsx`, `AchievementShelf.tsx`, `package.json`, `DetectiveOffice.tsx`, `useExperienceStore`, `RoomShell.tsx`, `useExperienceStore.ts`, `MoonWindow.tsx`, `FileCabinets.tsx`, `Dossier.tsx`, `storyNav.ts`, `DossierRecords.tsx`, `TypewriterStation.tsx`, `assetManifest.ts`, `ResumePrint.tsx`, `StoryController.tsx`, `ExperienceCanvas.tsx`, `cursorStore.ts`, `paintDossierCover.ts`, `DossierEvidence.tsx`, `MusketDisplay.tsx`, `DossierTabs.tsx`?**
  _High betweenness centrality (0.188) - this node is a cross-community bridge._
- **What connects `printWidth`, `semi`, `trailingComma` to the rest of the system?**
  _439 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `paintCaseBoard.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051061388410786 - nodes in this community are weakly interconnected._
- **Why does `three` connect `react` to `DeskProps.tsx`, `paintCaseBoard.ts`, `loadProgress.ts`, `diskRackLayout.ts`, `ArchiveStation.tsx`, `PersonalComputer.tsx`, `DesignPosters.tsx`, `AchievementShelf.tsx`, `package.json`, `DetectiveOffice.tsx`, `RoomShell.tsx`, `useExperienceStore.ts`, `MoonWindow.tsx`, `FileCabinets.tsx`, `Dossier.tsx`, `TypewriterStation.tsx`, `assetManifest.ts`, `ResumePrint.tsx`, `focus.ts`, `StoryController.tsx`, `ExperienceCanvas.tsx`, `paintDossierCover.ts`, `DossierEvidence.tsx`, `MusketDisplay.tsx`, `DossierTabs.tsx`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Should `loadProgress.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055904961565338925 - nodes in this community are weakly interconnected._
- **Why does `@react-three/fiber` connect `DetectiveOffice.tsx` to `DeskProps.tsx`, `paintCaseBoard.ts`, `assetManifest.ts`, `loadProgress.ts`, `ArchiveStation.tsx`, `PersonalComputer.tsx`, `focus.ts`, `react`, `DesignPosters.tsx`, `ResumePrint.tsx`, `AchievementShelf.tsx`, `package.json`, `ExperienceCanvas.tsx`, `DossierEvidence.tsx`, `useExperienceStore.ts`, `MoonWindow.tsx`, `Dossier.tsx`, `DossierRecords.tsx`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Should `diskRackLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08084163898117387 - nodes in this community are weakly interconnected._