import type { Group } from "three";
import { useExperienceStore } from "../../store/useExperienceStore";
import { frontOf, useFocusable } from "../camera/focus";

/** The wall's pieces can be inspected while the camera is on it. */
const inspectable = () => useExperienceStore.getState().currentChapter === "GRAPHIC_DESIGN";

/**
 * Click-to-inspect for one piece on this wall (the shelf's certificates and
 * model, and the design posters above it): the camera comes square-on to the
 * wall (the station frame's +z, toward the room) and frames the piece.
 * Click again, or Esc, to zoom back out.
 */
export function useWallInspect(target: () => Group | null, label: string, fill: number) {
  return useFocusable(inspectable, {
    view: "front",
    target,
    label,
    fill,
    get front() {
      return frontOf(target()?.parent ?? null);
    },
  });
}
