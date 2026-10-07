import type { Vector3Tuple } from "../../types/common";

export type CameraAnchorId =
  | "roomOverview"
  | "caseOpened"
  | "evidenceBoard"
  | "subjectProfile"
  | "education"
  | "experience"
  | "digitalArchive"
  | "creativeEvidence"
  | "credentials"
  | "contact"
  | "caseSolved";

export interface CameraAnchor {
  id: CameraAnchorId;
  /** Placeholder only — real coordinates are set after GLB audit (Phase 1). */
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov: number;
}
