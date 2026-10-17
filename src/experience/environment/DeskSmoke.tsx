import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, type Points, ShaderMaterial } from "three";
import type { Vector3Tuple } from "../../types/common";

/** Enough puffs that the thin thread at the tip overlaps into one line. */
const COUNT = 170;
/** How high the smoke climbs before it has thinned away (m). */
const RISE = 0.44;
/** Seconds for one puff to climb that far. */
const LIFE = 7.5;

const vertex = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aSeed;
  attribute float aAge;
  uniform float uScale;
  varying float vAlpha;
  varying float vSeed;
  varying float vAge;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vAlpha = aAlpha;
    vSeed = aSeed;
    vAge = aAge;
    gl_PointSize = aSize * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  varying float vAlpha;
  varying float vSeed;
  varying float vAge;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p) * 2.0;
    float soft = smoothstep(1.0, 0.0, d);
    // Break each puff into wisps: two octaves of noise, its own per puff, so
    // the plume reads as threads and curls rather than round blobs. Older
    // smoke is more broken up.
    vec2 q = p * 3.2 + vSeed * 17.0;
    float n = noise(q) * 0.65 + noise(q * 2.3 + 4.0) * 0.35;
    float wisp = smoothstep(0.25 + vAge * 0.2, 0.85, n);
    float a = soft * soft * mix(1.0, wisp, 0.35 + vAge * 0.55) * vAlpha;
    // Fresh smoke off the tip is faintly blue; it greys as it spreads.
    vec3 colour = mix(vec3(0.62, 0.66, 0.74), vec3(0.62, 0.6, 0.57), vAge);
    gl_FragColor = vec4(colour, a);
  }
`;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Smoke rising from the lit cigarette in the ashtray, the way real cigarette
 * smoke goes: a thin, steady thread straight up off the tip (laminar), which
 * a few centimetres higher starts to waver, then breaks into curls that spread
 * and thin into the air (turbulent). The waver is shared along the height
 * (a wave travelling up the column) so the puffs line up into one continuous
 * ribbon instead of drifting apart one by one; each puff adds its own spread
 * only once the thread has broken up.
 *
 * One Points draw call, positions in closed form from the clock (no
 * per-particle state, no React state), buffers mutated in place. Normal
 * blending with depth write off keeps it a pale veil, not a glow.
 */
export function DeskSmoke({ at }: { at: Vector3Tuple }) {
  const { geometry, material, phases } = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute("aSize", new BufferAttribute(new Float32Array(COUNT), 1));
    g.setAttribute("aAlpha", new BufferAttribute(new Float32Array(COUNT), 1));
    g.setAttribute("aAge", new BufferAttribute(new Float32Array(COUNT), 1));
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) seeds[i] = ((i * 7919) % 1000) / 1000;
    g.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    const m = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: { uScale: { value: 1 } },
      transparent: true,
      depthWrite: false,
    });
    const p = Array.from({ length: COUNT }, (_, i) => ({
      offset: i / COUNT,
      // Each puff's own drift once the thread breaks: a direction and amount.
      dx: ((i * 104729) % 100) / 100 - 0.5,
      dz: ((i * 1299709) % 100) / 100 - 0.5,
      curl: 0.6 + ((i * 15485863) % 100) / 100,
    }));
    return { geometry: g, material: m, phases: p };
  }, []);

  const points = useRef<Points>(null);
  useFrame(({ clock, gl, camera }) => {
    const pos = geometry.getAttribute("position") as BufferAttribute;
    const size = geometry.getAttribute("aSize") as BufferAttribute;
    const alpha = geometry.getAttribute("aAlpha") as BufferAttribute;
    const age = geometry.getAttribute("aAge") as BufferAttribute;
    const T = clock.elapsedTime;
    const time = T / LIFE;
    // A slow draught that leans the whole plume now and then.
    const draught = Math.sin(T * 0.23) * 0.5 + Math.sin(T * 0.071 + 1.7) * 0.5;
    for (let i = 0; i < COUNT; i++) {
      const { offset, dx, dz, curl } = phases[i];
      const t = (time + offset) % 1;
      // Rising smoke slows as it cools.
      const h = RISE * (1 - (1 - t) * (1 - t) * 0.55 - 0.45 * (1 - t));
      // 0 in the laminar thread, rising to 1 where it has broken into curls.
      const k = smoothstep(0.08, 0.55, t);
      const amp = 0.002 + 0.035 * k * k;
      // The wave travelling up the column (shared by every puff at a height).
      const wx = Math.sin(h * 20 - T * 1.4) + 0.55 * Math.sin(h * 37 - T * 2.3 + 1.3);
      const wz = Math.cos(h * 17 - T * 1.1 + 0.6) + 0.5 * Math.sin(h * 29 - T * 1.9);
      // Each puff's own curl and spread, only once turbulent.
      const spin = t * 12 * curl + i;
      const spread = 0.045 * k * k;
      pos.setXYZ(
        i,
        at[0] + wx * amp + dx * spread + Math.sin(spin) * 0.012 * k + draught * 0.04 * t * t,
        at[1] + h,
        at[2] + wz * amp + dz * spread + Math.cos(spin) * 0.012 * k,
      );
      size.setX(i, 0.012 + 0.08 * Math.pow(t, 1.4));
      // Dense in the thin thread, thinning as it spreads; quick fade-in at the tip.
      alpha.setX(i, Math.min(t * 14, 1) * Math.pow(1 - t, 1.5) * (0.3 - 0.1 * k));
      age.setX(i, t);
    }
    pos.needsUpdate = size.needsUpdate = alpha.needsUpdate = age.needsUpdate = true;
    const fov = "fov" in camera ? (camera.fov as number) : 40;
    if (points.current) {
      (points.current.material as ShaderMaterial).uniforms.uScale.value =
        gl.domElement.height / (2 * Math.tan((fov * Math.PI) / 360));
    }
  });

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      // Smoke is not a click target (Points raycast with a 1 m threshold).
      raycast={() => null}
    />
  );
}
