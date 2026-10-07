import { useState } from "react";
import { Object3D } from "three";
import { ContactShadows } from "@react-three/drei";

/**
 * Phase 2A opening lighting: one warm key, one neutral-cool fill, and a
 * baked-once contact shadow for grounding. No postprocessing.
 *
 * Key placement matters: an overhead key directly above the desk projects
 * the solid desktop's full rectangular footprint onto the floor (the
 * "rug"). The key sits in front of and above the desk instead, so the
 * desktop shadow falls behind the desk, mostly hidden from the camera, and
 * the corkboard drops a thin shadow on the wall below it.
 */
export function OfficeLighting() {
  // A spotlight aims at target.matrixWorld, which only updates when the
  // target is in the scene graph. Setting `target-position` alone leaves it
  // at the origin — the key aimed at (0,0,0) until this was fixed.
  const [keyTarget] = useState(() => new Object3D());

  return (
    <>
      <primitive object={keyTarget} position={[0.0, 0.95, -3.3]} />

      {/* Warm practical key: implied fixture overhead, ahead of the desk,
          aimed at the board. Only shadow caster. */}
      <spotLight
        position={[0.1, 3.05, -0.55]}
        target={keyTarget}
        angle={0.68}
        penumbra={1}
        intensity={40}
        distance={12}
        decay={1.6}
        color="#ffcf9a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0008}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-intensity={0.72}
      />

      {/* Neutral-cool night fill: cool from above, near-black charcoal from
          the floor, so unlit surfaces fall to charcoal instead of brown. */}
      <hemisphereLight args={["#8e97a6", "#1a1918", 0.95]} />

      {/* Grounding: soft occlusion under the desk feet, dense at contact and
          fading outward. Static scene, so it renders once (frames={1}). */}
      <ContactShadows
        position={[0.05, 0.002, -2.05]}
        scale={[3.2, 2.2]}
        far={0.9}
        blur={2.2}
        opacity={0.85}
        resolution={512}
        color="#000000"
        frames={1}
      />
    </>
  );
}
