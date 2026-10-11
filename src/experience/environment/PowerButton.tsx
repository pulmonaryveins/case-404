import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { CircleGeometry, Color, type Mesh, MeshBasicMaterial, MeshStandardMaterial } from "three";
import { useCursor } from "../cursor/cursorStore";

const LIT = new Color("#ff2a14");
const DARK = new Color("#2a0806");

interface Props {
  /** Centre of the painted power light on the case front, model frame. */
  at: { x: number; y: number; z: number };
  /** 0 (off) to 1 (on), read each frame for the LED's glow. */
  level: () => number;
  /** Whether a click does anything right now. */
  enabled: () => boolean;
  /** "Power off" / "Power on" for the cursor. */
  label: () => string;
  onPress: () => void;
}

/**
 * The terminal's red power light, made into a switch. The light itself is
 * painted into the case texture, so a small LED cap sits over it (glowing
 * while the terminal is on, dark when it is off) with a larger invisible pad
 * around it that takes the click: the painted light is only a few pixels
 * across from the desk view. In the computer's model frame.
 */
export function PowerButton({ at, level, enabled, label, onPress }: Props) {
  const { led, pad, cap } = useMemo(
    () => ({
      led: new MeshStandardMaterial({
        color: DARK,
        emissive: LIT,
        emissiveIntensity: 0,
        roughness: 0.3,
      }),
      // Raycast still hits a fully transparent mesh; it just draws nothing.
      pad: new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      cap: new CircleGeometry(0.014, 20),
    }),
    [],
  );
  useEffect(
    () => () => {
      led.dispose();
      pad.dispose();
      cap.dispose();
    },
    [led, pad, cap],
  );

  const ledMesh = useRef<Mesh>(null);
  useFrame(() => {
    const m = ledMesh.current?.material as MeshStandardMaterial | undefined;
    if (!m) return;
    const l = level();
    m.emissiveIntensity = 2.2 * l;
    m.color.copy(DARK).lerp(LIT, l * 0.6);
  });

  const press = (e: ThreeEvent<MouseEvent>) => {
    if (!enabled()) return;
    e.stopPropagation();
    onPress();
    useCursor.getState().set("switch", label());
  };

  return (
    <group position={[at.x, at.y, at.z + 0.002]}>
      <mesh ref={ledMesh} geometry={cap} material={led} />
      <mesh
        position={[0, 0, 0.001]}
        material={pad}
        onClick={press}
        onPointerOver={(e) => {
          if (!enabled()) return;
          e.stopPropagation();
          useCursor.getState().set("switch", label());
        }}
        onPointerOut={() => useCursor.getState().clear()}
      >
        <circleGeometry args={[0.05, 16]} />
      </mesh>
    </group>
  );
}
