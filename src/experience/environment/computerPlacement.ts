import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";

/**
 * Measurements of `pc-90s.glb`, in the model's own frame (~9 cm per unit,
 * before scaling). The model faces -X, so its front is the -X side and the
 * keyboard sits in front of the case. Read from the loaded model's bounding
 * boxes and from an orthographic front render (150 px per unit).
 */
export const PC_MODEL = {
  min: new Vector3(-2.48, 0.07, -2.43),
  max: new Vector3(4.41, 6.01, 4.11),
  /**
   * The CRT's dark glass, centre (y, z) and size. The glass leans back: its
   * surface is x = faceX + y * slope (a plane fitted to the mesh's vertices,
   * ~12 degrees), so a flat overlay must be pitched to match. The real glass
   * also bulges ~2 cm toward the viewer, so the model's own glass is hidden
   * and this plane is the screen: faceX is the fit pulled 0.1 units forward to
   * stay clear of the bezel's recess. `h` is measured along the glass.
   */
  screen: { y: 4.13, z: 0, w: 3.3, h: 2.84, faceX: -0.7321, slope: 0.212 },
  /** Front face of the case, and the centre of the wide lower drive bay. */
  frontX: -0.2,
  slot: { y: 0.667, z: 1.157 },
  /** Footprints on the desk: centre and size (d along x, w along z). */
  caseFoot: { x: 2.1, z: 0, d: 4.62, w: 4.61 },
  keyboardFoot: { x: -1.58, z: 0.03, d: 1.8, w: 4.92 },
  mouseFoot: { x: -1.59, z: 3.4, d: 1.56, w: 1.43 },
};

const DISK_LENGTH = 0.09;
const PROTRUDE = 0.022;

export interface ComputerPlacement {
  /** Model frame to station frame; feed to a group with matrixAutoUpdate off. */
  matrix: Matrix4;
  /** Direction pointing out of the computer's front, in the station frame. */
  outward: Vector3;
  /** Disk centre when seated in the drive, station frame. */
  insertAt: Vector3;
  /** A point in front of the screen, station frame, for the CRT glow. */
  glowAt: Vector3;
  /** Rotation about Y that turns the model's front (-X) to face `outward`. */
  yaw: number;
}

/**
 * Stands the computer on the desk top with its footprint centred on
 * `footprint` (station frame) and its front turned `facing` radians away
 * from +Z. Scaled by the manifest entry.
 */
export function placeComputer(
  footprint: Vector3,
  deskTop: number,
  facing: number,
): ComputerPlacement {
  const scale = assetManifest.pc90s.scale;
  // The model's front is -X; a quarter turn about Y brings it round to +Z.
  const yaw = facing + Math.PI / 2;
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

  // Seated: the disk's far end is inside the case, PROTRUDE sticks out front.
  const insertX = PC_MODEL.frontX - PROTRUDE / scale + DISK_LENGTH / scale / 2;
  return {
    matrix,
    yaw,
    outward: new Vector3(0, 0, 1).applyEuler(new Euler(0, facing, 0)),
    insertAt: new Vector3(insertX, PC_MODEL.slot.y, PC_MODEL.slot.z).applyMatrix4(matrix),
    glowAt: new Vector3(
      PC_MODEL.screen.faceX + PC_MODEL.screen.y * PC_MODEL.screen.slope - 2.2,
      PC_MODEL.screen.y,
      PC_MODEL.screen.z,
    ).applyMatrix4(matrix),
  };
}
