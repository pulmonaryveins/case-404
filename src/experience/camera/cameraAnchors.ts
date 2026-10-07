import type { CameraAnchor, CameraAnchorId } from "./cameraTypes";
import { DEFAULT_CAMERA } from "../../lib/three";

/**
 * Semantic camera states, keyed by anchor id, so scene code never scatters
 * magic coordinates. Every position/target below is a Phase 0 placeholder —
 * real values are determined after the real GLBs are audited and placed
 * (Phase 1+). Do not treat these numbers as final.
 */
export const cameraAnchors: Record<CameraAnchorId, CameraAnchor> = {
  // Phase 1B.1 (approved): frontal opening composition. Nearly head-on to
  // the desk and board, small offset so the shot isn't mathematically perfect.
  roomOverview: {
    id: "roomOverview",
    position: [0.14, 1.4, 1.0],
    target: [0.02, 1.05, -3.6],
    fov: 40,
  },
  caseOpened: {
    id: "caseOpened",
    position: [0, 1.6, 6],
    target: [0, 1, 0],
    fov: DEFAULT_CAMERA.fov,
  },
  evidenceBoard: {
    id: "evidenceBoard",
    position: [0, 1.5, 3],
    target: [0, 1.2, -2],
    fov: DEFAULT_CAMERA.fov,
  },
  subjectProfile: {
    id: "subjectProfile",
    position: [2, 1.4, 2],
    target: [2, 1, 0],
    fov: DEFAULT_CAMERA.fov,
  },
  education: { id: "education", position: [2, 1.4, 2], target: [2, 1, 0], fov: DEFAULT_CAMERA.fov },
  experience: {
    id: "experience",
    position: [2, 1.4, 2],
    target: [2, 1, 0],
    fov: DEFAULT_CAMERA.fov,
  },
  // Deeper-office zones: placeholders until each zone is blocked out.
  digitalArchive: {
    id: "digitalArchive",
    position: [-2, 1.4, 2],
    target: [-2, 1, 0],
    fov: DEFAULT_CAMERA.fov,
  },
  creativeEvidence: {
    id: "creativeEvidence",
    position: [2, 1.4, 2],
    target: [2, 1, 0],
    fov: DEFAULT_CAMERA.fov,
  },
  credentials: {
    id: "credentials",
    position: [2, 1.4, 2],
    target: [2, 1, 0],
    fov: DEFAULT_CAMERA.fov,
  },
  contact: { id: "contact", position: [0, 1.6, 4], target: [0, 1, 0], fov: DEFAULT_CAMERA.fov },
  caseSolved: {
    id: "caseSolved",
    position: [0, 2.2, 9],
    target: [0, 1, 0],
    fov: DEFAULT_CAMERA.fov,
  },
};
