import { Vector3 } from "three";
import { DESK_TOP } from "./worldAnchors";

/**
 * The six disks lie flat on the desk in two neat stacks, Development and
 * UI/UX, side by side beside the terminal. Within a stack the first project is
 * on top and each one below steps toward the viewer, so a strip of every
 * label shows. Station frame; keep the desk's right end free for the lamp.
 */
const STACK_X = { Development: 0.04, "UI/UX": 0.19 } as const;
const STACK_Z = -0.07;
/** Disk thickness (1.3x) and the forward step per level down the stack. */
const THICK = 0.0045;
const STEP = 0.05;

export type StackRow = keyof typeof STACK_X;

/** Rest position (disk centre) of the disk `slot` places down its stack (0 = top). */
export function stackSlot(row: StackRow, slot: number): Vector3 {
  return new Vector3(
    STACK_X[row],
    DESK_TOP + THICK * (2 - slot) + THICK / 2,
    STACK_Z + slot * STEP,
  );
}

/**
 * A hovered disk slides out sideways, away from the other stack, staying level
 * so it passes under the disks above it. Lifting it up or forward put it over
 * its neighbours' labels in the camera's downward view.
 */
const POP = {
  Development: new Vector3(-0.07, 0, 0),
  "UI/UX": new Vector3(0.07, 0, 0),
} as const;

export const stackPop = (row: StackRow): Vector3 => POP[row];
