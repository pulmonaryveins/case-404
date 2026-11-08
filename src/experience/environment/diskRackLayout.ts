import { Euler, Quaternion, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { DESK_TOP } from "./worldAnchors";

/**
 * A small tiered floppy-disk rack on the archive desk: `TIERS` stepped tiers
 * of three columns, filled as an even block (see `PLAN`): Development on the
 * left, UI/UX at the front of the middle with Development's overflow behind,
 * Video Editing on the right. Disks stand leaning back a little, each tier
 * higher than the one in front, so every label shows. Built from boxes and
 * extruded side profiles in the floor's tileable PBR wood (colour, normal and
 * roughness maps), with paper category labels on the front lip.
 *
 * Rack frame: origin at the front edge's centre on the desk, x right, y up,
 * +z toward the viewer. `rackSlot` turns a disk's column/tier into a pose in
 * the station frame, which is what ArchiveStation and FloppyDisk animate from.
 */

export type RackColumn = "Development" | "UI/UX" | "Video Editing";
/** The tags on the front ledge, one per column. */
export const COLUMN_TAGS = ["DEV", "UI / UX + DEV", "VIDEO"];

/**
 * Each category's slots, [column, tier] in project order. Disks past a list
 * go on behind the category's last slot's column.
 */
const PLAN: Record<RackColumn, [number, number][]> = {
  Development: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
  ],
  "UI/UX": [
    [1, 0],
    [1, 1],
  ],
  "Video Editing": [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
};

/** N.I.G.E.L.'s red disk closes the block, back right. */
export const NIGEL_SLOT: [number, number] = [2, 3];

/** Where the rack's front-centre sits on the desk (station frame). */
export const RACK_AT = new Vector3(0.17, DESK_TOP, 0.03);

/** Disk: the floppy model is 9 cm square, 4 mm thick, shown at its manifest scale. */
export const DISK = 0.09 * assetManifest.floppy.scale;
export const DISK_T = 0.004 * assetManifest.floppy.scale;
/** Disks lean back this far from upright. */
export const TILT = MathRad(14);

export const WALL = 0.008; // side panels
export const FIN = 0.004; // column dividers
export const SIDE_GAP = 0.003; // air either side of a disk in its column
export const PITCH = DISK + 2 * SIDE_GAP + FIN;
export const INNER_W = 3 * PITCH - FIN;
export const WIDTH = INNER_W + 2 * WALL;

export const FRONT = 0.014; // ledge in front of the first tier, carrying the labels
export const BASE_H = 0.014; // first tier floor above the desk
export const STEP_H = 0.04;
export const STEP_D = 0.04;
export const LIP_T = 0.004;
export const LIP_H = 0.012;
export const BACK_T = 0.006;
/** Extra room behind the back tier, so its leaning disks clear the back board. */
export const REAR_AIR = 0.008;
/** Disks a column holds, front tier to back (each tier a step higher). */
export const TIERS = 4;
export const DEPTH = FRONT + TIERS * STEP_D + REAR_AIR + BACK_T;
/** How far the side panels and dividers rise above each tier's floor. */
export const SIDE_RISE = 0.04;
export const FIN_RISE = 0.026;

function MathRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export const tierFloor = (tier: number) => BASE_H + tier * STEP_H;
/** z of the front edge of a tier's floor. */
export const tierFront = (tier: number) => -(FRONT + tier * STEP_D);
export const columnX = (col: number) => (col - 1) * PITCH;

/**
 * A standing disk: leaning back by TILT, front face to the viewer, and turned
 * half round in its own plane so its paper label is at the top (the model has
 * it below centre, where the tier in front would hide it). FloppyDisk turns
 * the label itself the other way so the text still reads upright.
 */
export const RACK_DISK_QUAT = new Quaternion()
  .setFromEuler(new Euler(-TILT, 0, 0))
  .multiply(new Quaternion().setFromEuler(new Euler(0, 0, Math.PI)));

/** Rest pose (station frame) of a category's `n`th disk. */
export function rackSlot(category: RackColumn, n: number) {
  const plan = PLAN[category];
  const last = plan[plan.length - 1];
  const [col, tier] = plan[n] ?? [last[0], last[1] + n - plan.length + 1];
  return rackPose(col, tier);
}

/** Rest pose (station frame) of the disk in `col`, `tier` places back. */
export function rackPose(col: number, tier: number) {
  const up = new Vector3(0, Math.cos(TILT), -Math.sin(TILT));
  const bottom = new Vector3(
    columnX(col),
    tierFloor(tier),
    tierFront(tier) - LIP_T - 0.002 - DISK_T / 2,
  );
  const position = bottom.addScaledVector(up, DISK / 2).add(RACK_AT);
  return { position, quaternion: RACK_DISK_QUAT.clone() };
}
