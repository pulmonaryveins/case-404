import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace, type Sprite } from "three";
import { useExperienceStore } from "../../store/useExperienceStore";

/**
 * The air in the room: a faint haze through its depth (exponential fog, so
 * the far walls sit back a little behind it), and a few soft wisps of mist
 * drifting slowly through it, warm where the lamps are, cool by the window.
 * Both are light: the fog's colour is the room's lit grey, not black, so it
 * reads as air catching the light rather than darkness.
 */
const FOG = { color: "#2b2723", density: 0.065 };

/** Each wisp: centre, size (w, h, m), tint, opacity, and its drift's phase. */
const WISPS = [
  // Before the board and between the sconces.
  { at: [-0.6, 1.9, -3.25], size: [2.4, 1.3], tint: "#d8b48a", opacity: 0.1, phase: 0 },
  { at: [0.75, 1.55, -3.15], size: [2.2, 1.2], tint: "#d8b48a", opacity: 0.09, phase: 1.7 },
  // The window side: moonlit.
  { at: [-2.2, 1.6, -2.3], size: [2.6, 1.5], tint: "#9fb2d6", opacity: 0.09, phase: 3.1 },
  { at: [-1.6, 0.85, -1.5], size: [2.8, 1.0], tint: "#8ea2c8", opacity: 0.07, phase: 4.4 },
  // The computer side.
  { at: [2.0, 1.4, -2.55], size: [2.2, 1.3], tint: "#d2b08e", opacity: 0.085, phase: 2.3 },
  // Under the ceiling, and low over the floor.
  { at: [0.2, 2.65, -2.3], size: [3.2, 1.2], tint: "#c8bba8", opacity: 0.065, phase: 5.2 },
  { at: [1.1, 0.6, -1.3], size: [3.0, 0.9], tint: "#b9b0a2", opacity: 0.065, phase: 0.9 },
] as const;

/** How far (m) and how slowly (rad/s) the wisps drift, and how slowly they turn. */
const DRIFT = { x: 0.18, y: 0.06, speed: 0.07, spin: 0.012 };

/** A soft cloud: overlapping blurred blobs, faded out toward its edge. */
function paintMist(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  let seed = 707;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 46; i++) {
    const x = size * (0.2 + r() * 0.6);
    const y = size * (0.25 + r() * 0.5);
    const rad = size * (0.08 + r() * 0.2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(255,255,255,${0.12 + r() * 0.18})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // Fade to nothing at the edges, so no wisp ever shows a rim.
  ctx.globalCompositeOperation = "destination-in";
  const edge = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.15,
    size / 2,
    size / 2,
    size / 2,
  );
  edge.addColorStop(0, "rgba(0,0,0,1)");
  edge.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function Mist() {
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const map = useMemo(() => paintMist(), []);
  useEffect(() => () => map.dispose(), [map]);

  const wisps = useRef<(Sprite | null)[]>([]);
  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime * DRIFT.speed;
    // A plain loop: nothing allocated per frame.
    for (let i = 0; i < WISPS.length; i++) {
      const w = WISPS[i];
      const sprite = wisps.current[i];
      if (!sprite) continue;
      sprite.position.x = w.at[0] + Math.sin(t + w.phase) * DRIFT.x;
      sprite.position.y = w.at[1] + Math.sin(t * 0.7 + w.phase * 1.3) * DRIFT.y;
      sprite.material.rotation = Math.sin(t * 0.5 + w.phase) * 0.3 + clock.elapsedTime * DRIFT.spin;
    }
  });

  return (
    <>
      <fogExp2 attach="fog" args={[FOG.color, FOG.density]} />
      {WISPS.map((w, i) => (
        <sprite
          key={i}
          ref={(s) => {
            wisps.current[i] = s;
          }}
          position={w.at as unknown as [number, number, number]}
          scale={[w.size[0], w.size[1], 1]}
          renderOrder={5}
          raycast={() => null}
        >
          <spriteMaterial
            map={map}
            color={w.tint}
            opacity={w.opacity}
            transparent
            depthWrite={false}
            fog={false}
          />
        </sprite>
      ))}
    </>
  );
}
