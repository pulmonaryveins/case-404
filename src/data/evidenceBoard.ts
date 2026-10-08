import type { BoardPieceId } from "../experience/surfaces/boardIslands";

/**
 * CASE 404 opening evidence board content. Pure data — the painter in
 * experience/surfaces/paintCaseBoard.ts decides how each kind looks.
 *
 * The subject's real name and photo must never appear here: the board opens
 * the mystery, the dossier reveals the identity later.
 */

export type PieceKind =
  | "codeEditor"
  | "codePrintout"
  | "browserPage"
  | "wireframeSheet"
  | "uiScreen"
  | "phoneScreen"
  | "posterLetter"
  | "shapeStudy"
  | "colorPalette"
  | "editingTimeline"
  | "filmStrip"
  | "videoStill";

export interface BoardPiece {
  piece: BoardPieceId;
  kind: PieceKind;
}

/** Case file painted over the centre of the (kept, aged) world map. */
export const caseFile = {
  piece: "Plane058__0",
  title: ["CASE", "404"],
  subtitle: "SUBJECT UNKNOWN",
  fields: [
    { label: "IDENTITY:", value: "NOT FOUND", accent: false },
    { label: "STATUS:", value: "OPEN", accent: true },
    { label: "OCCUPATION:", value: "UNKNOWN", accent: false },
    { label: "LOCATION:", value: "UNKNOWN", accent: false },
  ],
  stamp: "CONFIDENTIAL",
  /** Map-space rectangle as fractions of the map: x, y, width, height. */
  rect: [0.3, 0.2, 0.4, 0.72],
} as const satisfies { piece: BoardPieceId } & Record<string, unknown>;

/**
 * Four discipline clusters, three evidence images each, one role tag each.
 * Every other paper on the board is hidden (see `hiddenPieces`).
 */
export const pieces: BoardPiece[] = [
  // FRONTEND — upper left
  { piece: "Plane067__0", kind: "codeEditor" },
  { piece: "Plane059__0", kind: "codePrintout" },
  { piece: "Plane061__0", kind: "browserPage" },
  // UI/UX — lower left
  { piece: "Plane062__0", kind: "wireframeSheet" },
  { piece: "Plane063__0", kind: "uiScreen" },
  { piece: "Plane060__0", kind: "phoneScreen" },
  // GRAPHIC DESIGN — upper right
  { piece: "Plane070__0", kind: "posterLetter" },
  { piece: "Plane069__0", kind: "shapeStudy" },
  { piece: "Plane072__0", kind: "colorPalette" },
  // VIDEO EDITING — lower right
  { piece: "Plane071__0", kind: "editingTimeline" },
  { piece: "Plane066__0", kind: "filmStrip" },
  { piece: "Plane065__0", kind: "videoStill" },
];

/** Role label on each cluster's note card. */
export const tags: { piece: BoardPieceId; lines: string[] }[] = [
  { piece: "Plane068__0", lines: ["FRONTEND", "DEVELOPMENT"] },
  { piece: "Plane064__0", lines: ["UI/UX", "DESIGN"] },
  { piece: "Plane074__0", lines: ["GRAPHIC", "DESIGN"] },
  { piece: "Plane075__0", lines: ["VIDEO", "EDITING"] },
];

/**
 * Original board nodes removed so only the four clusters remain: leftover
 * photos/notes, plus every pin that is not on a kept paper or a map corner.
 */
export const hiddenPieces = [
  "Plane073__0",
  ...[15, 19, 27, 29, 30, 31, 32, 33].map((n) => `Cylinder0${String(n).padStart(2, "0")}__0`),
];

/**
 * Every kept paper (with its own pin) regrouped into one overlapping pile per
 * role: rear image on top, front image overlapping below it, role card at the
 * bottom-left lying over the front image. `from` / `to` are board-face
 * (s, t) centres; `from` is the paper's position in the original GLB. `lift`
 * pushes the paper toward the viewer so later papers lie over earlier ones.
 * Each paper only overlaps the lower half of the one behind it, so no pin is
 * covered.
 */
