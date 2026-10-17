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
  | "videoStill"
  | "evidenceCard"
  | "terminal";

export interface BoardPiece {
  piece: BoardPieceId;
  kind: PieceKind;
  /** Keep the board's own baked-in photo instead of painting placeholder art. */
  keepOriginal?: boolean;
}

/** Case file painted over the centre of the (kept, aged) world map. */
export const caseFile = {
  piece: "Plane058__0",
  /** The case file sheet hung at the centre (public/images/board). */
  image: "/images/board/case-file.webp",
  title: ["CASE", "404"],
  subtitle: "SUBJECT UNKNOWN",
  fields: [
    { label: "IDENTITY:", value: "NOT FOUND", accent: false },
    { label: "STATUS:", value: "OPEN", accent: true },
    { label: "OCCUPATION:", value: "UNKNOWN", accent: false },
    { label: "LOCATION:", value: "UNKNOWN", accent: false },
  ],
  stamp: "CONFIDENTIAL",
  /**
   * The file is a square 3D poster at the centre of the board, not painted on
   * the map: centre (board-face s, t), tilt, and the scale of the square poster
   * model (0.36 m at 1), so about 0.34 m a side. It sits halfway between the
   * two hub pins above and below it (see `connections`), a little higher than
   * the board's middle; its top and bottom edges, where its own two pins go,
   * are t +- 0.18 * scale.
   */
  poster: { s: -0.476, t: 1.5, roll: 0, scale: 0.95 },
} as const satisfies { piece: BoardPieceId } & Record<string, unknown>;

/**
 * Photos painted into the board's own texture. None now: the board's baked
 * photographs are hidden and the evidence is hung as 3D posters instead (see
 * `roleClusters`), so there is nothing to repaint.
 */
export const pieces: BoardPiece[] = [];

/** Role label on each cluster's sticky note (and the board's old card under it). */
export const tags: { piece: BoardPieceId; lines: string[] }[] = [
  { piece: "Plane068__0", lines: ["FRONTEND", "DEVELOPMENT"] },
  { piece: "Plane064__0", lines: ["UI/UX", "DESIGN"] },
  { piece: "Plane074__0", lines: ["GRAPHIC", "DESIGN"] },
  { piece: "Plane075__0", lines: ["VIDEO", "EDITING"] },
];

/**
 * Original board nodes removed: every baked-in photograph and the card under
 * the case file (the evidence is now the posters of `roleClusters`), and every
 * pin that is not reused. The pins that stay are the four role cards' own and
 * twelve more, moved onto the posters; 6, 11, 12 and 13 are strays left stuck
 * in the world map holding nothing, and 19 is the master pin's source (the
 * master pin is a clone of it).
 */
export const hiddenPieces = [
  ...[6, 11, 12, 13, 15, 19, 27, 29, 30, 31, 32, 33].map(
    (n) => `Cylinder0${String(n).padStart(2, "0")}__0`,
  ),
  ...[59, 60, 61, 62, 63, 65, 66, 67, 69, 70, 71, 72, 73].map((n) => `Plane0${n}__0`),
];

export type PosterShape = "landscape" | "portrait" | "square";

export interface BoardPoster {
  shape: PosterShape;
  /** Which sample image to paint on it (see paintEvidenceImage). */
  kind: PieceKind;
  /**
   * An image to print instead (a URL under public/images), such as the
   * subject's own design work. Fitted whole inside the poster, on its paper.
   */
  image?: string;
  /** The board pin this poster hangs from. */
  pin: string;
  /** Centre on the board face (s = right, t = up, metres) and tilt (rad). */
  s: number;
  t: number;
  roll: number;
}

export interface RoleCluster {
  role: string;
  /** The role's note card and its own pin, and where the card sits (board face). */
  card: { piece: BoardPieceId; pin: string; s: number; t: number };
  /** Three posters, a landscape, a portrait and a square, hung round the corner. */
  posters: [BoardPoster, BoardPoster, BoardPoster];
}

/**
 * The board layout: the case file at the centre of the board, a role card at
 * each corner of a rectangle round it, and round each card a cluster of three
 * posters (landscape, portrait, square) filling the board's outer corner,
 * overlapping the map's corner a little. A red string runs from the case
 * file's pin to each role card, and from each card to its three posters. The
 * posters carry sample images (painted, per role) until the real ones arrive.
 *
 * Board-face coordinates in metres: the board spans s -1.674..0.722, t
 * 0.70..2.05 (centre -0.476, 1.375); the map s -1.165..0.105, t 1.045..1.895.
 * The layout is mirrored left to right about the board's centre; the lower
 * clusters mirror the upper about t 1.46 (a little above the board's middle),
 * so the UI/UX and VIDEO clusters, and their cards, sit higher. Each cluster
 * is close but not crowded: its three posters sit about 2 cm apart.
 */
