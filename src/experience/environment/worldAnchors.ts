import type { Vector3Tuple } from "../../types/common";

/**
 * World coordinate convention for the whole experience:
 *   +X = right     -X = left
 *   +Y = up        -Y = down
 *   +Z = toward the camera / out of the room (camera starts at +Z looking
 *        toward -Z, i.e. "deeper into the office" is increasingly negative Z)
 *
 * Do not change this convention later without updating every anchor below.
 */

export type WorldAnchorId =
  | "mainDesk"
  | "evidenceBoard"
  | "dossier"
  | "digitalArchive"
  | "creativeEvidence"
  | "credentials"
  | "contact";

/**
 * Semantic anchors for the office zones (ARCHITECTURE.md §2). Values exist
 * only where the zone is actually blocked out (mirroring assetManifest);
 * `null` means "not placed yet" — never invent a coordinate here. Deeper
 * zones get positions through visual blockout, not guesswork.
 */
/**
 * World height of the desk's work surface. Measured, not eyeballed: the
 * desk's topmost vertices form one flat plane at local y 2.074, which the
 * manifest's 0.375 scale puts at 0.7777 m. There is no raised rim, so props
 * anywhere on the top rest on this plane.
 */
export const DESK_TOP = 0.778;

/**
 * Turn of the archive desk (and the corner wall behind it), radians about Y.
 * Negative turns its front from +Z toward the room's centre (-X). Keep in
 * sync with the `digitalArchive` camera anchor.
 */
export const ARCHIVE_YAW = -0.67;

/** The computer desk (ArchiveStation), back-right corner, on its corner wall's centre. */
export const ARCHIVE_STATION = {
  position: [2.5, 0, -2.85] as Vector3Tuple,
  yaw: ARCHIVE_YAW,
};

/**
 * How far the typewriter desk sits along its corner wall from the anchor, so it
 * is centred on the wall's flat run between the two rounded coves (RoomShell:
 * the coves' tangent points at -0.888 and +0.777 m from the wall's own centre,
 * which is CORNER_SHIFT 0.08 m past the anchor).
 */
const CORNER_CENTRE = 0.025;

/**
 * The typewriter desk (TypewriterStation): the computer desk's corner mirrored
 * into the back-left, centred on its wall.
 */
export const TYPEWRITER_STATION = {
  position: [
    -(2.5 + CORNER_CENTRE * Math.cos(ARCHIVE_YAW)),
    0,
    -2.85 - CORNER_CENTRE * Math.sin(ARCHIVE_YAW),
  ] as Vector3Tuple,
  yaw: -ARCHIVE_YAW,
};

export const worldAnchors: Record<WorldAnchorId, Vector3Tuple | null> = {
  mainDesk: [0.05, 0, -2.05],
  evidenceBoard: [0, 1.46, -3.74],
  dossier: [0.52, 0.782, -1.85],
  digitalArchive: [2.5, 0, -2.85],
  creativeEvidence: null,
  credentials: null,
  contact: null,
};
