import type { CameraAnchor, CameraAnchorId } from "./cameraTypes";
import { DEFAULT_CAMERA } from "../../lib/three";

/**
 * Semantic camera states, keyed by anchor id, so scene code never scatters
 * magic coordinates. roomOverview through dossierOpen are real (opening
 * sequence); the remaining chapter anchors are still placeholders.
 */
export const cameraAnchors: Record<CameraAnchorId, CameraAnchor> = {
  // Phase 1B.1 (approved): frontal opening composition. Nearly head-on to
  // the desk and board, small offset so the shot isn't mathematically perfect.
  roomOverview: {
    id: "roomOverview",
    position: [0.14, 1.4, 0.3],
    target: [0.02, 1.05, -3.6],
    fov: 40,
  },
  caseOpened: {
    id: "caseOpened",
    position: [0, 1.6, 6],
    target: [0, 1, 0],
    fov: DEFAULT_CAMERA.fov,
  },
  // Phase 4A opening sequence. Board face sits at world z -3.77, map
  // centre / case file around (-0.05, 1.45). Dossier on the desk at
  // (0.172, 0.79, -2.07), opening to its left.
  boardApproach: {
    id: "boardApproach",
    position: [-0.12, 1.5, -1.25],
    target: [-0.08, 1.44, -3.76],
    fov: 40,
  },
  evidenceBoard: {
    id: "evidenceBoard",
    position: [0.08, 1.52, -1.72],
    target: [-0.02, 1.47, -3.76],
    fov: 40,
  },
  caseFile: {
    id: "caseFile",
    position: [-0.05, 1.47, -2.72],
    target: [-0.05, 1.45, -3.77],
    fov: 40,
  },
  // Pulls back in front of the desk (z > -1.63) before tilting down, so the
  // camera never looks into the gap behind the desk.
  leaveBoard: {
    id: "leaveBoard",
    position: [0.18, 1.5, -1.3],
    target: [0.32, 1.02, -2.3],
    fov: 40,
  },
  subjectProfile: {
    id: "subjectProfile",
    // Start lifting over the desk before the cover opens.
    position: [0.055, 1.34, -1.7],
    target: [0.035, 0.805, -2.035],
    fov: 40,
  },
  dossierOpen: {
    id: "dossierOpen",
    // ~76 degrees above the paper: readable text with a little depth for
    // the clips and stacked sheets. Aim at the spread including its tabs.
    position: [-0.051, 1.37, -1.91],
    target: [-0.051, 0.805, -2.035],
    fov: 40,
  },
  education: { id: "education", position: [2, 1.4, 2], target: [2, 1, 0], fov: DEFAULT_CAMERA.fov },
  experience: {
    id: "experience",
    position: [2, 1.4, 2],
    target: [2, 1, 0],
    fov: DEFAULT_CAMERA.fov,
  },
  // Deeper-office zones: placeholders until each zone is blocked out.
  // Second desk in the back-right corner, turned ~38 degrees toward the room
  // (STATION_POS / STATION_YAW in ArchiveStation). Looks along the desk's own
  // front normal, the PC on the left and the floppy disks on the right.
  digitalArchive: {
    id: "digitalArchive",
    position: [1.86, 1.62, -1.89],
    target: [2.64, 0.88, -2.87],
    fov: 40,
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
