import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";

/**
 * Measurements of `computer-terminal.glb`, in the model's own frame (about
 * 0.37 m per unit, before scaling). The terminal faces +Z. Read from the
 * loaded model's bounding boxes, an orthographic front render (600 px per
 * unit) and rays cast at its front.
 */
export const PC_MODEL = {
  /** The terminal's bounds, without the preview planes the source file shipped with. */
  min: new Vector3(-0.707, 0.055, -0.456),
  max: new Vector3(0.854, 1.137, 0.978),
  /**
   * The CRT glass, centre (x, y) and size. Its surface is z ~0.277 at the
   * edges and bulges to 0.298 in the middle, recessed behind the bezel (z 0.35),
   * so a flat overlay at `z` sits just in front of the bulge. Slightly smaller
   * than the glass so the bezel frames it.
   */
  screen: { x: -0.144, y: 0.693, z: 0.302, w: 0.74, h: 0.49 },
  /**
   * The framed panel right of the screen: a plain flat door (z 0.407) with no
   * opening. `slot` is where a slot mark is drawn on it and where disks go in.
   * Its width is a little over a 3.5in disk at this scale.
   */
  door: { x: 0.6045, frontZ: 0.4069 },
  slot: { y: 0.6, w: 0.27, h: 0.016 },
  /** Footprint on the desk: centre and size (w along x, d along z). */
  caseFoot: { x: 0.0735, z: 0.261, w: 1.561, d: 1.434 },
};

const DISK_LENGTH = 0.09 * assetManifest.floppy.scale;
const PROTRUDE = 0.03;

export interface ComputerPlacement {
  /** Model frame to station frame; feed to a group with matrixAutoUpdate off. */
  matrix: Matrix4;
  /** Direction pointing out of the computer's front, in the station frame. */
  outward: Vector3;
  /** Disk centre when seated in the slot, station frame. */
  insertAt: Vector3;
  /** Rotation about Y applied to the model (its front is already +Z). */
  yaw: number;
}

/**
 * Stands the terminal on the desk top with its footprint centred on
 * `footprint` (station frame) and its front turned `facing` radians away
 * from +Z. Scaled by the manifest entry.
 */
export function placeComputer(
  footprint: Vector3,
  deskTop: number,
  facing: number,
): ComputerPlacement {
  const scale = assetManifest.archiveComputer.scale;
  const yaw = facing;
  const centre = new Vector3(
    (PC_MODEL.min.x + PC_MODEL.max.x) / 2,
    0,
    (PC_MODEL.min.z + PC_MODEL.max.z) / 2,
  );
  const rotate = new Matrix4().makeRotationFromQuaternion(
    new Quaternion().setFromEuler(new Euler(0, yaw, 0)),
  );
  const matrix = new Matrix4()
    .makeTranslation(footprint.x, deskTop, footprint.z)
    .multiply(rotate)
    .multiply(new Matrix4().makeScale(scale, scale, scale))
    .multiply(new Matrix4().makeTranslation(-centre.x, -PC_MODEL.min.y, -centre.z));

  // Seated: the disk's far end is behind the door, PROTRUDE sticks out front.
  const insertZ = PC_MODEL.door.frontZ + PROTRUDE / scale - DISK_LENGTH / scale / 2;
  return {
    matrix,
    yaw,
    outward: new Vector3(0, 0, 1).applyEuler(new Euler(0, facing, 0)),
    insertAt: new Vector3(PC_MODEL.door.x, PC_MODEL.slot.y, insertZ).applyMatrix4(matrix),
  };
}
