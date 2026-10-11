import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, Object3D, type PointLight, type SpotLight } from "three";
import { storyRig } from "../../story/storyRig";
import { LAMP_COLOUR, lampLit, stepLamp, type LampId } from "../lighting/lampState";

interface Props {
  /** Which lamp switch this light follows. */
  lamp: LampId;
  /** Where the light sits, and where it is aimed (world space). */
  at: [number, number, number];
  aim: [number, number, number];
  /** Spot intensity at full, cone half-angle (rad), reach (m, 0 for none) and falloff. */
  intensity: number;
  angle: number;
  distance: number;
  decay: number;
  color?: string;
}

/**
 * A soft warm spot with no model of its own: the wall light's glow over the
 * board, and the share of it that reaches the merch corner and the computer
 * desk. Shadowless, always mounted (intensity 0 when off, never unmounted), so
 * switching never changes the light count. Each follows its entry in lampState
 * (LampStory says when its turn comes).
 */
export function LampSpot({
  lamp,
  at,
  aim,
  intensity,
  angle,
  distance,
  decay,
  color = LAMP_COLOUR,
}: Props) {
  const light = useRef<SpotLight>(null);
  const [target] = useState(() => new Object3D());
  useFrame((_, dt) => {
    const lit = stepLamp(lamp, dt);
    if (light.current) light.current.intensity = intensity * lit;
  });
  return (
    <>
      <primitive object={target} position={aim} />
      <spotLight
        ref={light}
        position={at}
        target={target}
        color={color}
        intensity={intensity * lampLit[lamp]}
        angle={angle}
        penumbra={1}
        distance={distance}
        decay={decay}
      />
    </>
  );
}

interface PointProps {
  lamp: LampId;
  at: [number, number, number];
  intensity: number;
  distance: number;
  decay: number;
  color?: string;
  /** Back off as the dossier opens, so its pages do not blow out. */
  dimWithDossier?: boolean;
}

/**
 * The lamp's spill, as a soft point light standing out in the room in front of
 * it. Unlike a cone it has no edge to show up as a pool on a wall: its light
 * fades smoothly with distance, so the board and the desk below get the most
 * and the merch corner and the computer desk, a few metres to either side,
 * a little. Follows the lamp's switch like the spot.
 */
export function LampPoint({
  lamp,
  at,
  intensity,
  distance,
  decay,
  color = LAMP_COLOUR,
  dimWithDossier = false,
}: PointProps) {
  const light = useRef<PointLight>(null);
  useFrame((_, dt) => {
    const lit = stepLamp(lamp, dt);
    const open = dimWithDossier ? MathUtils.smoothstep(storyRig.dossierOpen, 0, 1) : 0;
    if (light.current) light.current.intensity = intensity * lit * MathUtils.lerp(1, 0.35, open);
  });
  return (
    <pointLight
      ref={light}
      position={at}
      color={color}
      intensity={intensity * lampLit[lamp]}
      distance={distance}
      decay={decay}
    />
  );
}
