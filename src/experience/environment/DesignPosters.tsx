import { Model } from "../models/Model";
import type { AssetId } from "../../assets/assetManifest";

/**
 * The graphic-design wall: a neat scatter of posters hung above the terminal on the angled
 * wall, in the archive station's frame. The wall's front face is 0.476 m behind
 * the station centre (desk half-depth plus the gap, see RoomShell); `x` runs
 * along the wall, `y` is the poster centre above the floor. The artwork is
 * placeholder, swapped later by replacing the poster GLBs.
 */
const WALL_Z = -0.476;
/** `scale` shrinks the poster models (0.62 / 0.56 x 0.36 / 0.36 m) to board-picture size. */
const P = 0.55;
const L = 0.57;
const Q = 0.6;
const POSTERS: { id: AssetId; x: number; y: number; roll: number; scale: number }[] = [
  // Upper row
  { id: "posterPortrait", x: -0.6, y: 1.99, roll: 0.03, scale: P },
  { id: "posterLandscape", x: -0.28, y: 2.04, roll: -0.02, scale: L },
  { id: "posterSquare", x: 0.02, y: 1.98, roll: 0.02, scale: Q },
  { id: "posterPortrait", x: 0.3, y: 2.01, roll: -0.025, scale: P },
  { id: "posterLandscape", x: 0.62, y: 1.97, roll: 0.02, scale: L },
  // Lower row
  { id: "posterSquare", x: -0.55, y: 1.57, roll: -0.02, scale: Q },
  { id: "posterPortrait", x: -0.25, y: 1.55, roll: 0.02, scale: P },
  { id: "posterLandscape", x: 0.1, y: 1.53, roll: 0.015, scale: L },
  { id: "posterSquare", x: 0.45, y: 1.56, roll: -0.02, scale: Q },
];

export function DesignPosters() {
  return (
    <group name="design-posters">
      {POSTERS.map(({ id, x, y, roll, scale }, i) => (
        <group key={i} position={[x, y, WALL_Z + 0.004]} rotation={[0, 0, roll]} scale={scale}>
          <Model id={id} />
        </group>
      ))}
    </group>
  );
}
