import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  BoxGeometry,
  type BufferGeometry,
  CanvasTexture,
  ExtrudeGeometry,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  type Texture,
} from "three";
import { createPaperBump } from "../surfaces/paperFinish";
import {
  COLUMNS,
  COLUMN_TAGS,
  RACK_AT,
  WALL,
  FIN,
  PITCH,
  INNER_W,
  WIDTH,
  FRONT,
  STEP_D,
  LIP_T,
  LIP_H,
  BACK_T,
  REAR_AIR,
  DEPTH,
  TIERS,
  SIDE_RISE,
  FIN_RISE,
  tierFloor,
  tierFront,
} from "./diskRackLayout";

/** The rack itself; its layout and disk poses live in diskRackLayout.ts. */
/* ------------------------------------------------------------------ */
/* Wood: the floor's tileable boards, mapped so a piece sits in a board */
/* ------------------------------------------------------------------ */

/**
 * The floor texture is 20 boards across u (a seam every 0.05), each running
 * the full length of v. A piece gets a UV patch inside one board, with the
 * grain along `grain`, so no plank seam crosses it. Grain is scaled up only as
 * much as the piece's width needs to fit in a board.
 */
const BOARD = 0.05;
const BOARD_PAD = 0.004;
const UV_PER_M = 0.6;

type Axis = 0 | 1 | 2;

function woodUVs(geometry: BufferGeometry, grain: Axis, board: number) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const min = [box.min.x, box.min.y, box.min.z];
  const size = [box.max.x - box.min.x, box.max.y - box.min.y, box.max.z - box.min.z];
  const across = Math.max(...size.filter((_, i) => i !== grain));
  const k = Math.min(UV_PER_M, (BOARD - 2 * BOARD_PAD) / across);
  const u0 = (board % 20) * BOARD + BOARD_PAD;
  const v0 = (board * 0.37) % 1;

  const pos = geometry.getAttribute("position");
  const nrm = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  const p = [0, 0, 0];
  for (let i = 0; i < pos.count; i++) {
    p[0] = pos.getX(i);
    p[1] = pos.getY(i);
    p[2] = pos.getZ(i);
    const n = [Math.abs(nrm.getX(i)), Math.abs(nrm.getY(i)), Math.abs(nrm.getZ(i))];
    const face: Axis = n[0] >= n[1] && n[0] >= n[2] ? 0 : n[1] >= n[2] ? 1 : 2;
    // On end-grain faces the grain axis is the normal: use the other two.
    const along: Axis = grain !== face ? grain : ([0, 1, 2] as Axis[]).find((a) => a !== face)!;
    const side = ([0, 1, 2] as Axis[]).find((a) => a !== face && a !== along)!;
    uv.setXY(i, u0 + (p[side] - min[side]) * k, v0 + (p[along] - min[along]) * k);
  }
  uv.needsUpdate = true;
  return geometry;
}

function box(w: number, h: number, d: number, at: [number, number, number], grain: Axis) {
  return { geometry: new BoxGeometry(w, h, d).translate(...at), grain };
}

/** Stepped side profile (z back, y up) extruded `thick` along x, starting at x0. */
function profile(rise: number, thick: number, x0: number) {
  const s = new Shape();
  // Shape x = distance back from the front edge, shape y = height.
  const step = (t: number) => FRONT + (t + 1) * STEP_D;
  s.moveTo(0, 0);
  s.lineTo(0, tierFloor(0) + rise);
  for (let t = 0; t < TIERS - 1; t++) {
    s.lineTo(step(t), tierFloor(t) + rise);
    s.lineTo(step(t), tierFloor(t + 1) + rise);
  }
  s.lineTo(DEPTH, tierFloor(TIERS - 1) + rise);
  s.lineTo(DEPTH, 0);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: thick, bevelEnabled: false });
  // Shape x -> -z (back), extrusion z -> +x.
  g.rotateY(Math.PI / 2);
  g.translate(x0, 0, 0);
  return g;
}

