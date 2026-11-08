import type { CameraAnchorId } from "../experience/camera/cameraTypes";

export type ChapterId =
  | "CASE_OPENED"
  | "EVIDENCE_BOARD"
  | "SUBJECT_PROFILE"
  | "EDUCATION"
  | "EXPERIENCE"
  | "DIGITAL_ARCHIVE"
  | "GRAPHIC_DESIGN"
  | "CREATIVE_EVIDENCE"
  | "CREDENTIALS"
  | "CONTACT"
  | "CASE_SOLVED";

/** Physical office areas the camera travels between (ARCHITECTURE.md §2). */
export type OfficeZone =
  "mainInvestigation" | "digitalArchive" | "creativeEvidence" | "credentialEvidence";

export interface Chapter {
  id: ChapterId;
  label: string;
  order: number;
  zone: OfficeZone;
  cameraAnchor: CameraAnchorId;
}
