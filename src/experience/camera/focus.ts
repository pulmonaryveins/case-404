import { Box3, MathUtils, Quaternion, Vector3, type Camera, type Object3D } from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useExperienceStore } from "../../store/useExperienceStore";
import { storyRig } from "../../story/storyRig";
import { hoverCursor, useCursor } from "../cursor/cursorStore";

const box = new Box3();
const size = new Vector3();
const UP = new Vector3(0, 1, 0);

interface FocusOptions {
  /** How much bigger than the item the frame is (1 = edge to edge). */
  fill?: number;
  /**
   * Toward the reader in world space: the camera leans a little this way, so
   * the item reads the same way up as from the scene shot (and a camera
   * looking straight down never has an undefined "up").
   */
  front?: Vector3;
  kind?: "screen" | "photo";
  /** Cursor label while hovering the item. */
  label?: string;
}

/**
 * Flies the camera to look straight down onto a flat item lying on a desk
 * (a print, a page): above its centre, far enough that its larger side fits
 * the frame. The close-up rides on the same rig as the terminal screen
 * (CameraRig blends to it); Back / Escape returns to the story camera.
 */
export function focusOnFlat(
  object: Object3D,
  camera: Camera,
  aspect: number,
  { fill = 1.5, front = new Vector3(0, 0, 1), kind = "photo" }: FocusOptions = {},
) {
  object.updateWorldMatrix(true, false);
  box.setFromObject(object);
  const centre = box.getCenter(new Vector3());
  box.getSize(size);
  const fov = "fov" in camera ? (camera.fov as number) : 40;
  // Flat on the desk: the footprint is x by z. Fit the long side, and keep it
  // inside a portrait viewport too.
  const extent = Math.max(size.x, size.z) * fill;
  const dist = Math.max(extent, extent / aspect) / 2 / Math.tan(MathUtils.degToRad(fov / 2));
  const at = centre
    .clone()
    .addScaledVector(UP, dist)
    .addScaledVector(front, dist * 0.15);
  at.toArray(storyRig.screenFocus.camera);
  centre.toArray(storyRig.screenFocus.target);
  useExperienceStore.getState().setScreenFocused(true, kind);
}

/** World direction of an object's local +Z (its parent's "front"). */
export function frontOf(object: Object3D | null) {
  const q = object?.getWorldQuaternion(new Quaternion()) ?? new Quaternion();
  return new Vector3(0, 0, 1).applyQuaternion(q);
}

/**
 * Pointer handlers that make a mesh a "click to look closer" target while
 * `enabled()` is true (checked at event time, so it can read per-frame state).
 */
export function useFocusable(enabled: () => boolean, options?: FocusOptions) {
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (!enabled()) return;
      e.stopPropagation();
      useCursor.getState().clear();
      focusOnFlat(e.object, camera, aspect, options);
    },
    ...hoverCursor("inspect", options?.label ?? "Inspect", enabled),
  };
}
