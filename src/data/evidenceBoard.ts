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
  | "workspaceSilhouette"
  | "wireframeSheet"
  | "skyline"
  | "posterLetter"
  | "shapeStudy"
  | "editingTimeline"
  | "filmStrip"
  | "photoBack";

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
  ],
  stamp: "CONFIDENTIAL",
  /** Map-space rectangle as fractions of the map: x, y, width, height. */
  rect: [0.343, 0.318, 0.316, 0.59],
} as const satisfies { piece: BoardPieceId } & Record<string, unknown>;

export const pieces: BoardPiece[] = [
  // FRONTEND — upper left
  { piece: "Plane067__0", kind: "codeEditor" },
  { piece: "Plane059__0", kind: "codePrintout" },
  // Identity fragment between the left clusters
  { piece: "Plane060__0", kind: "workspaceSilhouette" },
  // UI/UX — lower left (the bent sheet that used to be a newspaper)
  { piece: "Plane062__0", kind: "wireframeSheet" },
  // Location clue — bottom
  { piece: "Plane063__0", kind: "skyline" },
  // GRAPHIC DESIGN — upper right
  { piece: "Plane070__0", kind: "posterLetter" },
  { piece: "Plane069__0", kind: "shapeStudy" },
  // VIDEO EDITING — lower right
  { piece: "Plane071__0", kind: "editingTimeline" },
  { piece: "Plane066__0", kind: "filmStrip" },
  // Near the master pin: turned face-down so the hub reads on its own.
  { piece: "Plane061__0", kind: "photoBack" },
  { piece: "Plane072__0", kind: "photoBack" },
];

/** Small typed labels on the original note cards; empty = blank card. */
export const tags: { piece: BoardPieceId; lines: string[] }[] = [
  { piece: "Plane068__0", lines: ["FRONTEND", "DEVELOPMENT"] },
  { piece: "Plane064__0", lines: ["UI/UX", "DESIGN"] },
  { piece: "Plane074__0", lines: ["GRAPHIC", "DESIGN"] },
  { piece: "Plane075__0", lines: ["VIDEO", "EDITING"] },
  { piece: "Plane065__0", lines: ["CEBU,", "PHILIPPINES"] },
  { piece: "Plane073__0", lines: [] },
];

/**
 * Red-string connections: ONE master pin at the map's top-centre, one
 * route out to each discipline's existing pin. Board-face coordinates
 * (s = right, t = up) are in the board GLB's own space.
 */
export const connections = {
  masterPin: { cloneOf: "Cylinder019__0", s: -0.531, t: 1.87, scale: 1.3 },
  targets: [
    { discipline: "Frontend Development", pin: "Cylinder007__0" },
    { discipline: "UI/UX Design", pin: "Cylinder014__0" },
    { discipline: "Graphic Design", pin: "Cylinder022__0" },
    { discipline: "Video Editing", pin: "Cylinder024__0" },
  ],
} as const;
