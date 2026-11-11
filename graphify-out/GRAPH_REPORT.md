# Graph Report - CASE-404  (2026-11-10)

## Corpus Check
- 170 files · ~4,230,475 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 74 file(s) not represented in the graph (top: .glb 38, (none) 23, .css 11)

## Summary
- 1191 nodes · 2561 edges · 80 communities (68 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a49172a9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Site.tsx
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
- ShipDisplay.tsx
- paintArchive.ts
- package.json
- split-lamp-chain.mjs
- WallSconces.tsx
- react
- compilerOptions
- RoomShell.tsx
- useExperienceStore.ts
- nigelFile.ts
- devDependencies
- @gltf-transform/core
- MoonWindow.tsx
- DetectiveOffice.tsx
- compilerOptions
- projectImages.ts
- nigelChat.ts
- paintNigel.ts
- Dossier.tsx
- storyNav.ts
- certificates.ts
- DeskProps.tsx
- @react-three/fiber
- compilerOptions
- ASSET_INVENTORY.md
- CASE 404 — Handoff notes
- scripts
- ResumeOverlay.tsx
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
- ResumePrint.tsx
- CASE 404: Session notes, 2026-10-14 to 15
- Mist.tsx
- MusketDisplay.tsx
- board-islands.mjs
- perf-budget.mjs
- prepare-window-2.mjs
- N.I.G.E.L. Worker
- CASE 404 — Asset Credits
- CASE 404 — Source Assets
- .prettierrc.json
- CLAUDE.md
- FloppyDisk.tsx
- externalAssets.ts
- skills.ts
- Dynamic Content Surfaces
- tsconfig.json
- CREDITS.md
- images/README.md
- nctvwork/README.md
- README.md
- environmentConfig.ts
- three
- Development Tooling
- CASE 404: Session notes, 2026-10-12
- ExperienceCanvas
- CASE 404 — Session notes, 2026-10-11
- AchievementShelf.tsx
- projects.ts
- PolaroidPhotos.tsx
- ref_node_url

## God Nodes (most connected - your core abstractions)
1. `react` - 60 edges
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
- `Video disks, sound and the lag fixes` --references--> `shadowsChanged()`  [INFERRED]
  docs/SESSION-2026-10-15.md → src/experience/canvas/shadowUpdates.ts
- `6. Single persistent Canvas architecture` --references--> `DetectiveOffice()`  [INFERRED]
  ARCHITECTURE.md → src/experience/environment/DetectiveOffice.tsx
- `Narrative flow` --references--> `ChapterId`  [INFERRED]
  ARCHITECTURE.md → src/story/storyTypes.ts
- `Model Inspector (dev only)` --references--> `fetch()`  [INFERRED]
  DEVELOPMENT.md → worker/nigel/src/index.ts

## Import Cycles
- None detected.

## Communities (80 total, 12 thin omitted)

### Community 0 - "Site.tsx"
Cohesion: 0.20
Nodes (18): designWorkUrl(), cover(), Contact(), Cover(), degrees, DesignArchive(), EvidenceBoard(), fullName (+10 more)

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
Nodes (39): Disk 4: OJT Tracker (and a fourth rack tier), Axis, box(), DiskRack(), paintTags(), profile(), useRackWood(), woodUVs() (+31 more)

### Community 5 - "ArchiveStation.tsx"
Cohesion: 0.08
Nodes (33): Archive desk (computer), Archive terminal: disk sounds and eject transition, ArchiveStation(), copyOf(), crtTransition, FLAT, insertPhase, LAMP_AIM (+25 more)

### Community 6 - "PersonalComputer.tsx"
Cohesion: 0.28
Nodes (7): ComputerPlacement, PC_MODEL, placeComputer(), PersonalComputer(), Props, styleComputer(), styled

### Community 7 - "computerAudio.ts"
Cohesion: 0.26
Nodes (16): click(), computerAudio, Engine, engineNow(), envelope(), fan(), get(), hiss() (+8 more)

### Community 8 - "CASE 404 — Architecture"
Cohesion: 0.06
Nodes (32): 11. Lenis ownership, 12. Zustand ownership, 13. High-frequency animation strategy, 14. Source asset architecture, 15. Production asset architecture, 16. Asset pipeline, 18. Coordinate convention, 19. World anchors (+24 more)

### Community 9 - "DesignPosters.tsx"
Cohesion: 0.10
Nodes (29): DesignPiece, designWork, ShadowDriver(), shadows, shadowsChanged(), shadowsDue(), DesignInspectState, useDesignInspect (+21 more)

### Community 10 - "paintResume.ts"
Cohesion: 0.21
Nodes (12): contact, ContactInfo, experienceEntries, ExperienceEntry, contactLine(), Ctx, degrees(), paint() (+4 more)

### Community 11 - "ShipDisplay.tsx"
Cohesion: 0.17
Nodes (12): BRASS, CRADLES, paintPlate(), PLINTH, PLINTH_GEO, POST_GEO, RING, RING_GEO (+4 more)

### Community 12 - "paintArchive.ts"
Cohesion: 0.09
Nodes (46): Disk 1: CASE 404, Open items, projectClips(), paintOnScreen(), repaintScreen(), bodyType(), BOOT_LINES, breakWord() (+38 more)

### Community 13 - "package.json"
Cohesion: 0.13
Nodes (18): name, private, type, version, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks (+10 more)

### Community 14 - "split-lamp-chain.mjs"
Cohesion: 0.09
Nodes (18): beadIdx, CHAIN, chainMesh, chainNode, chainPrim, idx, [input = "public/models/case-404/props/desk-lamp.glb", output = input], io (+10 more)

### Community 15 - "WallSconces.tsx"
Cohesion: 0.23
Nodes (15): LampPoint(), LampSpot(), PointProps, Props, DOWN, GLOW_LIGHT, SCONCES, WallSconces() (+7 more)

### Community 16 - "react"
Cohesion: 0.23
Nodes (6): react, ArchivePicker(), GROUPS, PosterFlipControl(), ScreenFocusControls(), useExperienceStore

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 18 - "RoomShell.tsx"
Cohesion: 0.24
Nodes (14): Lighting and room, plasterUVs(), usePlaster(), BoardFloor(), CornerFillets(), cornerPlane(), CornerWall(), fillet() (+6 more)

### Community 19 - "useExperienceStore.ts"
Cohesion: 0.28
Nodes (8): 21. Story / chapter architecture, zustand, TURN, ExperienceState, chapters, Chapter, ChapterId, OfficeZone

### Community 20 - "nigelFile.ts"
Cohesion: 0.15
Nodes (15): education, EducationEntry, fullName, GENERIC, isReal(), NIGEL_GREETING, NIGEL_PERSONA, nigelCaseFile() (+7 more)

### Community 21 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @gltf-transform/core (+11 more)

### Community 22 - "@gltf-transform/core"
Cohesion: 0.13
Nodes (14): @gltf-transform/core, @gltf-transform/extensions, @gltf-transform/functions, io, io, [max, ...files], io, [input, output, maxTexture = "1024", ratio = "0.3"] (+6 more)

### Community 23 - "MoonWindow.tsx"
Cohesion: 0.16
Nodes (15): BAR_X, BOUNCE, EXT, EXT_AIM, extensionPicture(), MOON_AIM, MOON_AT, MoonExtension() (+7 more)

### Community 24 - "DetectiveOffice.tsx"
Cohesion: 0.21
Nodes (15): Carpet(), DeskProps(), DetectiveOffice(), BODY, CABINETS, DRAWER_TOPS, FileCabinet(), FileCabinets() (+7 more)

### Community 25 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 26 - "projectImages.ts"
Cohesion: 0.40
Nodes (5): cache, loadedCount(), loadedImage(), loadProjectImages(), projectImages

### Community 27 - "nigelChat.ts"
Cohesion: 0.28
Nodes (12): askLine(), ENDPOINT, history(), MAX_INPUT, nigel, nigelReset(), nigelSkip(), nigelStep() (+4 more)

### Community 28 - "paintNigel.ts"
Cohesion: 0.22
Nodes (14): ChatLine, SCREEN_H, SCREEN_W, Ctx, drawFace(), face(), faces, glow() (+6 more)

### Community 29 - "Dossier.tsx"
Cohesion: 0.06
Nodes (56): Balance (the other half of the job), Procedure, Report format, Rules to enforce, The incident you exist to prevent, Dossier: a stack of sheets with index tabs, DossierPageId, dossierPages (+48 more)

### Community 30 - "storyNav.ts"
Cohesion: 0.20
Nodes (12): lenis, Props, ICONS, SceneNav(), checkpointProgress(), CHECKPOINTS, goToCheckpoint(), registry (+4 more)

### Community 32 - "DeskProps.tsx"
Cohesion: 0.13
Nodes (20): ContactShadow(), Bulb, BULLETS, DESK_PROPS, DeskProp(), MagnumBullets(), RevolverShadow(), setBulbGlow() (+12 more)

### Community 33 - "@react-three/fiber"
Cohesion: 0.18
Nodes (11): 17. Asset manifest, @react-three/fiber, ManifestAsset, DeskSmoke(), smoothstep(), AIM, AT, DustMotes() (+3 more)

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

### Community 38 - "ResumeOverlay.tsx"
Cohesion: 0.27
Nodes (9): dossierTabs, profile, downloadResume(), DownloadButton(), ResumeOverlay(), useResume, paintResume(), A4 (+1 more)

### Community 39 - "focus.ts"
Cohesion: 0.23
Nodes (11): 10. GSAP / ScrollTrigger ownership, Close-ups (shared), Archive wall (computer side), CameraRig(), box, focusFromFront(), focusOnFlat(), FocusOptions (+3 more)

### Community 40 - "index.ts"
Cohesion: 0.39
Nodes (8): ask(), cors(), Env, fetch(), json(), Message, newestFlash(), parse()

### Community 41 - "StoryController.tsx"
Cohesion: 0.27
Nodes (11): App(), LenisProvider(), Experience(), registerGsap(), applyAnchor(), chapterAt(), chapterAtTime(), REDUCED (+3 more)

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
Cohesion: 0.42
Nodes (5): cameraAnchors, CameraAnchor, CameraAnchorId, DEFAULT_CAMERA, DPR_RANGE

### Community 48 - "audit-glb.mjs"
Cohesion: 0.43
Nodes (6): auditFile(), __dirname, findGlbFiles(), formatBytes(), main(), ROOT

### Community 49 - "ResumePrint.tsx"
Cohesion: 0.17
Nodes (11): typewriterAudio, CursorKind, CursorState, useCursor, CustomCursor(), finePointer(), ICONS, pageTexture() (+3 more)

### Community 50 - "CASE 404: Session notes, 2026-10-14 to 15"
Cohesion: 0.14
Nodes (13): CASE 404: Session notes, 2026-10-14 to 15, Design evidence wall (computer side), Disk 2: NTV360 Dev Portal, Disk 3: Component Pantry, Lighting (committed in 8f610eb), Loader, Music on page load, Musket display (+5 more)

### Community 51 - "Mist.tsx"
Cohesion: 0.25
Nodes (9): Mist, LampStory(), orderOf(), DRIFT, FOG, Mist(), paintMist(), WISPS (+1 more)

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

### Community 61 - "FloppyDisk.tsx"
Cohesion: 0.24
Nodes (10): Project, DiskPose, FloppyDisk(), INSERT_SECONDS, LABEL, Props, smooth(), LABEL_H (+2 more)

### Community 71 - "three"
Cohesion: 0.17
Nodes (16): @react-three/drei, three, AssetCategory, AssetId, assetManifest, PreloadPriority, at, Gramophone() (+8 more)

### Community 72 - "Development Tooling"
Cohesion: 0.25
Nodes (7): Addy Osmani Agent Skills, Development Tooling, GLB Audit Script, Graphify, Model Inspector (dev only), OmniRoute, Ponytail

### Community 73 - "CASE 404: Session notes, 2026-10-12"
Cohesion: 0.29
Nodes (6): Assets, CASE 404: Session notes, 2026-10-12, Loader, Merch corner, Open items, Paintings (parked)

### Community 74 - "ExperienceCanvas"
Cohesion: 0.27
Nodes (6): 30. WebGL fallback strategy, CanvasErrorBoundary, Props, State, WebGLFallbackNotice(), ExperienceCanvas()

### Community 75 - "CASE 404 — Session notes, 2026-10-11"
Cohesion: 0.33
Nodes (5): CASE 404 — Session notes, 2026-10-11, Cursor, Dossier, Fixes, Open items

### Community 76 - "AchievementShelf.tsx"
Cohesion: 0.36
Nodes (7): AchievementShelf(), Diploma(), FRAMES, PANEL, SHEET, inspectable(), useWallInspect()

### Community 77 - "projects.ts"
Cohesion: 0.29
Nodes (5): archiveProjects, ProjectCategory, projects, Media(), ProjectDialog()

### Community 78 - "PolaroidPhotos.tsx"
Cohesion: 0.60
Nodes (4): frontOf(), ownPrint(), PolaroidPhotos(), PRINTS

## Knowledge Gaps
- **442 isolated node(s):** `printWidth`, `semi`, `trailingComma`, `name`, `private` (+437 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 492 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `Site.tsx`, `paintCaseBoard.ts`, `loadProgress.ts`, `diskRackLayout.ts`, `ArchiveStation.tsx`, `PersonalComputer.tsx`, `DesignPosters.tsx`, `ShipDisplay.tsx`, `package.json`, `WallSconces.tsx`, `RoomShell.tsx`, `useExperienceStore.ts`, `MoonWindow.tsx`, `DetectiveOffice.tsx`, `Dossier.tsx`, `storyNav.ts`, `DeskProps.tsx`, `@react-three/fiber`, `ResumeOverlay.tsx`, `StoryController.tsx`, `ExperienceCanvas.tsx`, `ResumePrint.tsx`, `Mist.tsx`, `MusketDisplay.tsx`, `FloppyDisk.tsx`, `three`, `ExperienceCanvas`, `AchievementShelf.tsx`, `projects.ts`, `PolaroidPhotos.tsx`?**
  _High betweenness centrality (0.217) - this node is a cross-community bridge._
- **What connects `printWidth`, `semi`, `trailingComma` to the rest of the system?**
  _442 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `paintCaseBoard.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051061388410786 - nodes in this community are weakly interconnected._
- **Why does `three` connect `three` to `paintCaseBoard.ts`, `loadProgress.ts`, `diskRackLayout.ts`, `ArchiveStation.tsx`, `PersonalComputer.tsx`, `DesignPosters.tsx`, `ShipDisplay.tsx`, `package.json`, `WallSconces.tsx`, `RoomShell.tsx`, `MoonWindow.tsx`, `DetectiveOffice.tsx`, `Dossier.tsx`, `DeskProps.tsx`, `@react-three/fiber`, `focus.ts`, `StoryController.tsx`, `ExperienceCanvas.tsx`, `ResumePrint.tsx`, `Mist.tsx`, `MusketDisplay.tsx`, `FloppyDisk.tsx`, `AchievementShelf.tsx`, `PolaroidPhotos.tsx`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Should `loadProgress.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.055904961565338925 - nodes in this community are weakly interconnected._
- **Why does `@react-three/fiber` connect `@react-three/fiber` to `DeskProps.tsx`, `paintCaseBoard.ts`, `loadProgress.ts`, `ArchiveStation.tsx`, `PersonalComputer.tsx`, `focus.ts`, `three`, `DesignPosters.tsx`, `AchievementShelf.tsx`, `package.json`, `ExperienceCanvas.tsx`, `WallSconces.tsx`, `ResumePrint.tsx`, `FloppyDisk.tsx`, `Mist.tsx`, `MoonWindow.tsx`, `Dossier.tsx`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `diskRackLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08362369337979095 - nodes in this community are weakly interconnected._