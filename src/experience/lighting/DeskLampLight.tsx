import { useRef, useState, useMemo, useEffect } from "react";
import { AdditiveBlending, CanvasTexture, MathUtils, Object3D, type SpotLight } from "three";
import { useFrame } from "@react-three/fiber";
import { storyRig } from "../../story/storyRig";

/**
 * Bulb of the desk lamp, in the lamp model's own space. Measured from the
 * model: sampling its emissive texture at every vertex UV, the glowing
 * region is a compact bulb (x -0.01..0.07, y 0.354..0.413, z 0.04..0.10),
 * not the shade lining.
 *
 * The light sits just BELOW the bulb, not at its centre: the bulb is closed
 * geometry and the lamp casts shadows, so a light inside it would be fully
 * occluded by its own glass. Here it is still inside the shade's open
 * cavity, so the shade cuts it off above and behind exactly as a real one.
 */
const BULB: [number, number, number] = [0.027, 0.34, 0.067];

/**
 * Down, forward and along the shade toward the desk's centre. The bulb sits
 * just above the shade's rim, so any direction below horizontal clears it.
 */
const AIM: [number, number, number] = [0.25, -0.1, 0.4];

/**
 * Peak intensity, and the fraction of it kept once the folder is fully open.
 * The cream pages and the cover blow out under the full desk level — the
 * profile text vanishes — so the lamp backs off as the dossier opens, the
 * same way the room wash does. Shared by the prop and the per-frame dimming:
 * the useFrame write overrides the prop every frame.
 */
const LAMP = 8.3;
const OPEN_FRACTION = 0.3;

/**
 * The scene's dominant light: warm tungsten from the desk lamp's bulb.
 * Render as a child of the lamp prop so it follows the lamp's placement.
 *
 * Decay 1.1 rather than the physical 2: the plant at the far right sits ~1.3 m
 * from the bulb against ~0.7 m for the folder, which at decay 2 is a 3.5x
 * drop and leaves it black. 1.1 narrows that to ~2x, so it falls off
 * visibly but still catches light; intensity is raised to keep the folder at
 * its level. The board gains a little from this, which is what the room wash
 * is trimmed for.
 *
 * It is the desk's only shadow caster. The cone is deliberately wide with a
 * fully feathered edge, so the light pools softly across most of the desktop
 * instead of drawing a hard circle; `focus` keeps the 2048 shadow map on the
 * part of that cone that actually has shadows worth resolving.
 */
export function DeskLampLight() {
  const glow = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const halo = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    halo.addColorStop(0, "rgba(255,235,190,0.65)");
    halo.addColorStop(0.18, "rgba(255,211,136,0.3)");
    halo.addColorStop(0.45, "rgba(255,179,85,0.08)");
    halo.addColorStop(1, "rgba(255,179,85,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 128, 128);
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => glow.dispose(), [glow]);
  const [target] = useState(() => new Object3D());
  const light = useRef<SpotLight>(null);
  useFrame(() => {
    const open = MathUtils.smoothstep(storyRig.dossierOpen, 0, 1);
    if (light.current) light.current.intensity = LAMP * MathUtils.lerp(1, OPEN_FRACTION, open);
  });
  return (
    <>
      {/* Local optical glow only: no extra light on the dossier. Depth testing
          lets the opaque shade conceal the halo from above and behind. */}
      <sprite position={[0.027, 0.367, 0.067]} scale={[0.18, 0.18, 1]}>
        <spriteMaterial
          map={glow}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          depthTest
          toneMapped={false}
        />
      </sprite>
      <primitive object={target} position={AIM} />
      <spotLight
        ref={light}
        position={BULB}
        target={target}
        color="#ffbf80"
        intensity={LAMP}
        decay={1.1}
        angle={1.3}
        penumbra={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-focus={0.8}
        shadow-camera-near={0.03}
        shadow-camera-far={2.2}
        shadow-bias={-0.0004}
        shadow-normalBias={0.004}
        shadow-radius={3}
        shadow-intensity={1}
      />
    </>
  );
}
