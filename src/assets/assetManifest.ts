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
  // Second work desk: the same desk model, to the right of the main desk,
  // carrying the project archive (terminal, floppy disks, parked file rack).
  archiveDesk: {
    id: "archiveDesk",
    url: "/models/case-404/furniture/desk.glb",
    category: "furniture",
    preloadPriority: 4,
    // Local to the station group (ArchiveStation places and turns the group).
    position: [0, 0, 0],
    rotation: [0, Math.PI / 2 + 0.035, 0],
    scale: 0.375,
    castShadow: true,
    receiveShadow: true,
  },
  // computer_terminal.glb -> computer-terminal.glb (scripts/prepare-terminal.mjs: preview
  // planes removed, 1024px WebP). A 1970s all-in-one data terminal, 1.56 x 1.08 x 1.43
  // units; 0.46 makes it ~0.72 m wide, ~0.50 m tall, with a ~13 cm panel for the disks.
  // Placed by PersonalComputer; measurements live in computerPlacement.ts.
  archiveComputer: {
    id: "archiveComputer",
    url: "/models/case-404/workstation/computer-terminal.glb",
    category: "workstation",
    preloadPriority: 4,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 0.4,
    castShadow: true,
    receiveShadow: true,
  },
  // Three-tier wooden letter tray, authored 1.15 x 0.94 x 2.27: scale 0.3 makes
  // each tray ~35 cm wide, enough for three floppy disks side by side.
  fileRack: {
    id: "fileRack",
    url: "/models/case-404/furniture/file-rack.glb",
    category: "furniture",
    preloadPriority: 4,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 0.3,
    castShadow: true,
    receiveShadow: true,
  },
  // 3.5in floppy, already in metres (9 x 9 x 0.5 cm). Front face is +Z.
  floppy: {
    id: "floppy",
    url: "/models/case-404/workstation/floppy-disk.glb",
    category: "workstation",
    preloadPriority: 4,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    // 1.3x life size (a 9 cm disk becomes ~12 cm) so the labels can be read.
    scale: 1.3,
    castShadow: true,
    receiveShadow: true,
  },
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
  // Graphic-design wall posters via scripts/prepare-posters.mjs: flat, facing +Z,
  // centred, back on z = 0. The artwork is placeholder until the real posters arrive.
  posterPortrait: {
    id: "posterPortrait",
    url: "/models/case-404/environment/posters/poster-portrait.glb",
    category: "environment",
    preloadPriority: 3,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    castShadow: false,
    receiveShadow: true,
  },
  posterSquare: {
    id: "posterSquare",
    url: "/models/case-404/environment/posters/poster-square.glb",
    category: "environment",
    preloadPriority: 3,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    castShadow: false,
    receiveShadow: true,
  },
  posterLandscape: {
    id: "posterLandscape",
    url: "/models/case-404/environment/posters/poster-landscape.glb",
    category: "environment",
    preloadPriority: 3,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1,
    castShadow: false,
    receiveShadow: true,
  },
  // window-2.glb → window-2.glb via scripts/prepare-window-2.mjs: casement
  // window turned square to the axes, centred, ~1.51 x 1.51 m, brown frames.
  // Faces +z; MoonWindow turns it to face into the room from the left wall.
  window2: {
    id: "window2",
    url: "/models/case-404/environment/window-2.glb",
    category: "environment",
    preloadPriority: 1,
    position: [-3.56, 1.6, -2.3],
    rotation: [0, Math.PI / 2, 0],
    scale: 1,
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
  // phone-vintage-pushbutton.glb → phone.glb (textures 2048² → 1024² WebP,
  // duplicate parts merged; see scripts/optimize-glb.mjs). Unitless, ~42 x 16
  // x 28 including the coiled cord, authored upright with the keypad toward +z
  // and the handset on the back; 0.0058 makes a ~16 cm handset. Body recoloured
  // black (baseColorFactor in the GLB). On the right pad in front of the
  // creeper, angled to the left so the keypad turns toward the camera. Rendered
  // by DeskProps.
  phone: {
    id: "phone",
    url: "/models/case-404/props/phone.glb",
    category: "props",
    preloadPriority: 3,
    position: [0.44, 0.778, -2.26],
    rotation: [0, -0.6, 0],
    scale: 0.0058,
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
    position: [-0.32, 0.778, -2.26],
    rotation: [0, 0.4, 0],
    scale: 1,
    castShadow: true,
    receiveShadow: true,
  },
  // colt_python_revolver.glb → colt-python-revolver.glb (textures 4096² → 1024²
  // WebP, 136K → 35K tris; see scripts/optimize-glb.mjs). Metres, 0.17 long
  // authored upright (barrel toward -z); scale 1.45 makes a ~25 cm revolver.
  // Rolled onto its side (z +90°) and yawed so the barrel points toward the
  // camera, angled right (mirrored for the left pad), showing its profile; set
  // back from the desk edge. Its six chambered cartridges are hidden
  // (closed cylinder). Atmosphere only — not interactive.
  revolver: {
    id: "revolver",
    url: "/models/case-404/props/colt-python-revolver.glb",
    category: "props",
    preloadPriority: 4,
    position: [-0.38, 0.778, -1.88],
    rotation: [0, -2.3, Math.PI / 2],
    scale: 1.45,
    castShadow: true,
    receiveShadow: true,
  },
  // 357_magnum_bullets.glb → 357-magnum-bullets.glb: four .357 Magnum rounds
  // on a flat plate, in odd units (a round is ~502 tall). DeskProps measures
  // one upright round, hides the plate, and lays three clones near the revolver
  // at 0.04 m long, a real .357 cartridge beside the 25 cm revolver.
  magnumBullets: {
    id: "magnumBullets",
    url: "/models/case-404/props/357-magnum-bullets.glb",
    category: "props",
    preloadPriority: 4,
    position: [-0.46, 0.778, -2.04],
    rotation: [0, 0, 0],
    scale: 1,
    castShadow: true,
    receiveShadow: true,
  },
  // fountain_pens.glb → fountain-pens.glb (used as delivered, 1.0 MB): two pens
  // lying on a flat "ground" plate, unitless (a pen is ~18 long). DeskProps hides
  // the plate; 0.0065 makes a ~12 cm pen. Just right of the folder, in front of
  // the phone's cord, angled a little so the pair does not look squared to the
  // desk.
  fountainPens: {
    id: "fountainPens",
    url: "/models/case-404/props/fountain-pens.glb",
    category: "props",
    preloadPriority: 4,
    position: [0.29, 0.778, -1.95],
    rotation: [0, 0.2, 0],
    scale: 0.0065,
    castShadow: true,
    receiveShadow: true,
  },
  // aluminium_pen.glb → aluminium-pen.glb (used as delivered, 1.0 MB, 734 tris):
  // a single pen 2 x 2 x 30.6 units long, axis along z; 0.005 makes a ~15 cm pen
  // (the barrel is ~1 cm). Lies on its side by the folder's right edge, pointing
  // away from the camera and angled a little to the right ("vertical" on screen).
  // Rendered by DeskProps.
  aluminiumPen: {
    id: "aluminiumPen",
    url: "/models/case-404/props/aluminium-pen.glb",
    category: "props",
    preloadPriority: 4,
    position: [0.27, 0.778, -2.0],
    rotation: [0, Math.PI - 0.6, 0],
    scale: 0.005,
    castShadow: true,
    receiveShadow: true,
  },
  // minecraft_creeper.glb → minecraft-creeper.glb (used as delivered, 15 KB, 72
  // tris): the creeper in Minecraft pixels, 8 x 26 x 12, with a 64x32 mask
  // texture that DeskProps samples unfiltered so it stays crisp. 0.0046 makes a
  // ~12 cm figure. Stands on the right pad beside the plant, behind the revolver,
  // turned toward the camera and angled well to the left (its front is -z, so yaw
  // π faces +z; lower values turn it further left).
  creeper: {
    id: "creeper",
    url: "/models/case-404/props/minecraft-creeper.glb",
    category: "props",
    preloadPriority: 4,
    position: [0.6, 0.778, -2.2],
    rotation: [0, Math.PI - 0.8, 0],
    scale: 0.0046,
    castShadow: true,
    receiveShadow: true,
  },
  // roblox-noob.glb (unmodified copy). Local height 5.1, so 0.025 makes a ~13 cm
  // figure — a little taller than the creeper it stands beside, facing the camera.
  roblox: {
    id: "roblox",
    url: "/models/case-404/props/roblox-noob.glb",
    category: "props",
    preloadPriority: 4,
    position: [0.69, 0.778, -2.15],
    rotation: [0, Math.PI / 2 - 0.65, 0],
    scale: 0.025,
    castShadow: true,
    receiveShadow: true,
  },
  // antique_magnifying_glass.glb → magnifying-glass.glb (maps 2048² → 1024²;
  // scripts/optimize-glb.mjs). Local 54 x 124 x 16 (lens diameter x length x
  // thickness), so 0.0017 makes a ~21 cm lupe. Lies flat (x -90°) on the leather pad in front, at the revolver's depth.
  magnifier: {
    id: "magnifier",
    url: "/models/case-404/props/magnifying-glass.glb",
    category: "props",
    preloadPriority: 4,
    position: [0.5, 0.778, -1.95],
    rotation: [-Math.PI / 2, 0.3, 0],
    scale: 0.0017,
    castShadow: true,
    receiveShadow: true,
  },
  // white_fedora_hat_with_black_band.glb → fedora.glb (maps → 1024² WebP,
  // 83K → 21K tris; scripts/optimize-glb.mjs). Unitless, 1.45 x 0.74 x 1.9 and
  // upright; 0.12 makes a ~23 cm fedora. Base colour factor set near-black in the
  // GLB, so the white felt reads black (the band was already black). Right of the folder,
  // beside the pen, tilted a little. Rendered by DeskProps.
  fedora: {
    id: "fedora",
    url: "/models/case-404/props/fedora.glb",
    category: "props",
    preloadPriority: 4,
    position: [0.7, 0.778, -1.9],
    rotation: [0, -0.5, 0],
    scale: 0.12,
    castShadow: true,
    receiveShadow: true,
  },
  // new_vegas_sheriff_badge.glb → sheriff-badge.glb (maps → 1024² WebP, 14K → 7K
  // tris). Unitless, 4.56 x 5.22 x 0.17, face toward +z; 0.018 makes a ~8 cm
  // badge. Laid face-up (x -90°) just behind the revolver, clear of the open
  // dossier's left cover (x ≳ -0.30). Third-party fan item (Fallout: New Vegas
  // sheriff badge) — check usage rights.
  sheriffBadge: {
    id: "sheriffBadge",
    url: "/models/case-404/props/sheriff-badge.glb",
    category: "props",
    preloadPriority: 4,
    position: [-0.37, 0.778, -2.07],
    rotation: [-Math.PI / 2, 0, 0.5],
    scale: 0.018,
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
} as const satisfies Record<string, ManifestAsset>;

export type AssetId = keyof typeof assetManifest;