export const roleClusters: RoleCluster[] = [
  {
    // upper left
    role: "FRONTEND",
    card: { piece: "Plane068__0", pin: "Cylinder010__0", s: -1.015, t: 1.565 },
    posters: [
      {
        shape: "landscape",
        kind: "codeEditor",
        pin: "Cylinder007__0",
        s: -1.45,
        t: 1.9,
        roll: -0.07,
      },
      {
        shape: "portrait",
        kind: "codePrintout",
        pin: "Cylinder008__0",
        s: -1.167,
        t: 1.83,
        roll: 0.05,
      },
      {
        shape: "square",
        kind: "terminal",
        pin: "Cylinder018__0",
        s: -1.45,
        t: 1.66,
        roll: -0.04,
      },
    ],
  },
  {
    // lower left
    role: "UI/UX",
    card: { piece: "Plane064__0", pin: "Cylinder016__0", s: -1.015, t: 1.235 },
    posters: [
      {
        shape: "landscape",
        kind: "uiScreen",
        pin: "Cylinder014__0",
        s: -1.45,
        t: 1.02,
        roll: 0.06,
      },
      {
        shape: "portrait",
        kind: "wireframeSheet",
        pin: "Cylinder017__0",
        s: -1.167,
        t: 1.09,
        roll: -0.04,
      },
      {
        shape: "square",
        kind: "phoneScreen",
        pin: "Cylinder009__0",
        s: -1.45,
        t: 1.26,
        roll: 0.05,
      },
    ],
  },
  {
    // upper right
    role: "GRAPHIC",
    card: { piece: "Plane074__0", pin: "Cylinder023__0", s: 0.063, t: 1.565 },
    posters: [
      {
        shape: "landscape",
        kind: "colorPalette",
        image: "/images/design/9.webp",
        pin: "Cylinder021__0",
        s: 0.498,
        t: 1.9,
        roll: 0.07,
      },
      {
        shape: "portrait",
        kind: "posterLetter",
        image: "/images/design/3.webp",
        pin: "Cylinder022__0",
        s: 0.215,
        t: 1.83,
        roll: -0.05,
      },
      {
        shape: "square",
        kind: "shapeStudy",
        image: "/images/design/8.webp",
        pin: "Cylinder020__0",
        s: 0.498,
        t: 1.66,
        roll: 0.04,
      },
    ],
  },
  {
    // lower right
    role: "VIDEO",
    card: { piece: "Plane075__0", pin: "Cylinder035__0", s: 0.063, t: 1.235 },
    posters: [
      {
        shape: "landscape",
        kind: "editingTimeline",
        pin: "Cylinder024__0",
        s: 0.498,
        t: 1.02,
        roll: -0.06,
      },
      {
        shape: "portrait",
        kind: "filmStrip",
        pin: "Cylinder025__0",
        s: 0.215,
        t: 1.09,
        roll: 0.04,
      },
      {
        shape: "square",
        kind: "videoStill",
        pin: "Cylinder026__0",
        s: 0.498,
        t: 1.26,
        roll: -0.05,
      },
    ],
  },
];

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

export type BoardPhotoId = "top" | "bottom" | "left" | "right";

/**
 * Loose evidence prints on the map round the case file, each pinned at its
 * top: one above the file, one below it, and one either side between the file
 * and the role cards. `image` is the print (public/images/board), `size` its
 * width (m) and `aspect` its height over width (the bottom one, a fingerprint,
 * is a portrait print; the rest are square).
 */
export const boardPhotos: {
  id: BoardPhotoId;
  image: string;
  aspect: number;
  s: number;
  t: number;
  roll: number;
  size: number;
}[] = [
  {
    id: "top",
    image: "/images/board/photo-top.webp",
    aspect: 1,
    s: -0.476,
    t: 1.875,
    roll: 0.03,
    size: 0.17,
  },
  {
    id: "bottom",
    image: "/images/board/photo-bottom.webp",
    aspect: 768 / 574,
    s: -0.476,
    t: 1.155,
    roll: -0.04,
    size: 0.13,
  },
  {
    id: "left",
    image: "/images/board/photo-left.webp",
    aspect: 1,
    s: -0.78,
    t: 1.47,
    roll: -0.06,
    size: 0.14,
  },
  {
    id: "right",
    image: "/images/board/photo-right.webp",
    aspect: 1,
    s: -0.172,
    t: 1.47,
    roll: 0.06,
    size: 0.14,
  },
];

/** A strand's end: the case file's top pin, a role card (by role) or a photo. */
export type StringEnd = "file" | { card: string } | { photo: BoardPhotoId };

/**
 * The red-string network (besides each role card's strings to its own three
 * posters, which follow from `roleClusters`). The case file's pin, on its top
 * edge, is strung to the photo above it and to the two upper role cards. Each
 * upper card runs down to the card below it. On the left, UI/UX is strung up
 * to the left photo and on to the file, and down to the photo under the file.
 * On the right, GRAPHIC is strung to the right photo, which runs on to the
 * photo under the file and to VIDEO. The file's bottom edge has no string.
 * Every pin is the red push pin (EvidenceBoard).
 */
export const connections: {
  strands: [StringEnd, StringEnd][];
} = {
  strands: [
    ["file", { photo: "top" }],
    ["file", { card: "FRONTEND" }],
    ["file", { card: "GRAPHIC" }],
    [{ card: "FRONTEND" }, { card: "UI/UX" }],
    [{ card: "GRAPHIC" }, { card: "VIDEO" }],
    [{ card: "UI/UX" }, { photo: "left" }],
    [{ photo: "left" }, "file"],
    [{ card: "UI/UX" }, { photo: "bottom" }],
    [{ card: "GRAPHIC" }, { photo: "right" }],
    [{ photo: "right" }, { photo: "bottom" }],
    [{ photo: "right" }, { card: "VIDEO" }],
    // The web's middle: more threads through the photos either side.
    [{ card: "FRONTEND" }, { photo: "left" }],
    [{ photo: "left" }, { photo: "bottom" }],
    ["file", { photo: "right" }],
    [{ photo: "bottom" }, { card: "VIDEO" }],
  ],
};
