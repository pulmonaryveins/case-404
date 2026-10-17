import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Mesh, type MeshStandardMaterial } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { useExperienceStore } from "../../store/useExperienceStore";
import { useCursor } from "../cursor/cursorStore";
import { LAMP_COLOUR, lampOn, stepLamp, toggleLamp } from "../lighting/lampState";
import { LampPoint, LampSpot } from "./LampSpot";
import { lampAudio } from "../audio/lampAudio";

/** The back wall's face (see RoomShell). */
const WALL_Z = -3.8;
/**
 * The two twin-arm sconces on the back wall, one either side of the evidence
 * board (which spans x -1.2 to 1.2), in the plain wall between it and the
 * rounded corners. `y` is the height of the arms' bar.
 */
const SCONCES = [
  { x: -1.58, y: 1.85 },
  { x: 1.58, y: 1.85 },
] as const;
/**
 * The model's back plate is at its +x (0.386), its two shades open downward
 * at z +-0.7, and it is 2 units wide: at 0.22 a 44 cm sconce, 22 cm tall,
 * standing 17 cm off the wall.
 */
const BACK = 0.386;
/**
 * Each sconce's light, from where its bulbs are (relative to the sconce): the
 * bells' mouths are ~11 cm below the arms' bar and ~11 cm out from the wall.
 *
 *  - DOWN: what the open bells throw, a soft cone straight down (tipped a
 *    touch out into the room) that lays the familiar scallop of light down the
 *    wall under the fitting, starting right at it (tipped further out, the
 *    pool began a hand below the bells), and onto what stands below it;
 *  - GLOW: what the frosted glass lets through all round, a faint point in the
 *    bells that lights the wall just about the fitting.
 */
const DOWN = { y: -0.11, z: 0.11, out: 0.08, intensity: 1.6, angle: 0.95, reach: 1.25 };
const GLOW_LIGHT = { y: -0.03, z: 0.2, intensity: 0.18 };

/** Glow of the glass shades at full, in the lamp's own colour. */
const GLOW = 1.6;

/**
 * Both sconces, switched together as the "wall" lamp (lampState): the glass
 * shades glow while it is lit, and their light comes from the bulbs (DOWN and
 * GLOW_LIGHT); the room's soft bounce fill (DetectiveOffice) follows the same
 * switch. Click either one to switch.
 */
export function WallSconces() {
  const asset = assetManifest.wallSconce;
  const { scene } = useGLTF(asset.url);

  // One shared material for both: the cached scene's own is left untouched.
  const { copies, glass } = useMemo(() => {
    let glass: MeshStandardMaterial | null = null;
    const copies = SCONCES.map(() => {
      const copy = scene.clone(true);
      copy.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        glass ??= (o.material as MeshStandardMaterial).clone();
        glass.emissive.set(LAMP_COLOUR);
        glass.emissiveIntensity = 0;
        o.material = glass;
        o.castShadow = true;
        o.receiveShadow = true;
      });
      return copy;
    });
    return { copies, glass: glass as MeshStandardMaterial | null };
  }, [scene]);

  const glow = useRef<MeshStandardMaterial | null>(null);
  useEffect(() => {
    glow.current = glass;
    return () => {
      glow.current = null;
      glass?.dispose();
    };
  }, [glass]);

  useFrame((_, dt) => {
    const lit = stepLamp("wall", dt);
    if (glow.current) glow.current.emissiveIntensity = GLOW * lit;
  });

  const enabled = () => !useExperienceStore.getState().screenFocused;
  const label = () => (lampOn.wall ? "Lamps off" : "Lamps on");
  const switching = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (!enabled()) return;
      e.stopPropagation();
      toggleLamp("wall");
      lampAudio.wall(lampOn.wall);
      useCursor.getState().set("switch", label());
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (!enabled()) return;
      e.stopPropagation();
      useCursor.getState().set("switch", label());
    },
    onPointerOut: () => useCursor.getState().clear(),
  };

  return (
    <group name="wall-sconces">
      {SCONCES.map(({ x, y }, i) => (
        // A quarter turn puts the back plate (+x) on the wall and the width
        // (z) along it.
        <group
          key={i}
          position={[x, y, WALL_Z]}
          rotation={[0, Math.PI / 2, 0]}
          scale={asset.scale}
          {...switching}
        >
          <primitive object={copies[i]} position={[-BACK, 0, 0]} />
        </group>
      ))}
      {/* Their light, from the bulbs; dark when the lamps are off. */}
      {SCONCES.map(({ x, y }, i) => (
        <group key={`light${i}`}>
          <LampSpot
            lamp="wall"
            at={[x, y + DOWN.y, WALL_Z + DOWN.z]}
            aim={[x, y + DOWN.y - DOWN.reach, WALL_Z + DOWN.z + DOWN.out]}
            intensity={DOWN.intensity}
            angle={DOWN.angle}
            distance={0}
            decay={2}
          />
          <LampPoint
            lamp="wall"
            at={[x, y + GLOW_LIGHT.y, WALL_Z + GLOW_LIGHT.z]}
            intensity={GLOW_LIGHT.intensity}
            distance={0}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
}
