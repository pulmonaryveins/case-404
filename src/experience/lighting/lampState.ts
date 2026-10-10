import { MathUtils } from "three";

export type LampId = "main" | "archive";

/** 0 (off) to 1 (on) per lamp, eased toward its scene each frame. */
export const lampLit: Record<LampId, number> = { main: 1, archive: 1 };

/**
 * Switch position per lamp. Both start on and stay on through the story (a
 * lamp that went out by itself as the camera moved read as a glitch); only
 * the viewer turns one off, by clicking it.
 */
export const lampOn: Record<LampId, boolean> = { main: true, archive: true };

export function toggleLamp(id: LampId) {
  lampOn[id] = !lampOn[id];
}

/**
 * Eases each lamp toward its switch: quick, like a filament, but not a hard
 * cut. Call once per frame per lamp; returns the level.
 */
export function stepLamp(id: LampId, dt: number): number {
  lampLit[id] = MathUtils.damp(lampLit[id], lampOn[id] ? 1 : 0, 12, dt);
  return lampLit[id];
}
