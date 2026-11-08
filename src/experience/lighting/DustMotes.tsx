import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  type Points,
  ShaderMaterial,
} from "three";
import type { Vector3Tuple } from "../../types/common";

/** Deterministic 0..1 noise, so the motes sit in the same places every load. */
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform vec3 uSource;
  uniform float uReach;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    // Slow Brownian-ish drift and a gentle rise, all on the GPU.
    float t = uTime * (0.05 + 0.05 * aSeed);
    p += vec3(sin(t * 3.1 + aSeed * 40.0), sin(t * 2.3 + aSeed * 17.0), cos(t * 2.7 + aSeed * 29.0)) * 0.025;
    p.y += mod(uTime * 0.004 * (0.5 + aSeed) + aSeed, 1.0) * 0.03;
    // Only motes inside the light read: fade with distance from the source,
    // and a slow twinkle as each one turns in the beam.
    float d = distance(p, uSource);
    vAlpha = smoothstep(uReach, uReach * 0.25, d) * (0.6 + 0.4 * sin(uTime * (0.6 + aSeed) + aSeed * 60.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (0.6 + aSeed * 0.8) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

interface Props {
  /** Where the light comes from, in the parent's space. */
  source: Vector3Tuple;
  /** Box the motes fill: min and max corners, parent space. */
  min: Vector3Tuple;
  max: Vector3Tuple;
  /** Beyond this distance from the source a mote is invisible. */
  reach?: number;
  count?: number;
  opacity?: number;
  /** 0..1 each frame: how lit the source is (an unlit lamp shows no dust). */
  level?: () => number;
}

/**
 * Dust drifting through a light's beam: soft additive points that only show
 * near the source, so they read as motes caught in the lamplight rather than
 * a cloud in the room. One draw call, no per-frame CPU work beyond a uniform.
 */
export function DustMotes({
  source,
  min,
  max,
  reach = 0.45,
  count = 90,
  opacity = 0.55,
  level,
}: Props) {
  const dpr = useThree((s) => s.viewport.dpr);
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 3; k++) {
        positions[i * 3 + k] = min[k] + hash(i * 3 + k) * (max[k] - min[k]);
      }
      seeds[i] = hash(i + 1000);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    const material = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 5 * dpr },
        uSource: { value: source },
        uReach: { value: reach },
        uColor: { value: [1, 0.86, 0.66] },
        uOpacity: { value: opacity },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { geometry, material };
    // Static props per lamp; only rebuilt if the renderer's pixel ratio changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dpr, count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const points = useRef<Points>(null);
  useFrame(({ clock }) => {
    const m = points.current?.material as ShaderMaterial | undefined;
    if (!m) return;
    m.uniforms.uTime.value = clock.elapsedTime;
    m.uniforms.uOpacity.value = opacity * (level ? level() : 1);
  });

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      // Not clickable: Points raycast with a 1 m threshold, which turned the
      // whole beam round a lamp into a hitbox for it.
      raycast={() => null}
    />
  );
}
