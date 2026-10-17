import { MathUtils } from "three";

/** The wall light over the board, and the two desk lamps. */
export type LampId = "wall" | "main" | "archive";

/**
 * The colour every lamp's light shares (a warm tungsten), so the desk lamps
 * and the wall light match: the same bulb, wherever it hangs. Each lamp's
 * glow (its emissive bulb or strip) is tinted from it too.
 */
export const LAMP_COLOUR = "#ffc78f";

/** 0 (off) to 1 (on) per lamp, eased toward its switch each frame. */
export const lampLit: Record<LampId, number> = { wall: 0, main: 1, archive: 0 };

/**
 * Switch position per lamp. The story starts with only the main desk lamp on;
 * the archive lamp comes on when the story reaches its desk (LampStory sets
 * these on every chapter change). The wall light is optional: it starts off
 * and the viewer clicks it on, and the story never touches it. The viewer can
 * click any lamp to switch it, until the story next moves on.
 */
export const lampOn: Record<LampId, boolean> = { wall: false, main: true, archive: false };

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
