import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Object3D, type SpotLight } from "three";
import { storyRig } from "../../story/storyRig";

/**
 * Cool moonlight from behind the camera, shining over the viewer's shoulder at
 * the back wall, the board and the desk. It casts no shadows: the window moon
 * (MoonWindow) is the one real shadow-casting moon, and a second shadow-caster
 * would throw a second shadow of every object. This only lifts the front of
 * the room a little so it is not lit from the left alone.
 */
const AT = [-1.3, 2.9, 3.4] as const;
const AIM = [0.2, 1.3, -3.2] as const;
/** Peak strength, and the share kept once the dossier is open (as the lamp). */
const FILL = 0.3;
const OPEN_FRACTION = 0.3;

export function MoonFill() {
  const light = useRef<SpotLight>(null);
  const [target] = useState(() => new Object3D());

  useFrame(() => {
    const open = MathUtils.smoothstep(storyRig.dossierOpen, 0, 1);
    if (light.current) light.current.intensity = FILL * MathUtils.lerp(1, OPEN_FRACTION, open);
  });

  return (
    <group name="moon-fill">
      <primitive object={target} position={AIM} />
      <spotLight
        ref={light}
        position={AT}
        target={target}
        color="#9fb4e6"
        intensity={FILL}
        angle={0.5}
        penumbra={0.8}
        decay={1}
      />
    </group>
  );
}
