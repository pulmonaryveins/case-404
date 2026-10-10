import type { Vector3Tuple } from "../types/common";
import { cameraAnchors } from "../experience/camera/cameraAnchors";

/**
 * Mutable, high-frequency animation state shared between the scroll
 * timeline (GSAP, outside the Canvas) and the scene (read in useFrame).
 * Deliberately NOT React or Zustand state: it changes every frame.
 */
export const storyRig = {
  camera: [...cameraAnchors.roomOverview.position] as Vector3Tuple,
  target: [...cameraAnchors.roomOverview.target] as Vector3Tuple,
  /** 0 = closed, 1 = cover fully open. */
  dossierOpen: 0,
  /** 0 = profile pages hidden, 1 = fully revealed. */
  profileReveal: 0,
  /** Zoom onto the archive terminal's screen: eased 0..1, and where the camera ends up. */
  screenFocus: {
    amount: 0,
    on: false,
    camera: [0, 0, 0] as Vector3Tuple,
    target: [0, 0, 0] as Vector3Tuple,
  },
};
