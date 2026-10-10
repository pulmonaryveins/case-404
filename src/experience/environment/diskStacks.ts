import { Vector3 } from "three";
import { DESK_TOP } from "./worldAnchors";

/**
 * The nine disks lie flat on the desk in three rows of three (Development,
 * UI/UX, Video Editing) beside the terminal. Disks are 9 cm square; the pitch
 * is wider than that, so every disk has clear desk around it and its label is
 * fully visible. Station frame; keep the desk's right end free for the lamp.
 */
const ROW_X = { Development: 0.02, "UI/UX": 0.13, "Video Editing": 0.24 } as const;
const FIRST_Z = -0.13;
const PITCH = 0.105;
const THICK = 0.0045;

export type StackRow = keyof typeof ROW_X;

/** Rest position (disk centre) of the disk `slot` places down its row (0 = back). */
export function stackSlot(row: StackRow, slot: number): Vector3 {
  return new Vector3(ROW_X[row], DESK_TOP + THICK / 2, FIRST_Z + slot * PITCH);
}

/**
 * A hovered disk lifts straight up. It stays under the pointer (sliding it
 * sideways moved it out from under the cursor and made it flicker in and out
 * of hover) and the gaps keep it clear of its neighbours.
 */
const POP = new Vector3(0, 0.03, 0);

export const STACK_POP = POP;
