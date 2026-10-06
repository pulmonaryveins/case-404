import type { CameraAnchorId } from "../experience/camera/cameraTypes";

export type ChapterId =
  | "CASE_OPENED"
  | "EVIDENCE"
  | "SUBJECT_PROFILE"
  | "EDUCATION"
  | "EXPERIENCE"
  | "PROJECT_ARCHIVE"
  | "CREDENTIALS"
  | "CONTACT"
  | "CASE_SOLVED";

export interface Chapter {
  id: ChapterId;
  label: string;
  order: number;
  cameraAnchor: CameraAnchorId;
}
