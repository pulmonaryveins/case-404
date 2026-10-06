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
  | "room"
  | "desk"
  | "evidenceBoard"
  | "dossier"
  | "workstation"
  | "credentials"
  | "contact"
  | "lamp"
  | "window"
  | "background";

/**
 * Semantic placeholders only. Final coordinates are determined after the
 * real GLBs are inspected (Phase 1) — do not treat these as production
 * positions.
 */
export const worldAnchors: Record<WorldAnchorId, Vector3Tuple> = {
  room: [0, 0, 0],
  desk: [0, 0, -1],
  evidenceBoard: [0, 1.2, -3],
  dossier: [2, 0.9, -1],
  workstation: [-2, 0.9, -1],
  credentials: [2, 0.9, -2],
  contact: [0, 0.9, -4],
  lamp: [0.6, 1.1, -1],
  window: [-3, 1.5, -3],
  background: [0, 0, -4],
};
