# Graph Report - CASE-404  (2026-11-08)

## Corpus Check
- 166 files · ~4,228,391 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 73 file(s) not represented in the graph (top: .glb 38, (none) 23, .css 10)

## Summary
- 1166 nodes · 2477 edges · 69 communities (59 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 56 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1dc504c2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- three
- paintCaseBoard.ts
- paintDossierPages.ts
- loadProgress.ts
- diskRackLayout.ts
- ArchiveStation.tsx
- PersonalComputer.tsx
- computerAudio.ts
- CASE 404 — Architecture
- DesignPosters.tsx
- storyTypes.ts
- ShipDisplay.tsx
- paintArchive.ts
- package.json
- split-lamp-chain.mjs
- DeskProps.tsx
- useExperienceStore
- compilerOptions
- RoomShell.tsx
- CASE 404: Session notes, 2026-10-14 to 15
- Experience.tsx
- devDependencies
- @gltf-transform/core
- MoonWindow.tsx
- FileCabinets.tsx
- compilerOptions
- FloppyDisk.tsx
- nigelChat.ts
- paintNigel.ts
- Dossier.tsx
- SceneNav.tsx
- react
- MedievalPaintings.tsx
- assetManifest.ts
- compilerOptions
- ASSET_INVENTORY.md
- CASE 404 — Handoff notes
- scripts
- ResumeOverlay.tsx
- index.ts
- StoryController.tsx
- dependencies
- ref_node_fs
- measure-glb.mjs
- prepare-posters.mjs
- IBM PCjr 4863 Computer — External Sketchfab Embed
- audit-glb.mjs
- cursorStore.ts
- paintArchiveScreen
- MusketDisplay.tsx
- board-islands.mjs
- perf-budget.mjs
- prepare-window-2.mjs
- N.I.G.E.L. Worker
- CASE 404 — Asset Credits
- CASE 404 — Source Assets
- .prettierrc.json
- CLAUDE.md
- externalAssets.ts
- skills.ts
- Dynamic Content Surfaces
- tsconfig.json
- CREDITS.md
- images/README.md
- nctvwork/README.md
- README.md
- environmentConfig.ts
- AchievementShelf.tsx
- CASE 404 — Session notes, 2026-10-11

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
- `Video disks, sound and the lag fixes` --references--> `shadowsChanged()`  [INFERRED]
  docs/SESSION-2026-10-15.md → src/experience/canvas/shadowUpdates.ts
- `6. Single persistent Canvas architecture` --references--> `DetectiveOffice()`  [INFERRED]
  ARCHITECTURE.md → src/experience/environment/DetectiveOffice.tsx
- `Open items` --references--> `bullets()`  [INFERRED]
  docs/SESSION-2026-10-15.md → src/experience/surfaces/paintArchive.ts
- `Narrative flow` --references--> `ChapterId`  [INFERRED]
  ARCHITECTURE.md → src/story/storyTypes.ts
- `Loader` --references--> `SceneNav()`  [INFERRED]
  docs/SESSION-2026-10-12.md → src/experience/SceneNav.tsx

## Import Cycles
- None detected.

## Communities (69 total, 10 thin omitted)

### Community 0 - "three"
Cohesion: 0.70
Nodes (3): three, useBlobTexture(), WallE()

### Community 1 - "paintCaseBoard.ts"
Cohesion: 0.05
Nodes (73): Evidence board (`src/data/evidenceBoard.ts`, `surfaces/paintCaseBoard.ts`, `EvidenceBoard.tsx`), Evidence board, Terminal power, lamps, board web, smoke, editorCode, printoutCode, terminalLines, BoardPhotoId, boardPhotos (+65 more)

### Community 2 - "paintDossierPages.ts"
Cohesion: 0.06
Nodes (57): Certificate, certificates, contact, ContactInfo, education, EducationEntry, experienceEntries, ExperienceEntry (+49 more)

### Community 3 - "loadProgress.ts"
Cohesion: 0.06
Nodes (37): react-dom, build(), burst(), buzz(), crackleBuffer(), DISTANCE, Engine, gramophone (+29 more)

### Community 4 - "diskRackLayout.ts"
Cohesion: 0.08
Nodes (40): Disk 4: OJT Tracker (and a fourth rack tier), Axis, box(), DiskRack(), paintTags(), profile(), useRackWood(), woodUVs() (+32 more)

### Community 5 - "ArchiveStation.tsx"
Cohesion: 0.09
Nodes (30): Archive desk (computer), Archive terminal: disk sounds and eject transition, ArchiveStation(), copyOf(), crtTransition, FLAT, insertPhase, LAMP_AIM (+22 more)

### Community 6 - "PersonalComputer.tsx"
Cohesion: 0.28
Nodes (7): ComputerPlacement, PC_MODEL, placeComputer(), PersonalComputer(), Props, styleComputer(), styled

### Community 7 - "computerAudio.ts"
Cohesion: 0.28
Nodes (15): click(), computerAudio, Engine, engineNow(), envelope(), fan(), get(), hiss() (+7 more)

### Community 8 - "CASE 404 — Architecture"
Cohesion: 0.06
Nodes (34): 11. Lenis ownership, 12. Zustand ownership, 13. High-frequency animation strategy, 14. Source asset architecture, 15. Production asset architecture, 16. Asset pipeline, 17. Asset manifest, 18. Coordinate convention (+26 more)

### Community 9 - "DesignPosters.tsx"
Cohesion: 0.11
Nodes (26): DesignPiece, designWork, designWorkUrl(), DesignInspectState, useDesignInspect, BACK_PLANE, BLANK, DesignPosters() (+18 more)

### Community 10 - "storyTypes.ts"
Cohesion: 0.39
Nodes (6): 21. Story / chapter architecture, CameraAnchorId, ExperienceState, Chapter, ChapterId, OfficeZone

### Community 11 - "ShipDisplay.tsx"
Cohesion: 0.17
Nodes (12): BRASS, CRADLES, paintPlate(), PLINTH, PLINTH_GEO, POST_GEO, RING, RING_GEO (+4 more)

### Community 12 - "paintArchive.ts"
Cohesion: 0.10
Nodes (36): Disk 1: CASE 404, bodyType(), BOOT_LINES, breakWord(), bullets(), buttonsShown, cache, clock() (+28 more)

### Community 13 - "package.json"
Cohesion: 0.11
Nodes (19): name, private, type, version, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks (+11 more)

### Community 14 - "split-lamp-chain.mjs"
Cohesion: 0.09
Nodes (18): beadIdx, CHAIN, chainMesh, chainNode, chainPrim, idx, [input = "public/models/case-404/props/desk-lamp.glb", output = input], io (+10 more)

### Community 15 - "DeskProps.tsx"
Cohesion: 0.06
Nodes (66): @react-three/fiber, lampAudio, cameraAnchors, CameraAnchor, ShadowDriver(), shadows, shadowsChanged(), shadowsDue() (+58 more)

### Community 16 - "useExperienceStore"
Cohesion: 0.19
Nodes (9): zustand, archiveProjects, ArchivePicker(), GROUPS, typewriterAudio, useActiveProject(), PLATEN, PosterFlipControl() (+1 more)

### Community 17 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 18 - "RoomShell.tsx"
Cohesion: 0.24
Nodes (12): Lighting and room, plasterUVs(), usePlaster(), BoardFloor(), CornerFillets(), cornerPlane(), fillet(), RightWall() (+4 more)

### Community 19 - "CASE 404: Session notes, 2026-10-14 to 15"
Cohesion: 0.08
Nodes (25): CASE 404: Session notes, 2026-10-14 to 15, Design evidence wall (computer side), Disk 2: NTV360 Dev Portal, Disk 3: Component Pantry, Lighting (committed in 8f610eb), Loader, Mist, Music on page load (+17 more)

### Community 20 - "Experience.tsx"
Cohesion: 0.20
Nodes (8): 30. WebGL fallback strategy, CanvasErrorBoundary, Props, State, WebGLFallbackNotice(), ExperienceCanvas(), Experience(), ScreenFocusControls()

### Community 21 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @gltf-transform/core (+11 more)

### Community 22 - "@gltf-transform/core"
Cohesion: 0.13
Nodes (14): @gltf-transform/core, @gltf-transform/extensions, @gltf-transform/functions, io, io, [max, ...files], io, [input, output, maxTexture = "1024", ratio = "0.3"] (+6 more)

### Community 23 - "MoonWindow.tsx"
Cohesion: 0.16
Nodes (15): BAR_X, BOUNCE, EXT, EXT_AIM, extensionPicture(), MOON_AIM, MOON_AT, MoonExtension() (+7 more)

### Community 24 - "FileCabinets.tsx"
Cohesion: 0.36
Nodes (7): BODY, CABINETS, DRAWER_TOPS, FileCabinet(), FileCabinets(), paintLabel(), useCabinetParts()

### Community 25 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 26 - "FloppyDisk.tsx"
Cohesion: 0.13
Nodes (16): Project, ProjectCategory, projectClips(), projects, DiskPose, FloppyDisk(), INSERT_SECONDS, LABEL (+8 more)

### Community 27 - "nigelChat.ts"
Cohesion: 0.28
Nodes (12): askLine(), ENDPOINT, history(), MAX_INPUT, nigel, nigelReset(), nigelSkip(), nigelStep() (+4 more)

### Community 28 - "paintNigel.ts"
Cohesion: 0.22
Nodes (14): ChatLine, SCREEN_H, SCREEN_W, Ctx, drawFace(), face(), faces, glow() (+6 more)

### Community 29 - "Dossier.tsx"
Cohesion: 0.05
Nodes (67): 10. GSAP / ScrollTrigger ownership, Balance (the other half of the job), Procedure, Report format, Rules to enforce, The incident you exist to prevent, Close-ups (shared), Archive wall (computer side) (+59 more)

### Community 30 - "SceneNav.tsx"
Cohesion: 0.14
Nodes (14): Assets, CASE 404: Session notes, 2026-10-12, Loader, Merch corner, Open items, Paintings (parked), ICONS, SceneNav() (+6 more)

### Community 31 - "react"
Cohesion: 0.53
Nodes (4): react, CatalogEntry, InspectedModel(), ModelInspectorApp()

### Community 32 - "MedievalPaintings.tsx"
Cohesion: 0.60
Nodes (4): MedievalPaintings(), Painting(), PAINTINGS, useAgedMaterial()

### Community 33 - "assetManifest.ts"
Cohesion: 0.27
Nodes (8): @react-three/drei, AssetCategory, AssetId, assetManifest, PreloadPriority, at, SPINNING, Props

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
Cohesion: 0.35
Nodes (7): downloadResume(), DownloadButton(), ResumeOverlay(), useResume, paintResume(), A4, imagePdf()

### Community 40 - "index.ts"
Cohesion: 0.15
Nodes (16): Addy Osmani Agent Skills, Development Tooling, GLB Audit Script, Graphify, Model Inspector (dev only), OmniRoute, Ponytail, NIGEL_PERSONA (+8 more)

### Community 41 - "StoryController.tsx"
Cohesion: 0.19
Nodes (15): gsap, lenis, App(), LenisProvider(), Props, registerGsap(), applyAnchor(), chapterAt() (+7 more)

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

### Community 48 - "audit-glb.mjs"
Cohesion: 0.43
Nodes (6): auditFile(), __dirname, findGlbFiles(), formatBytes(), main(), ROOT

### Community 49 - "cursorStore.ts"
Cohesion: 0.29
Nodes (6): CursorKind, CursorState, useCursor, CustomCursor(), finePointer(), ICONS

### Community 50 - "paintArchiveScreen"
Cohesion: 0.31
Nodes (10): paintOnScreen(), repaintScreen(), glow(), header(), layer(), paintArchiveScreen(), paintBoot(), paintInserted() (+2 more)

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

### Community 71 - "AchievementShelf.tsx"
Cohesion: 0.23
Nodes (11): frontOf(), AchievementShelf(), Diploma(), FRAMES, PANEL, SHEET, ownPrint(), PolaroidPhotos() (+3 more)

### Community 75 - "CASE 404 — Session notes, 2026-10-11"
Cohesion: 0.33
Nodes (5): CASE 404 — Session notes, 2026-10-11, Cursor, Dossier, Fixes, Open items

## Knowledge Gaps
- **439 isolated node(s):** `printWidth`, `semi`, `trailingComma`, `name`, `private` (+434 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 489 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `three`, `paintCaseBoard.ts`, `paintDossierPages.ts`, `loadProgress.ts`, `diskRackLayout.ts`, `ArchiveStation.tsx`, `PersonalComputer.tsx`, `DesignPosters.tsx`, `ShipDisplay.tsx`, `package.json`, `DeskProps.tsx`, `useExperienceStore`, `RoomShell.tsx`, `CASE 404: Session notes, 2026-10-14 to 15`, `Experience.tsx`, `MoonWindow.tsx`, `FileCabinets.tsx`, `FloppyDisk.tsx`, `Dossier.tsx`, `SceneNav.tsx`, `MedievalPaintings.tsx`, `assetManifest.ts`, `ResumeOverlay.tsx`, `StoryController.tsx`, `cursorStore.ts`, `MusketDisplay.tsx`, `AchievementShelf.tsx`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **What connects `printWidth`, `semi`, `trailingComma` to the rest of the system?**
  _439 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `paintCaseBoard.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051061388410786 - nodes in this community are weakly interconnected._
- **Why does `three` connect `three` to `paintCaseBoard.ts`, `loadProgress.ts`, `diskRackLayout.ts`, `ArchiveStation.tsx`, `PersonalComputer.tsx`, `DesignPosters.tsx`, `ShipDisplay.tsx`, `package.json`, `DeskProps.tsx`, `useExperienceStore`, `RoomShell.tsx`, `CASE 404: Session notes, 2026-10-14 to 15`, `MoonWindow.tsx`, `FileCabinets.tsx`, `FloppyDisk.tsx`, `Dossier.tsx`, `MedievalPaintings.tsx`, `assetManifest.ts`, `StoryController.tsx`, `MusketDisplay.tsx`, `AchievementShelf.tsx`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Should `paintDossierPages.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06233538191395961 - nodes in this community are weakly interconnected._
- **Why does `@react-three/fiber` connect `DeskProps.tsx` to `paintCaseBoard.ts`, `paintDossierPages.ts`, `loadProgress.ts`, `assetManifest.ts`, `ArchiveStation.tsx`, `PersonalComputer.tsx`, `AchievementShelf.tsx`, `DesignPosters.tsx`, `package.json`, `useExperienceStore`, `CASE 404: Session notes, 2026-10-14 to 15`, `MoonWindow.tsx`, `FloppyDisk.tsx`, `Dossier.tsx`, `react`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `loadProgress.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06207482993197279 - nodes in this community are weakly interconnected._