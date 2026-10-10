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
/**
 * Window centre on the wall (z, y) and the glazed opening, a hair inside the
 * frame. The window sits toward the front of the left wall, beside the
 * camera's start and out of the opening shot; the moon is just outside it
 * (see MOON_AT), so the light fans out through the opening across the room:
 * the angled left wall, the board and back wall, and the angled corner wall
 * and terminal on the right. The 1.4 m window is stretched 25% along the wall.
 */
const WIN = { z: -0.3, y: 1.6 } as const;
/**
 * The moon, close outside the window so its light spreads (a far-off moon gives
 * one narrow parallel beam), and where it is aimed: back and across the room.
 */
const MOON_AT = [-4.3, 1.85, 0.62] as const;
const MOON_AIM = [-1.4, 1.2, -3.4] as const;
const OPENING = { w: 1.75, h: 1.4 } as const;
/** Faint cool fill in the back-left corner (see the pointLight in MoonWindow). */
const BOUNCE = { position: [-1.7, 1.9, -2.1], intensity: 0.12, distance: 5.5 } as const;
/** Stretch of the 1.4 m window frame model along the wall, to match OPENING.w. */
const FRAME_STRETCH = OPENING.w / 1.4;
/**
 * Moonlight peak, and the share kept once the dossier is open (as the lamp).
 * The light has no distance falloff (decay 0), as with real moonlight: the
 * window bars' shadow reaches the board and the right side as strongly as the
 * near wall, where a falling-off light left only the left wall patterned.
 */
const MOON = 1.55;
/**
 * How dark the moon's shadows get, 0 (none) to 1 (everything the moon does not
 * reach is left to the faint room fill, which is near black). Under 1 so the
 * window bars read as shadow, not black holes, on the left wall.
 */
const SHADOW_STRENGTH = 0.55;
const OPEN_FRACTION = 0.3;

/**
 * The left wall with a window opening cut out of it, the brown-framed window
 * in the opening, a dim night behind it, and the moonlight: one cool spot
 * light outside, aimed through the glazing so the opening and the window bars
 * throw their shadow across the floor, desk and back wall. Subtle by design —
 * the desk lamp stays the dominant source. The left wall lies outside the
 * default camera frame; its light is what the frame sees.
 */
/** Back wall z, where the bars' shadows are measured. */
const BACK_Z = -3.77;
/** Width every bar's shadow should have, wherever it lands (m). */
const BAR_SHADOW = 0.12;
/** World x on the back wall where each vertical bar's shadow should fall. */
const BAR_X = [-2.45, -1.2, 1.13, 2.7];
const BAR_HEIGHT = OPENING.h + 0.1;
/** The horizontal bar is cut into tapered pieces; this many along the opening. */
const CROSS_PIECES = 20;
const CROSS_Y = 1.75;

/**
 * Stretch of a bar's shadow: a ray from the moon that crosses the window at
 * z lands on the back wall `s` times as far beyond the window as the moon is
 * before it, so the shadow is (1 + s) times the bar's width.
 */
const stretch = (z: number) => Math.min((BACK_Z - z) / (z - MOON_AT[2]), 12);

/**
 * The window's shadow lines. A close moon throws a bar's shadow wider the
 * farther it lands, so the frame's own mullions gave thin lines on the near
 * left wall and thick ones across the room. These invisible bars (they only
 * cast shadows) are narrowed by exactly that stretch, so every line comes out
 * `BAR_SHADOW` wide wherever it lands. The vertical ones are placed so their
 * shadows fall at chosen spots on the back wall; the crosspiece tapers.
 */
function ShadowBars() {
  const dx = WALL.x - MOON_AT[0];
  const half = OPENING.w / 2;
  const verticals = BAR_X.map((x) => {
    const s = (x - WALL.x) / dx;
    const z = (BACK_Z + s * MOON_AT[2]) / (1 + s);
    return { z, width: BAR_SHADOW / (1 + s) };
  });
  const pieceLen = OPENING.w / CROSS_PIECES;
  const cross = Array.from({ length: CROSS_PIECES }, (_, i) => {
    const z = WIN.z - half + (i + 0.5) * pieceLen;
    return { z, thick: Math.max(0.012, BAR_SHADOW / (1 + stretch(z))) };
  });
  const material = <meshBasicMaterial colorWrite={false} depthWrite={false} />;
  return (
    <group name="shadow-bars" position={[WALL.x + 0.01, WIN.y, 0]}>
      {verticals.map((b, i) => (
        <mesh key={`v${i}`} position={[0, 0, b.z]} castShadow>
          <boxGeometry args={[0.03, BAR_HEIGHT, b.width]} />
          {material}
        </mesh>
      ))}
      {cross.map((b, i) => (
        <mesh key={`c${i}`} position={[0, CROSS_Y - WIN.y, b.z]} castShadow>
          <boxGeometry args={[0.03, b.thick, pieceLen * 1.02]} />
          {material}
        </mesh>
      ))}
    </group>
  );
}

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
        // The frame is for looks. The window's shadow lines come from the
        // bars below, sized so each lands the same width (see ShadowBars).
        o.castShadow = false;
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
      <ShadowBars />
      <primitive
        object={frame}
        position={[win.position[0], win.position[1], WIN.z]}
        rotation={win.rotation}
        scale={[FRAME_STRETCH, 1, 1]}
      />
      {/* Night outside: dim blue-black backdrop and a small moon. */}
      <mesh position={[WALL.x - 1.2, WIN.y, WIN.z]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4, 3.5]} />
        <meshBasicMaterial color="#0b1222" toneMapped={false} />
      </mesh>
      <mesh position={[WALL.x - 1.15, WIN.y + 0.5, WIN.z + 0.3]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.035, 24]} />
        <meshBasicMaterial color="#dfe8ff" toneMapped={false} />
      </mesh>

      {/* Moon bounce: the lit patch and window pour a little cool light back into
          the left corner, so the angled wall there and the window wall read
          instead of dropping to black. Small and shadowless; the spot is the
          real moonlight. */}
      <pointLight
        position={BOUNCE.position}
        color="#7f98cc"
        intensity={BOUNCE.intensity}
        distance={BOUNCE.distance}
        decay={1.5}
      />

      <primitive object={target} position={MOON_AIM} />
      <spotLight
        ref={light}
        position={MOON_AT}
        target={target}
        color="#a5bce8"
        intensity={MOON}
        angle={0.9}
        penumbra={0.5}
        decay={0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
        shadow-bias={-0.00015}
        shadow-normalBias={0.003}
        shadow-radius={7}
        shadow-intensity={SHADOW_STRENGTH}
      />
    </group>
  );
}
