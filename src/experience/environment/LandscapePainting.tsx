import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Mesh, type MeshStandardMaterial, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";

/**
 * One old landscape in a gilt frame on the angled wall above the typewriter
 * desk: a Flemish village fair, as a detective's office keeps old art it never
 * looks at. In the typewriter station's frame: the wall's face is the desk's
 * half depth and its gap behind it (see RoomShell); `HEIGHT` is the frame's
 * height (the model is 1 m tall, 1.99 m wide), `Y` its centre: hung low
 * (1.2 to 1.56 m) and 0.72 m wide so the close Case Closed shot holds it
 * whole with a little air above, between the lamp's shade and the globe.
 */
const WALL_Z = -0.476;
const HEIGHT = 0.36;
const Y = 1.38;

export function LandscapePainting() {
  const { scene } = useGLTF(assetManifest.landscapePainting.url);

  // The painting re-centred on its face, its back on the wall. Darkened
  // varnish: a slight warm, dull tint and a satin finish, so the picture sits
  // back in the dim room as old oils do instead of glowing like a print.
  const { object, offset, material } = useMemo(() => {
    let mesh: Mesh | null = null;
    scene.traverse((o) => {
      if (o instanceof Mesh) mesh ??= o;
    });
    const source = mesh! as Mesh;
    const material = (source.material as MeshStandardMaterial).clone();
    material.color.set("#d6ccba");
    material.roughness = 0.78;
    material.metalness = 0;
    const object = new Mesh(source.geometry, material);
    source.updateWorldMatrix(true, false);
    source.matrixWorld.decompose(object.position, object.quaternion, object.scale);
    object.castShadow = true;
    object.receiveShadow = true;
    const box = new Box3().setFromObject(object);
    const centre = box.getCenter(new Vector3());
    return { object, material, offset: new Vector3(-centre.x, -centre.y, -box.min.z) };
  }, [scene]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <group name="landscape-painting" position={[0, Y, WALL_Z + 0.002]} scale={HEIGHT}>
      <group position={offset}>
        <primitive object={object} />
      </group>
    </group>
  );
}
