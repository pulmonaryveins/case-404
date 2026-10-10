import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, RepeatWrapping, type MeshStandardMaterial } from "three";
import { Model } from "../models/Model";
import { ARCHIVE_YAW, worldAnchors } from "./worldAnchors";

const FLOOR_URL = "/models/case-404/environment/architecture/floors/dark-wood-floor.glb";
const FLOOR_SIZE = 12;
/** One texture tile ≈ 1.5m: ten boards across ≈ 15cm boards. */
const FLOOR_TILE_METRES = 1.5;
// Measured module width; a larger step leaves visible hairline gaps.
const WALL_MODULE_WIDTH = 1.0315;
/** Seven modules span the 7.2m between the side walls. */
const WALL_MODULE_OFFSETS = [-3, -2, -1, 0, 1, 2, 3].map((i) => i * WALL_MODULE_WIDTH);

/**
 * Room architecture for the opening: plaster wall modules (GLB, repeated)
 * behind the board, weathered-board floor (material from the board GLB, tiled across a
 * room-sized plane), and temporary side walls/ceiling that the new assets
 * don't replace.
 */
export function RoomShell() {
  return (
    <group name="room-shell">
      <BoardFloor />
      {WALL_MODULE_OFFSETS.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Model id="plasterWall" />
        </group>
      ))}

      {/* Temporary: painted skirting board along the back wall (none of the
          architecture assets includes one). */}
      <mesh position={[0, 0.07, -3.79]} castShadow receiveShadow>
        <boxGeometry args={[7.2, 0.14, 0.02]} />
        <meshStandardMaterial color="#26241f" roughness={0.6} metalness={0} />
      </mesh>

      <CornerWall />
      <CornerWall side="left" />

      {/* Temporary: right side wall closes the frame edge (the left wall, with the
          window, is in MoonWindow). */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[3.6, 1.72, -1]} receiveShadow>
        <planeGeometry args={[7, 3.44]} />
        <meshStandardMaterial color="#2e2c28" roughness={0.95} metalness={0} />
      </mesh>

      {/* Temporary ceiling at the wall slab's authored height. */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.44, -1.5]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#1d1917" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

/**
 * An angled wall across the back-right corner, parallel to the archive desk's
 * back edge (6 cm behind it), so the desk sits flush against a wall instead of
 * floating in front of a corner. Two plaster modules, as on the back wall; its
 * ends run into the back wall and the right wall. Built in the back wall's
 * own frame (front face at local z -3.80) and then turned and moved.
 */
const DESK_HALF_DEPTH = 0.416;
const DESK_WALL_GAP = 0.06;
/** Slides the wall along itself so it spans corner to corner evenly. */
const CORNER_SHIFT = 0.08;

function CornerWall({ side = "right" }: { side?: "left" | "right" }) {
  const mirror = side === "left" ? -1 : 1;
  const station = worldAnchors.digitalArchive!;
  const n = [Math.sin(ARCHIVE_YAW), Math.cos(ARCHIVE_YAW)];
  const along = [n[1], -n[0]];
  const back = DESK_HALF_DEPTH + DESK_WALL_GAP;
  // A point on the wall's front face, then the group origin that puts the
  // module frame's front plane (local z -3.80) there.
  const cx = station[0] - n[0] * back + along[0] * CORNER_SHIFT;
  const cz = station[2] - n[1] * back + along[1] * CORNER_SHIFT;
  return (
    <group
      name={`${side}-corner-wall`}
      position={[mirror * (cx + 3.8 * n[0]), 0, cz + 3.8 * n[1]]}
      rotation={[0, mirror * ARCHIVE_YAW, 0]}
    >
      {[-0.5, 0.5].map((i) => (
        <group key={i} position={[i * WALL_MODULE_WIDTH, 0, 0]}>
          {/* Left corner is a shadow receiver, not an occluder: retain the
              existing moon/window projection through the original opening. */}
          <Model id="plasterWall" castShadow={side === "right"} />
        </group>
      ))}
      <mesh position={[0, 0.07, -3.79]} castShadow={side === "right"} receiveShadow>
        <boxGeometry args={[2 * WALL_MODULE_WIDTH, 0.14, 0.02]} />
        <meshStandardMaterial color="#26241f" roughness={0.6} metalness={0} />
      </mesh>
    </group>
  );
}

/**
 * The floor GLB carries only a tileable board material (on a 1x1 quad),
 * which is tiled across a room-sized plane.
 */
function BoardFloor() {
  const { scene } = useGLTF(FLOOR_URL);
  const material = useMemo(() => {
    let source: MeshStandardMaterial | undefined;
    scene.traverse((o) => {
      if (!source && o instanceof Mesh) source = o.material as MeshStandardMaterial;
    });
    const mat = source!.clone();
    const repeat = FLOOR_SIZE / FLOOR_TILE_METRES;
    for (const tex of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap, mat.aoMap]) {
      if (!tex) continue;
      tex.wrapS = tex.wrapT = RepeatWrapping;
      tex.repeat.set(repeat, repeat);
      // Boards are horizontal in the texture; turn them to run away from
      // the camera so they read as floor, not steps.
      tex.center.set(0.5, 0.5);
      tex.rotation = Math.PI / 2;
    }
    // Warm brown tint (near-white, so it lifts rather than darkens) over the very dark boards, so the floor sits with the desk
    // and lamp light instead of reading as cold grey.
    mat.color.set("#ffd2a0");
    return mat;
  }, [scene]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.5]} material={material} receiveShadow>
      <planeGeometry args={[FLOOR_SIZE, FLOOR_SIZE]} />
    </mesh>
  );
}
