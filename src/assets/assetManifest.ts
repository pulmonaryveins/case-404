import type { Vector3Tuple } from "../types/common";

export type AssetCategory = "environment" | "furniture" | "workstation" | "dossier" | "props";

export type PreloadPriority = 1 | 2 | 3 | 4 | 5;

export interface ManifestAsset {
  id: string;
  url: string;
  category: AssetCategory;
  preloadPriority: PreloadPriority;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: number;
  castShadow: boolean;
  receiveShadow: boolean;
  /** Replaces the base colour map with a flat colour (normal/roughness kept). */
  color?: string;
}

/**
 * Centralized runtime asset configuration. Scene components look models up
 * by id here instead of hardcoding `/models/...` paths.
 *
 * Only Phase 1B blockout assets are registered — these are the approved
 * runtime derivatives under public/models/case-404, NOT the full 25-asset
 * source library in assets-source/case-404.
 *
 * `scale` normalizes each model to metres. Source models arrive in wildly
 * different units (see assets-source/case-404/ASSET_INVENTORY.md); true
 * world-space bounds were measured with scripts/measure-glb.mjs and the
 * factors below bring each to a believable real-world size. Source GLBs
 * are never modified — all normalization is transform-level.
 */
export const assetManifest = {
  desk: {
    id: "desk",
    url: "/models/case-404/furniture/desk.glb",
    category: "furniture",
    preloadPriority: 1,
    // Measured 2.22 x 2.08 x 4.24 -> width runs along local Z, so it is
    // rotated a quarter turn to face the camera. 0.375 puts the work
    // surface at ~0.78m.
    position: [0.05, 0, -2.05],
    rotation: [0, Math.PI / 2 + 0.035, 0],
    scale: 0.375,
    castShadow: true,
    receiveShadow: true,
  },
  corkboard: {
    id: "corkboard",
    url: "/models/case-404/environment/corkboard.glb",
    category: "environment",
    preloadPriority: 1,
    // 2cm off the wall (was -3.74): with ~1.5cm standoff the board's own
    // shadow on the wall was sub-centimetre and invisible, so it read as
    // printed on the wall rather than hung on it.
    position: [0.0, 1.46, -3.72],
    rotation: [0, 0, 0],
    scale: 1.3,
    castShadow: true,
    receiveShadow: true,
  },
  investigationBoard: {
    id: "investigationBoard",
    url: "/models/case-404/environment/investigation-board.glb",
    category: "environment",
    preloadPriority: 1,
    // Authored facing +X with an off-centre pivot (measured bounds
    // 0.06 x 1.35 x 2.40, centre (-2.14, 1.375, 0.478)). Rotated -90° Y to
    // face the camera; position re-centres it at (0, 1.46, -3.75), ~2cm
    // off the wall.
    position: [0.478, 0.085, -1.61],
    rotation: [0, -Math.PI / 2, 0],
    scale: 1,
    castShadow: true,
    receiveShadow: true,
  },
  plasterWall: {
    id: "plasterWall",
    url: "/models/case-404/environment/architecture/walls/plaster-wall-module.glb",
    category: "environment",
    preloadPriority: 1,
    // One plain module from classic_modular_walls_ceiling_fixed.glb
    // (1.032 x 3.44m, authored in metres; local x 3.31..4.34, front face at
    // local z -1.99). This transform centres the module on x = 0 with its
    // front face at world z -3.80 (2cm behind the board). RoomShell repeats
    // it edge to edge.
    position: [-3.826, 0, -1.81],
    rotation: [0, 0, 0],
    scale: 1,
    castShadow: false,
    receiveShadow: true,
    // Source colour map is a flat olive green; swapped for a neutral warm
    // taupe-charcoal so the board and desk stay the warm objects.
    color: "#514b45",
  },
  window: {
    id: "window",
    url: "/models/case-404/environment/window.glb",
    category: "environment",
    preloadPriority: 1,
    // On the back wall rather than the side wall: it reads in frame and
    // backlights the desk silhouette instead of being lost off-camera.
    position: [-2.15, 1.82, -4.4],
    rotation: [0, 0, 0],
    scale: 1,
    castShadow: false,
    receiveShadow: false,
  },
  drawer: {
    id: "drawer",
    url: "/models/case-404/furniture/drawer.glb",
    category: "furniture",
    preloadPriority: 2,
    position: [2.15, 0, -3.75],
    rotation: [0, -0.35, 0],
    scale: 0.65,
    castShadow: true,
    receiveShadow: true,
  },
  dossierPrimary: {
    id: "dossierPrimary",
    url: "/models/case-404/dossier/dossier-primary.glb",
    category: "dossier",
    preloadPriority: 2,
    position: [0.52, 0.782, -1.85],
    rotation: [0, -0.35, 0],
    scale: 0.62,
    castShadow: true,
    receiveShadow: true,
  },
  dossierFolder: {
    id: "dossierFolder",
    url: "/models/case-404/dossier/dossier-folder.glb",
    category: "dossier",
    preloadPriority: 2,
    // document_file_folder.glb: the only dossier asset that can open — its
    // folder mesh carries a recorded open/close as 210 per-frame morph
    // targets. Local 2.28 x 3.1 (spine on local -x) -> 0.105 = 24 x 33 cm.
    // The closed folder's local bounds are centred slightly left of its
    // pivot, so this offset places its physical centre on the desk centre
    // at x = 0.05, z = -2.05.
    position: [0.055, 0.789, -2.05],
    rotation: [0, 0.06, 0],
    scale: 0.105,
    castShadow: true,
    receiveShadow: true,
  },
  dossierSecondary: {
    id: "dossierSecondary",
    url: "/models/case-404/dossier/dossier-secondary.glb",
    category: "dossier",
    preloadPriority: 3,
    position: [0.52, 0.783, -1.38],
    rotation: [0, 0.3, 0],
    scale: 0.85,
    castShadow: true,
    receiveShadow: true,
  },
  evidenceBag: {
    id: "evidenceBag",
    url: "/models/case-404/props/evidence-bag.glb",
    category: "props",
    preloadPriority: 3,
    // Measured 26.3 x 45.3 x 1.7 (authored in mm) -> ~0.35m tall.
    position: [1.02, 0.783, -1.45],
    rotation: [-Math.PI / 2, 0, 0.6],
    scale: 0.0077,
    castShadow: true,
    receiveShadow: true,
  },
  logbook: {
    id: "logbook",
    url: "/models/case-404/props/logbook.glb",
    category: "props",
    preloadPriority: 3,
    position: [0.0, 0.783, -1.0],
    rotation: [0, 0.22, 0],
    scale: 0.021,
    castShadow: true,
    receiveShadow: true,
  },
  phone: {
    id: "phone",
    url: "/models/case-404/props/phone.glb",
    category: "props",
    preloadPriority: 3,
    position: [-0.62, 0.783, -2.08],
    rotation: [0, 0.62, 0],
    scale: 0.0075,
    castShadow: true,
    receiveShadow: true,
  },
  // ---------------------------------------------------------------------
  // Phase 5 desk props, rendered by DeskProps. For these, `position` x/z is
  // where the object's measured footprint centre lands on the desktop; y is
  // documentation only — DeskProp grounds every prop on DESK_TOP from its
  // real bounding box. `rotation` uses Euler order YXZ, so y is a plain yaw
  // about the vertical and x/z tilt the object first (e.g. laying it flat).
  // Runtime copies come from scripts/derive-desk-props.mjs.
  // ---------------------------------------------------------------------
  // old_vintage_desk_lamp.glb: green-shade brass banker's lamp, authored in
  // metres (0.31 x 0.44 x 0.26), base at origin. Textures 4096² -> 2048².
  // Back-left, shade turned in toward the folder.
  deskLamp: {
    id: "deskLamp",
    url: "/models/case-404/props/desk-lamp.glb",
    category: "props",
    preloadPriority: 2,
    position: [-0.52, 0.778, -2.27],
    rotation: [0, 0.9, 0],
    scale: 1,
    castShadow: true,
    receiveShadow: true,
  },
  ashtray: {
    id: "ashtray",
    url: "/models/case-404/props/ashtray.glb",
    category: "props",
    preloadPriority: 4,
    position: [-0.5, 0.778, -1.98],
    rotation: [0, 0.4, 0],
    scale: 1,
    castShadow: true,
    receiveShadow: true,
  },
  // sp226_airsoft_handgun.glb: metres (0.21 long), authored standing on its
  // side; x -90° lays it flat. Atmosphere only — not interactive, not focal.
  handgun: {
    id: "handgun",
    url: "/models/case-404/props/handgun.glb",
    category: "props",
    preloadPriority: 4,
    position: [0.62, 0.778, -1.8],
    rotation: [-Math.PI / 2, 0.5, 0],
    scale: 1,
    castShadow: true,
    receiveShadow: true,
  },
  // paper_tablet.glb (a desk plant despite the name). Unitless (~20.8 tall);
  // 0.019 makes a ~40 cm plant. Far-right back corner of the desk.
  plant: {
    id: "plant",
    url: "/models/case-404/props/plant.glb",
    category: "props",
    preloadPriority: 4,
    position: [0.72, 0.778, -2.3],
    rotation: [0, 0.8, 0],
    scale: 0.019,
    castShadow: true,
    receiveShadow: true,
  },
  evidenceMarkers: {
    id: "evidenceMarkers",
    url: "/models/case-404/props/evidence-markers.glb",
    category: "props",
    preloadPriority: 4,
    position: [0.98, 0.783, -0.86],
    rotation: [0, -0.9, 0],
    scale: 0.035,
    castShadow: true,
    receiveShadow: true,
  },
  suitcase: {
    id: "suitcase",
    url: "/models/case-404/props/suitcase.glb",
    category: "props",
    preloadPriority: 4,
    position: [-1.0, 0, -1.15],
    rotation: [0, 0.55, 0],
    scale: 0.5,
    castShadow: true,
    receiveShadow: true,
  },
} as const satisfies Record<string, ManifestAsset>;

export type AssetId = keyof typeof assetManifest;
