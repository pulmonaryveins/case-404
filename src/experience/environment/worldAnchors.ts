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

/**
 * How far each corner desk is slid along its corner wall, toward the side
 * wall, from the wall's own anchor (`digitalArchive`, mirrored for the left):
 * so its inner end clears the file cabinet on the back wall beside it; at
 * that its outer back corner just meets the side wall. The corner walls stay
 * on the anchor (RoomShell), and so do the things hung on them (the archive's
 * design posters and shelf), so only the desks move.
 */
export const STATION_SLIDE = 0.28;

/** The computer desk (ArchiveStation), back-right corner, slid along its own +X. */
export const ARCHIVE_STATION = {
  position: [
    2.5 + STATION_SLIDE * Math.cos(ARCHIVE_YAW),
    0,
    -2.85 - STATION_SLIDE * Math.sin(ARCHIVE_YAW),
  ] as Vector3Tuple,
  yaw: ARCHIVE_YAW,
};

/** The typewriter desk (TypewriterStation): the computer desk mirrored into the back-left corner. */
export const TYPEWRITER_STATION = {
  position: [-ARCHIVE_STATION.position[0], 0, ARCHIVE_STATION.position[2]] as Vector3Tuple,
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
