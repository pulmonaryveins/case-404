import { useRef, useState } from "react";
import { Object3D, type SpotLight, MathUtils } from "three";
import { useFrame } from "@react-three/fiber";
import { storyRig } from "../../story/storyRig";
import { ContactShadows } from "@react-three/drei";

/**
 * Room light. The desk lamp (DeskLampLight, parented to the lamp prop) is
 * the scene's dominant, visible source; everything here only supports it.
 *
 * A lamp at desk height cannot light the board hung above and behind it, and
 * forcing it to (an impossibly strong lamp, or a cone thrown up the wall)
 * would look staged. So the board keeps a dim, broad wash from above that
 * reads as lamplight bouncing round the room — weaker than the desktop by
 * design — plus a low hemisphere so shadows stay dark grey, not black.
 */

/**
 * Board wash. Shared by the prop and the per-frame dimming below: the
 * useFrame assignment overrides `intensity` every frame, so a literal in
 * only one of the two places would silently lose.
 */
const BOARD_WASH = 8;

export function OfficeLighting() {
  // A spotlight aims at target.matrixWorld, which only updates when the
  // target is in the scene graph. Setting `target-position` alone leaves it
  // at the origin — the key aimed at (0,0,0) until this was fixed.
  const [boardTarget] = useState(() => new Object3D());
  const wash = useRef<SpotLight>(null);
  useFrame(() => {
    // Ease the room down as the file opens, so the lamp carries the read.
    const open = MathUtils.smoothstep(storyRig.dossierOpen, 0, 1);
    if (wash.current) wash.current.intensity = MathUtils.lerp(BOARD_WASH, BOARD_WASH * 0.45, open);
  });

  return (
    <>
      <primitive object={boardTarget} position={[0.0, 0.95, -3.3]} />

      {/* Board wash: broad and soft from above, aimed at the board. It is
          kept as a shadow caster only because the board's physicality depends
          on it — the pinned papers stand 1.2–2.4cm off the cork and read as
          printed-on without their contact shadows. `normalBias` stays well
          under that lift or it biases those shadows away; `focus` concentrates
          the 2048 texels on the board (4096 measured at ~14ms/frame); `radius`
          softens the edge (live because the Canvas runs PCFShadowMap). */}
      <spotLight
        ref={wash}
        position={[0.1, 3.05, -0.55]}
        target={boardTarget}
        angle={0.74}
        penumbra={1}
        intensity={BOARD_WASH}
        distance={12}
        decay={1.5}
        color="#f6dcc0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-focus={0.85}
        shadow-camera-near={1.5}
        shadow-camera-far={8}
        shadow-bias={-0.0004}
        shadow-normalBias={0.006}
        shadow-radius={5}
        shadow-intensity={0.8}
      />

      {/* Neutral-cool night fill, kept low so the lamp reads as the source:
          cool from above, deep charcoal from the floor, so corners and shadow
          interiors stay dark grey rather than crushing to black. */}
      <hemisphereLight args={["#8e97a6", "#2b2724", 0.6]} />

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
