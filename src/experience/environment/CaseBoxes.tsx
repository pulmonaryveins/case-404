import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Group, Mesh, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";

/**
 * The evidence boxes from case-boxes.glb, taken apart and restacked around the
 * merch cabinets: two on top of cabinet B (A carries the gramophone), and on
 * the floor against the side wall, left of B, a stack of three with one more
 * open box beside it.
 * Only lidded boxes carry another: the open ones' flaps stand up past their
 * rims, so a box set on one would rest on the flap tips and look afloat.
 *
 * Each box (with its lid, where it has one) is pulled out of the model by node
 * name, re-centred on its footprint and set on its bottom, so it can be placed
 * and stacked by its measured height.
 */
const BOXES = {
  A: ["BoxA_PI_BOX", "BoxA_lid_PI_BOX"],
  B: ["BoxB_PI_BOX", "BoxB_lid_PI_BOX"],
  B001: ["BoxB001_PI_BOX", "BoxB_lid001_PI_BOX"],
  C: ["BoxC_PI_BOX"],
  D: ["BoxD_PI_BOX"],
  D001: ["BoxD001_PI_BOX"],
} as const;
type BoxId = keyof typeof BOXES;

interface Stack {
  /** Footprint centre (world x, z) and the floor or top it stands on. */
  at: [number, number];
  y: number;
  /** Bottom to top: each box, turned by `yaw` (world), nudged by dx/dz. */
  boxes: { id: BoxId; yaw: number; dx?: number; dz?: number }[];
}

interface Cabinet {
  at: Vector3;
  yaw: number;
}

/** One box as its own object: footprint centred on the origin, bottom at y 0. */
function useBoxes() {
  const { scene } = useGLTF(assetManifest.caseBoxes.url);
  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const out = {} as Record<BoxId, { object: Group; height: number }>;
    for (const id of Object.keys(BOXES) as BoxId[]) {
      const parts = new Group();
      scene.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        if (!BOXES[id].some((prefix) => o.name.startsWith(prefix + "_"))) return;
        const mesh = new Mesh(o.geometry, o.material);
        o.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parts.add(mesh);
      });
      const box = new Box3().setFromObject(parts);
      const centre = box.getCenter(new Vector3());
      parts.position.set(-centre.x, -box.min.y, -centre.z);
      const object = new Group();
      object.add(parts);
      out[id] = { object, height: box.max.y - box.min.y };
    }
    return out;
  }, [scene]);
}

export function CaseBoxes({ cabinets, top }: { cabinets: Cabinet[]; top: number }) {
  const boxes = useBoxes();

  const stacks = useMemo<Stack[]>(() => {
    const [, b] = cabinets;
    // A box lies square to its cabinet with its long side (model x) along the
    // cabinet's width (the wall).
    const along = (c: Cabinet) => c.yaw + Math.PI / 2;
    return [
      {
        at: [b.at.x, b.at.z],
        y: top,
        boxes: [
          { id: "B", yaw: along(b) + 0.05 },
          { id: "D001", yaw: b.yaw - 0.04, dx: 0.01 },
        ],
      },
      // On the floor against the side wall (x -3.6), just past B's rounded
      // corner, long sides along the wall: the big box and a lidded one, the
      // open one on top; a small open box on the floor in front of them.
      {
        at: [-3.265, -1.9],
        y: 0,
        boxes: [
          { id: "A", yaw: Math.PI / 2 },
          { id: "B001", yaw: Math.PI / 2 - 0.05, dx: 0.03, dz: 0.02 },
          { id: "C", yaw: Math.PI / 2 + 0.06, dx: 0.02 },
        ],
      },
      { at: [-3.42, -1.32], y: 0, boxes: [{ id: "D", yaw: Math.PI / 2 + 0.1 }] },
    ];
  }, [cabinets, top]);

  const placed = useMemo(
    () =>
      stacks.flatMap(({ at, y, boxes: list }) => {
        let level = y;
        return list.map(({ id, yaw, dx = 0, dz = 0 }) => {
          const { object, height } = boxes[id];
          const position: [number, number, number] = [at[0] + dx, level, at[1] + dz];
          level += height;
          return { id, object, position, yaw };
        });
      }),
    [stacks, boxes],
  );

  return (
    <group name="case-boxes">
      {placed.map(({ id, object, position, yaw }) => (
        <primitive key={id} object={object} position={position} rotation={[0, yaw, 0]} />
      ))}
    </group>
  );
}
