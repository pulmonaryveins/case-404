import { MathUtils } from "three";
import { useExperienceStore } from "../../store/useExperienceStore";
import type { ChapterId } from "../../story/storyTypes";

export type LampId = "main" | "archive";

/** Chapters spent at the archive desk and its poster wall. */
const AT_ARCHIVE: ChapterId[] = ["DIGITAL_ARCHIVE", "GRAPHIC_DESIGN"];

/** 0 (off) to 1 (on) per lamp, eased toward its scene each frame. */
export const lampLit: Record<LampId, number> = { main: 1, archive: 0 };

/**
 * Each desk lamp burns only while the camera is at its desk: the working
 * desk's goes out as the story crosses to the archive, and the archive lamp
 * comes on when it arrives. Call once per frame per lamp; returns the level.
 */
export function stepLamp(id: LampId, dt: number): number {
  const archive = AT_ARCHIVE.includes(useExperienceStore.getState().currentChapter);
  const target = (id === "archive") === archive ? 1 : 0;
  lampLit[id] = MathUtils.damp(lampLit[id], target, 4, dt);
  return lampLit[id];
}
