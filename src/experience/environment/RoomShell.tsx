import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  type BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Mesh,
  PlaneGeometry,
  RepeatWrapping,
  type MeshStandardMaterial,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
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
      <CornerFillets />

      <RightWall />

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
 * The plaster modules' UV layout, measured from the GLB's front face: one
 * texture repeat per metre, with u running UP the wall and v ALONG it
 * (rotated against the usual layout). Surfaces built in code remap their
 * plain 0..1 UVs to match, so the grain is the same size and direction as on
 * the modules. Getting this backwards stretched the grain ~10x and the curves
 * read as smooth paint.
 */
function plasterUVs(geometry: BufferGeometry, w: number, h: number) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const along = uv.getX(i) * w;
    const up = uv.getY(i) * h;
    uv.setXY(i, up, along);
  }
  return geometry;
}

/** The plaster modules' own material, double-sided, for the walls built in code. */
function usePlaster() {
  const { materials } = useGLTF(assetManifest.plasterWall.url);
  const plaster = useMemo(() => {
    // Model gives the modules the manifest colour (map dropped) when they
    // mount, which can be after this clone: apply it here too, or these
    // surfaces keep the GLB's raw dark-green base colour.
    const m = (Object.values(materials)[0] as MeshStandardMaterial).clone();
    m.map = null;
    m.color.set(assetManifest.plasterWall.color);
    m.side = DoubleSide;
    return m;
  }, [materials]);
  useEffect(() => () => plaster.dispose(), [plaster]);
  return plaster;
}

/**
 * Right side wall, closing the frame edge (the left wall, with the window, is
 * in MoonWindow). In the plaster, as the angled corner wall it meets: a plain
 * colour there showed as a lighter strip down the corner.
 */
function RightWall() {
  const plaster = usePlaster();
  const geometry = useMemo(() => plasterUVs(new PlaneGeometry(7, ROOM_HEIGHT), 7, ROOM_HEIGHT), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh
      rotation={[0, -Math.PI / 2, 0]}
      position={[3.6, ROOM_HEIGHT / 2, -1]}
      geometry={geometry}
      material={plaster}
      receiveShadow
    />
  );
}

/** Radius of the rounded inside corners where the angled walls meet the room. */
const FILLET_RADIUS = 0.35;
const ROOM_HEIGHT = 3.44;
const SKIRTING = { height: 0.14, depth: 0.02 };

/** A wall's front face as a plane in XZ: inward normal (into the room) and offset. */
interface WallPlane {
  n: [number, number];
  d: number;
}

/**
 * A rounded inside corner between two walls: the arc of radius r tangent to
 * both front faces, as a cylinder angle range centred where both offset
 * planes meet. Returns the centre and the arc's start/length in
 * CylinderGeometry's theta (x = sin, z = cos).
 */
function fillet(a: WallPlane, b: WallPlane, r: number) {
  const [a0, a1] = a.n;
  const [b0, b1] = b.n;
  const det = a0 * b1 - a1 * b0;
  const da = a.d + r;
  const db = b.d + r;
  const cx = (da * b1 - db * a1) / det;
  const cz = (a0 * db - b0 * da) / det;
  const ta = Math.atan2(-a0, -a1);
  const tb = Math.atan2(-b0, -b1);
  let len = tb - ta;
  len = Math.atan2(Math.sin(len), Math.cos(len));
  return {
    centre: [cx, cz] as [number, number],
    start: len >= 0 ? ta : tb,
    length: Math.abs(len),
  };
}

/** Front face of the right corner wall (the same placement CornerWall uses). */
function cornerPlane(): WallPlane {
  const station = worldAnchors.digitalArchive!;
  const n: [number, number] = [Math.sin(ARCHIVE_YAW), Math.cos(ARCHIVE_YAW)];
  const along = [n[1], -n[0]];
  const back = DESK_HALF_DEPTH + DESK_WALL_GAP;
  const px = station[0] - n[0] * back + along[0] * CORNER_SHIFT;
  const pz = station[2] - n[1] * back + along[1] * CORNER_SHIFT;
  return { n, d: n[0] * px + n[1] * pz };
}

/**
 * Softens the four vertical seams where the angled corner walls meet the back
 * wall and the side walls: a shallow cove in the walls' own plaster material (and a matching
 * curved run of skirting), instead of a knife-edge crease.
 */
function CornerFillets() {
  const plaster = usePlaster();

  const coves = useMemo(() => {
    const corner = cornerPlane();
    const right: WallPlane = { n: [-1, 0], d: -3.6 };
    const back: WallPlane = { n: [0, 1], d: -3.8 };
    const pairs: [WallPlane, WallPlane][] = [
      [back, corner],
      [corner, right],
    ];
    const mirror = (p: WallPlane): WallPlane => ({ n: [-p.n[0], p.n[1]], d: p.d });
    // The left corner is the right one mirrored in x; the left wall is at -3.6.
    const all = [...pairs, ...pairs.map(([a, b]) => [mirror(a), mirror(b)] as const)];
    return all.map(([a, b]) => {
      const f = fillet(a, b, FILLET_RADIUS);
      const wall = new CylinderGeometry(
        FILLET_RADIUS,
        FILLET_RADIUS,
        ROOM_HEIGHT,
        12,
        1,
        true,
        f.start,
        f.length,
      );
      plasterUVs(wall, FILLET_RADIUS * f.length, ROOM_HEIGHT);
      const skirt = FILLET_RADIUS - SKIRTING.depth;
      const skirting = new CylinderGeometry(
        skirt,
        skirt,
        SKIRTING.height,
        12,
        1,
        true,
        f.start,
        f.length,
      );
      return { centre: f.centre, wall, skirting };
    });
  }, []);

  useEffect(
    () => () => {
      for (const c of coves) {
        c.wall.dispose();
        c.skirting.dispose();
      }
    },
    [coves],
  );

  return (
    <group name="corner-fillets">
      {coves.map(({ centre, wall, skirting }, i) => (
        <group key={i} position={[centre[0], 0, centre[1]]}>
          <mesh
            geometry={wall}
            material={plaster}
            position={[0, ROOM_HEIGHT / 2, 0]}
            receiveShadow
          />
          <mesh geometry={skirting} position={[0, SKIRTING.height / 2, 0]} receiveShadow>
            <meshStandardMaterial color="#26241f" roughness={0.6} metalness={0} side={DoubleSide} />
          </mesh>
        </group>
      ))}
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
