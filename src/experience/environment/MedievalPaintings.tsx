import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";

/** The back wall's face (see RoomShell). */
const WALL_Z = -3.8;

/**
 * Parked for now: not mounted (DetectiveOffice); add `<MedievalPaintings />`
 * back to hang them again.
 *
 * Two old paintings in gilt frames on the back wall, either side of the
 * evidence board, as a detective's office keeps old art it never looks at:
 * Bosch's crowd of jeering faces over the mannequin, and robed monks at work
 * in a hill landscape between the board and the archive corner. Both near
 * square (1.04 and 1.07 : 1). `height`
 * is the frame's height (the models are 1 m tall); `x`, `y` its centre.
 */
const PAINTINGS = [
  // Hung as a pair: same size, same height and the same distance either side
  // of the board's centre (x 0), so their tops and bottoms line up. Bottoms at 1.55 m, just clear of the mannequin (1.53 m).
  { node: "cuadro_8", x: -1.6, y: 1.8, height: 0.5 },
  { node: "cuadro_12", x: 1.6, y: 1.8, height: 0.5 },
];

/**
 * Darkened varnish: a slight warm, dull tint and a satin finish, so the
 * pictures sit back in the dim room as old oils do instead of glowing like
 * prints. One material for both (they share the atlas).
 */
function useAgedMaterial(source: MeshStandardMaterial) {
  const material = useMemo(() => {
    const m = source.clone();
    m.color.set("#d6ccba");
    m.roughness = 0.78;
    m.metalness = 0;
    return m;
  }, [source]);
  useEffect(() => () => material.dispose(), [material]);
  return material;
}

function Painting({
  mesh,
  material,
  x,
  y,
  height,
}: {
  mesh: Mesh;
  material: MeshStandardMaterial;
  x: number;
  y: number;
  height: number;
}) {
  // The painting's own mesh with its place in the pack baked out, re-centred
  // on its face and with its back on the wall.
  const { object, offset } = useMemo(() => {
    const object = new Mesh(mesh.geometry, material);
    mesh.updateWorldMatrix(true, false);
    mesh.matrixWorld.decompose(object.position, object.quaternion, object.scale);
    object.castShadow = true;
    object.receiveShadow = true;
    const box = new Box3().setFromObject(object);
    const centre = box.getCenter(new Vector3());
    const offset = new Vector3(-centre.x, -centre.y, -box.min.z);
    return { object, offset };
  }, [mesh, material]);

  return (
    <group position={[x, y, WALL_Z + 0.002]} scale={height}>
      <group position={offset}>
        <primitive object={object} />
      </group>
    </group>
  );
}

export function MedievalPaintings() {
  const { scene } = useGLTF(assetManifest.medievalPaintings.url);
  const meshes = useMemo(
    () =>
      PAINTINGS.map(({ node }) => {
        const parent = scene.getObjectByName(node);
        let mesh: Mesh | null = null;
        parent?.traverse((o) => {
          if (o instanceof Mesh) mesh ??= o;
        });
        return mesh as Mesh | null;
      }),
    [scene],
  );
  const first = meshes.find(Boolean);
  const material = useAgedMaterial(first!.material as MeshStandardMaterial);

  return (
    <group name="medieval-paintings">
      {PAINTINGS.map(({ node, x, y, height }, i) => {
        const mesh = meshes[i];
        return mesh ? (
          <Painting key={node} mesh={mesh} material={material} x={x} y={y} height={height} />
        ) : null;
      })}
    </group>
  );
}
