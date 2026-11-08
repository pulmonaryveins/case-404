import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, type MeshStandardMaterial } from "three";
import { assetManifest } from "../../assets/assetManifest";

/**
 * The rug under the main desk. Its texture is a bright, saturated print made
 * for a daylight render; in this room, lit by the moon and two desk lamps,
 * it read as lit from somewhere else. A dusty, warm-grey tint takes it down
 * to the floor's level, and a fully rough, non-metal finish keeps the lamps
 * from putting a sheen on wool.
 */
export function Carpet() {
  const asset = assetManifest.carpet;
  const { scene } = useGLTF(asset.url);
  const rug = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = false;
      o.receiveShadow = true;
      const material = (o.material as MeshStandardMaterial).clone();
      material.color.set("#8a7a6a");
      material.roughness = 1;
      material.metalness = 0;
      material.normalScale.set(0.8, 0.8);
      o.material = material;
    });
    return copy;
  }, [scene]);

  useEffect(
    () => () =>
      rug.traverse((o) => {
        if (o instanceof Mesh) (o.material as MeshStandardMaterial).dispose();
      }),
    [rug],
  );

  return (
    <primitive
      object={rug}
      position={asset.position}
      rotation={asset.rotation}
      scale={asset.scale}
    />
  );
}
