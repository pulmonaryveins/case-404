import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { DoubleSide, type Group, Mesh, type MeshStandardMaterial } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { frontOf, useFocusable } from "../camera/focus";
import { DESK_TOP } from "./worldAnchors";

/**
 * Which prints from the sheet (by node name; GLTFLoader names a mesh after
 * its node), and where they lie (station frame): x, z, yaw. Loosely
 * scattered round the camera (ArchiveStation's POLAROID_AT) as if just
 * ejected; the first two overlap a little, so each sits above the one before.
 */
const PRINTS = [
  { mesh: "Object_4", x: 0.41, z: 0.17, yaw: 0.35 },
  { mesh: "Object_14", x: 0.44, z: 0.03, yaw: -0.3 },
  { mesh: "Object_22", x: 0.73, z: 0.24, yaw: 0.6 },
] as const;
/**
 * Height of the lowest print above the desk, and the step between prints.
 * Millimetres, not fractions of one: at a few metres the depth buffer cannot
 * tell 0.6 mm apart, and the prints flickered through the desk and each other
 * as the camera moved. polygonOffset below keeps them on top of the leather.
 */
const BASE = 0.002;
const LAYER = 0.0015;
/** How much bigger than a print the close-up frame is. */
const FOCUS_FILL = 1.6;

/** Three loose polaroid prints on the archive desk; click one to look at it close. */
export function PolaroidPhotos({ interactive }: { interactive: boolean }) {
  const asset = assetManifest.polaroidPhotos;
  const { scene } = useGLTF(asset.url);
  const group = useRef<Group>(null);

  const prints = useMemo(() => {
    const byName = new Map<string, Mesh>();
    scene.traverse((o) => {
      if (o instanceof Mesh) byName.set(o.name, o);
    });
    return PRINTS.flatMap((p, i) => {
      const source = byName.get(p.mesh);
      if (!source) return [];
      // The quads are flat but single-sided; show them from either face.
      const material = (source.material as MeshStandardMaterial).clone();
      material.side = DoubleSide;
      material.roughness = 0.55;
      material.polygonOffset = true;
      material.polygonOffsetFactor = -2 - i;
      material.polygonOffsetUnits = -2 - i;
      return [{ ...p, geometry: source.geometry, material, y: DESK_TOP + BASE + i * LAYER }];
    });
  }, [scene]);

  useEffect(() => () => prints.forEach((p) => p.material.dispose()), [prints]);

  // Leans toward the archive desk's front, so prints read as from the desk view.
  const focus = useFocusable(() => interactive, {
    fill: FOCUS_FILL,
    label: "Inspect photo",
    get front() {
      return frontOf(group.current);
    },
  });

  return (
    <group ref={group} name="polaroid-photos">
      {prints.map((p) => (
        <mesh
          key={p.mesh}
          geometry={p.geometry}
          material={p.material}
          position={[p.x, p.y, p.z]}
          rotation={[0, p.yaw, 0]}
          scale={asset.scale}
          receiveShadow
          {...focus}
        />
      ))}
    </group>
  );
}
