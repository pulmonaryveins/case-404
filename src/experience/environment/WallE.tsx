import { useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { Box3, type Group, Mesh, type Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { useBlobTexture } from "./useBlobTexture";

/**
 * Whether the baked clip plays. Off for now: it was costing frames on laptops.
 * With it off he holds the clip's first frame, so every part is posed.
 */
const ANIMATE = false;

/**
 * A toy Wall-E, standing on top of the archive terminal (ArchiveStation, which
 * knows where the terminal is, gives the spot and heading). The model carries
 * a single looping clip (about 10 s: the treads turn, the arms and neck move,
 * the eyes look about); see ANIMATE. `scripts/prepare-walle.mjs` output, ~16k triangles.
 */
export function WallE({ at, yaw }: { at: Vector3; yaw: number }) {
  const asset = assetManifest.wallE;
  const { scene, animations } = useGLTF(asset.url);
  const group = useRef<Group>(null);
  const clone = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((o) => {
      // No cast shadow: like the terminal he stands on (which casts none), a
      // real one from the lamp lands on the wall behind as a lone, hard-edged
      // silhouette. A soft contact shadow under him (below) grounds him.
      if (o instanceof Mesh) {
        o.castShadow = false;
        o.receiveShadow = true;
      }
    });
    return copy;
  }, [scene]);
  const blob = useBlobTexture();
  const { actions } = useAnimations(animations, group);

  // Stands on the spot given: the lowest point of the tracks touches it.
  const lift = useMemo(() => {
    const box = new Box3().setFromObject(clone);
    return -box.min.y * asset.scale;
  }, [clone, asset.scale]);

  useEffect(() => {
    const action = Object.values(actions)[0];
    if (!action) return;
    action.reset().play();
    // Held on the first frame: the mixer poses the parts there and then has
    // nothing to advance.
    action.time = 0;
    action.paused = !ANIMATE;
    return () => {
      action.stop();
    };
  }, [actions]);

  return (
    <>
      <mesh
        position={[at.x, at.y + 0.0008, at.z]}
        rotation={[-Math.PI / 2, 0, yaw]}
        renderOrder={2}
        raycast={() => null}
      >
        <planeGeometry args={[0.19, 0.17]} />
        <meshBasicMaterial
          map={blob}
          transparent
          opacity={0.7}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          toneMapped={false}
        />
      </mesh>
      <group
        ref={group}
        name="wall-e"
        position={[at.x, at.y + lift, at.z]}
        rotation={[0, yaw, 0]}
        scale={asset.scale}
      >
        <primitive object={clone} />
      </group>
    </>
  );
}