export const movedPieces = [
  // FRONTEND — upper left
  { nodes: ["Plane067__0", "Cylinder007__0"], from: [-1.53, 1.88], to: [-1.3, 1.9], lift: 0 },
  { nodes: ["Plane059__0", "Cylinder008__0"], from: [-1.39, 1.71], to: [-1.27, 1.69], lift: 0.012 },
  {
    nodes: ["Plane068__0", "Cylinder010__0"],
    from: [-1.45, 1.47],
    to: [-1.425, 1.62],
    lift: 0.024,
  },
  { nodes: ["Plane061__0", "Cylinder018__0"], from: [-0.8, 1.86], to: [-1.48, 1.795], lift: 0.018 },
  // UI/UX — lower left
  { nodes: ["Plane062__0", "Cylinder014__0"], from: [-1.33, 0.89], to: [-1.22, 1.12], lift: 0 },
  { nodes: ["Plane063__0", "Cylinder017__0"], from: [-0.64, 1.03], to: [-1.25, 1.36], lift: 0 },
  { nodes: ["Plane064__0", "Cylinder016__0"], from: [-0.86, 0.92], to: [-1.51, 1.03], lift: 0.024 },
  { nodes: ["Plane060__0", "Cylinder009__0"], from: [-1.28, 1.57], to: [-1.53, 1.34], lift: 0.02 },
  // GRAPHIC DESIGN — upper right
  { nodes: ["Plane069__0", "Cylinder021__0"], from: [0.33, 1.71], to: [0.36, 1.92], lift: 0 },
  { nodes: ["Plane070__0", "Cylinder022__0"], from: [0.54, 1.72], to: [0.39, 1.73], lift: 0.012 },
  { nodes: ["Plane074__0", "Cylinder023__0"], from: [0.32, 1.53], to: [0.16, 1.63], lift: 0.024 },
  { nodes: ["Plane072__0", "Cylinder020__0"], from: [-0.1, 1.93], to: [0.17, 1.88], lift: 0.018 },
  // Map corner pin the palette now covers: stays in place, lifted over it.
  { nodes: ["Cylinder011__0"], from: [0.09, 1.87], to: [0.09, 1.87], lift: 0.03 },
  // VIDEO EDITING — lower right
  { nodes: ["Plane071__0", "Cylinder024__0"], from: [0.34, 1.27], to: [0.3, 1.32], lift: 0 },
  { nodes: ["Plane066__0", "Cylinder025__0"], from: [-0.28, 1.03], to: [0.33, 1.155], lift: 0.012 },
  { nodes: ["Plane075__0", "Cylinder035__0"], from: [0.22, 1.07], to: [0.13, 1.07], lift: 0.024 },
  { nodes: ["Plane065__0", "Cylinder026__0"], from: [-0.39, 0.92], to: [0.12, 1.32], lift: 0.018 },
] as const;

/**
 * The board texture has shadows baked around every ORIGINAL paper and pin.
 * Wherever a paper or pin was hidden or moved, its shadow is patched out of
 * the map by copying clean map from `from` (+1 = above, -1 = below).
 * `mapBounds` is the map's extent on the board face (s min/max, t min/max).
 * Entries are board-face centre (s, t) and half-size (hw, hh).
 */
export const mapStains = {
  mapBounds: { s: [-1.165, 0.105], t: [1.045, 1.895] },
  patches: [
    // Hidden map pins
    { s: -0.97, t: 1.61, hw: 0.06, hh: 0.06, from: 1 },
    { s: -0.98, t: 1.55, hw: 0.06, hh: 0.06, from: -1 },
    { s: -0.94, t: 1.24, hw: 0.06, hh: 0.06, from: 1 },
    { s: -0.3, t: 1.55, hw: 0.06, hh: 0.06, from: 1 },
    { s: -0.14, t: 1.67, hw: 0.06, hh: 0.06, from: 1 },
    { s: -0.13, t: 1.43, hw: 0.06, hh: 0.06, from: 1 },
    // Hidden / moved papers overlapping the map's top edge
    { s: -0.8, t: 1.82, hw: 0.19, hh: 0.12, from: -1 },
    { s: -0.32, t: 1.84, hw: 0.13, hh: 0.1, from: -1 },
    { s: -0.1, t: 1.84, hw: 0.16, hh: 0.1, from: -1 },
    // ...and its bottom edge
    { s: -0.64, t: 1.09, hw: 0.15, hh: 0.09, from: 1 },
    { s: -0.88, t: 1.08, hw: 0.11, hh: 0.08, from: 1 },
    { s: -0.28, t: 1.09, hw: 0.16, hh: 0.09, from: 1 },
    { s: -0.39, t: 1.08, hw: 0.12, hh: 0.08, from: 1 },
  ],
} as const;

/**
 * Red-string connections: ONE master pin on the case file's top edge, and one
 * straight string out to every pin on the board — each role's photos and its
 * sticky note. Board-face coordinates (s = right, t = up) are in the board
 * GLB's own space.
 */
export const connections = {
  masterPin: { cloneOf: "Cylinder019__0", s: -0.529, t: 1.715, scale: 1.3 },
  targets: [
    // FRONTEND
    { discipline: "Frontend Development", pin: "Cylinder007__0" },
    { discipline: "Frontend Development", pin: "Cylinder008__0" },
    { discipline: "Frontend Development", pin: "Cylinder018__0" },
    { discipline: "Frontend Development", pin: "Cylinder010__0" },
    // UI/UX
    { discipline: "UI/UX Design", pin: "Cylinder014__0" },
    { discipline: "UI/UX Design", pin: "Cylinder017__0" },
    { discipline: "UI/UX Design", pin: "Cylinder009__0" },
    { discipline: "UI/UX Design", pin: "Cylinder016__0" },
    // GRAPHIC DESIGN
    { discipline: "Graphic Design", pin: "Cylinder021__0" },
    { discipline: "Graphic Design", pin: "Cylinder022__0" },
    { discipline: "Graphic Design", pin: "Cylinder020__0" },
    { discipline: "Graphic Design", pin: "Cylinder023__0" },
    // VIDEO EDITING
    { discipline: "Video Editing", pin: "Cylinder024__0" },
    { discipline: "Video Editing", pin: "Cylinder025__0" },
    { discipline: "Video Editing", pin: "Cylinder026__0" },
    { discipline: "Video Editing", pin: "Cylinder035__0" },
  ],
} as const;