function useRackWood() {
  const { scene } = useGLTF(FLOOR_URL);
  const material = useMemo(() => {
    let source: MeshStandardMaterial | undefined;
    scene.traverse((o) => {
      if (!source && o instanceof Mesh) source = o.material as MeshStandardMaterial;
    });
    const mat = source!.clone();
    // The floor tiles and turns its (shared) textures; the rack needs them
    // untransformed, so it has its own copies of the texture objects.
    const own = (tex: Texture | null) => {
      if (!tex) return null;
      const t = tex.clone();
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(1, 1);
      t.offset.set(0, 0);
      t.rotation = 0;
      t.anisotropy = 8;
      t.needsUpdate = true;
      return t;
    };
    mat.map = own(mat.map);
    mat.normalMap = own(mat.normalMap);
    mat.roughnessMap = own(mat.roughnessMap);
    mat.metalnessMap = own(mat.metalnessMap);
    mat.aoMap = null;
    // The boards are very dark; lift them a little, to a dark walnut that sits
    // with the desk under the same light (a stronger lift glowed beside it).
    mat.color.setRGB(1.35, 0.98, 0.72);
    mat.roughness = 0.85;
    return mat;
  }, [scene]);
  useEffect(
    () => () => {
      for (const t of [
        material.map,
        material.normalMap,
        material.roughnessMap,
        material.metalnessMap,
      ])
        t?.dispose();
      material.dispose();
    },
    [material],
  );
  return material;
}

const FLOOR_URL = "/models/case-404/environment/architecture/floors/dark-wood-floor.glb";

/** Paper strip with the three category tags, for the front ledge. */
function paintTags() {
  const canvas = document.createElement("canvas");
  // Same proportion as the strip (~0.37 x 0.009 m), so the type is not stretched.
  canvas.width = 2048;
  canvas.height = 48;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e3d8bd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1d1a16";
  ctx.font = 'bold 34px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const third = canvas.width / 3;
  COLUMNS.forEach((c, i) => {
    ctx.fillText(COLUMN_TAGS[c], third * (i + 0.5), 26);
    if (i) ctx.fillRect(third * i - 1, 8, 2, 32);
  });
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function DiskRack() {
  const wood = useRackWood();

  const geometries = useMemo(() => {
    const parts: { geometry: BufferGeometry; grain: Axis }[] = [];
    // Plinth and tier blocks (grain across the rack).
    parts.push(
      box(INNER_W, tierFloor(0), FRONT + STEP_D, [0, tierFloor(0) / 2, -(FRONT + STEP_D) / 2], 0),
    );
    for (let t = 1; t < TIERS; t++) {
      const h = tierFloor(t);
      const d = STEP_D + (t === TIERS - 1 ? REAR_AIR : 0);
      parts.push(box(INNER_W, h, d, [0, h / 2, tierFront(t) - d / 2], 0));
    }
    // A lip in front of each tier's disks.
    for (let t = 0; t < TIERS; t++) {
      parts.push(
        box(INNER_W, LIP_H, LIP_T, [0, tierFloor(t) + LIP_H / 2, tierFront(t) - LIP_T / 2], 0),
      );
    }
    // Back board, up to the top of the back tier's sides.
    const backH = tierFloor(TIERS - 1) + SIDE_RISE + 0.02;
    parts.push(box(INNER_W, backH, BACK_T, [0, backH / 2, -DEPTH + BACK_T / 2], 0));
    // Stepped side panels (grain running front to back) and the two dividers.
    parts.push({ geometry: profile(SIDE_RISE, WALL, -WIDTH / 2), grain: 2 });
    parts.push({ geometry: profile(SIDE_RISE, WALL, INNER_W / 2), grain: 2 });
    for (const x of [-PITCH / 2, PITCH / 2]) {
      parts.push({ geometry: profile(FIN_RISE, FIN, x - FIN / 2), grain: 2 });
    }
    return parts.map((p, i) => woodUVs(p.geometry, p.grain, 3 + i * 7));
  }, []);

  const tags = useMemo(() => {
    const map = paintTags();
    const bump = createPaperBump();
    const material = new MeshStandardMaterial({
      map,
      bumpMap: bump,
      bumpScale: 0.0015,
      roughness: 0.92,
      color: "#a39d90",
    });
    return { map, bump, material };
  }, []);

  useEffect(
    () => () => {
      geometries.forEach((g) => g.dispose());
      tags.map.dispose();
      tags.bump.dispose();
      tags.material.dispose();
    },
    [geometries, tags],
  );

  return (
    <group name="disk-rack" position={RACK_AT}>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} material={wood} castShadow receiveShadow />
      ))}
      {/* Category tags on the front ledge's face. */}
      <mesh position={[0, tierFloor(0) * 0.5, 0.0004]} material={tags.material} receiveShadow>
        <planeGeometry args={[INNER_W * 0.96, tierFloor(0) * 0.62]} />
      </mesh>
    </group>
  );
}
