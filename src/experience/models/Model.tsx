import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, type MeshStandardMaterial } from "three";
import { assetManifest, type AssetId } from "../../assets/assetManifest";

interface Props {
  id: AssetId;
  castShadow?: boolean;
}

/**
 * Renders one manifest-registered GLB with its normalization transform and
 * shadow flags applied. Static: no per-frame work, no state.
 *
 * The scene is cloned per instance so two components never mutate the same
 * cached GLTF graph; materials/geometry stay shared via useGLTF's cache.
 */
export function Model({ id, castShadow }: Props) {
  const asset = assetManifest[id];
  const { scene } = useGLTF(asset.url);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  const color = "color" in asset ? asset.color : undefined;

  useLayoutEffect(() => {
    cloned.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = castShadow ?? asset.castShadow;
        child.receiveShadow = asset.receiveShadow;
        if (color) {
          // Shared cached material: every instance of this asset gets the same
          // colour, so mutating it once is intended, not a leak.
          const mat = child.material as MeshStandardMaterial;
          mat.map = null;
          mat.color.set(color);
          mat.needsUpdate = true;
        }
      }
    });
  }, [cloned, asset.castShadow, asset.receiveShadow, castShadow, color]);

  return (
    <primitive
      object={cloned}
      position={asset.position}
      rotation={asset.rotation}
      scale={asset.scale}
    />
  );
}
