import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  DoubleSide,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Shape,
  ShapeGeometry,
  type SpotLight,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { storyRig } from "../../story/storyRig";

/** Left wall plane: x of the wall, and the centre/size of the 7 x 3.44 m slab. */
const WALL = { x: -3.6, centreY: 1.72, centreZ: -1, width: 7, height: 3.44 } as const;
/** Window centre on the wall (z, y) and the glazed opening, a hair inside the frame. */
const WIN = { z: -2.3, y: 1.6 } as const;
const OPENING = { w: 1.4, h: 1.4 } as const;
/** Moonlight peak, and the share kept once the dossier is open (as the lamp). */
const MOON = 18;
const OPEN_FRACTION = 0.3;

/**
 * The left wall with a window opening cut out of it, the brown-framed window
 * in the opening, a dim night behind it, and the moonlight: one cool spot
 * light outside, aimed through the glazing so the opening and the window bars
 * throw their shadow across the floor, desk and back wall. Subtle by design —
 * the desk lamp stays the dominant source. The left wall lies outside the
 * default camera frame; its light is what the frame sees.
 */
export function MoonWindow() {
  const { scene: windowScene } = useGLTF(assetManifest.window2.url);
  const frame = useMemo(() => windowScene.clone(true), [windowScene]);
  const [target] = useState(() => new Object3D());
  const light = useRef<SpotLight>(null);

  const wall = useMemo(() => {
    const hw = WALL.width / 2;
    const hh = WALL.height / 2;
    const shape = new Shape();
    shape.moveTo(-hw, -hh).lineTo(hw, -hh).lineTo(hw, hh).lineTo(-hw, hh).closePath();
    // The plane is turned +90° about y, so local +x runs toward -z.
    const cx = -(WIN.z - WALL.centreZ);
    const cy = WIN.y - WALL.centreY;
    const hole = new Shape();
    hole
      .moveTo(cx - OPENING.w / 2, cy - OPENING.h / 2)
      .lineTo(cx - OPENING.w / 2, cy + OPENING.h / 2)
      .lineTo(cx + OPENING.w / 2, cy + OPENING.h / 2)
      .lineTo(cx + OPENING.w / 2, cy - OPENING.h / 2)
      .closePath();
    shape.holes.push(hole);
    return new ShapeGeometry(shape);
  }, []);
  useEffect(() => () => wall.dispose(), [wall]);

  useLayoutEffect(() => {
    frame.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const mat = o.material as MeshStandardMaterial;
      if (mat.name === "Glass_Crystal") {
        // Thin pane: faint, never a shadow caster.
        o.castShadow = false;
        mat.transparent = true;
        mat.opacity = 0.08;
        mat.depthWrite = false;
      } else {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [frame]);

  useFrame(() => {
    const open = MathUtils.smoothstep(storyRig.dossierOpen, 0, 1);
    if (light.current) light.current.intensity = MOON * MathUtils.lerp(1, OPEN_FRACTION, open);
  });

  const win = assetManifest.window2;
  return (
    <group name="moon-window">
      <mesh
        geometry={wall}
        rotation={[0, Math.PI / 2, 0]}
        position={[WALL.x, WALL.centreY, WALL.centreZ]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#2e2c28" roughness={0.95} metalness={0} side={DoubleSide} />
      </mesh>
      <primitive object={frame} position={win.position} rotation={win.rotation} />
      {/* Night outside: dim blue-black backdrop and a small moon. */}
      <mesh position={[WALL.x - 1.2, WIN.y, WIN.z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4, 3.5]} />
        <meshBasicMaterial color="#0b1222" toneMapped={false} />
      </mesh>
      <mesh position={[WALL.x - 1.15, WIN.y + 0.5, WIN.z + 0.3]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.035, 24]} />
        <meshBasicMaterial color="#dfe8ff" toneMapped={false} />
      </mesh>

      <primitive object={target} position={[-1.1, 0.9, -3.3]} />
      <spotLight
        ref={light}
        position={[-7.4, 2.5, -0.7]}
        target={target}
        color="#8fb2ff"
        intensity={MOON}
        angle={0.3}
        penumbra={0.7}
        decay={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={2}
        shadow-camera-far={13}
        shadow-bias={-0.0004}
        shadow-normalBias={0.01}
        shadow-radius={5}
      />
    </group>
  );
}
