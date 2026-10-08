import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, type Points, ShaderMaterial } from "three";
import type { Vector3Tuple } from "../../types/common";

const COUNT = 28;
const RISE = 0.34;
const LIFE = 6.5;

const vertex = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vAlpha = aAlpha;
    gl_PointSize = aSize * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float soft = smoothstep(1.0, 0.0, d);
    gl_FragColor = vec4(vec3(0.6, 0.55, 0.5), soft * soft * vAlpha);
  }
`;

/**
 * A thin plume rising from the lit cigarette in the ashtray. One Points draw
 * call and 28 particles, advanced by closed-form position from the clock — no
 * per-particle state, no React state, and the buffers are mutated in place.
 * Normal blending with depth write off keeps it a pale veil that sits over
 * the lamp's pool instead of glowing on its own.
 */
export function DeskSmoke({ at }: { at: Vector3Tuple }) {
  const { geometry, material, phases } = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute("aSize", new BufferAttribute(new Float32Array(COUNT), 1));
    g.setAttribute("aAlpha", new BufferAttribute(new Float32Array(COUNT), 1));
    const m = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: { uScale: { value: 1 } },
      transparent: true,
      depthWrite: false,
    });
    const p = Array.from({ length: COUNT }, (_, i) => ({
      offset: i / COUNT,
      sway: 0.6 + ((i * 7919) % 100) / 100,
      lean: ((i * 104729) % 100) / 100 - 0.5,
    }));
    return { geometry: g, material: m, phases: p };
  }, []);

  const points = useRef<Points>(null);
  useFrame(({ clock, gl, camera }) => {
    const pos = geometry.getAttribute("position") as BufferAttribute;
    const size = geometry.getAttribute("aSize") as BufferAttribute;
    const alpha = geometry.getAttribute("aAlpha") as BufferAttribute;
    const time = clock.elapsedTime / LIFE;
    for (let i = 0; i < COUNT; i++) {
      const { offset, sway, lean } = phases[i];
      const t = (time + offset) % 1;
      const angle = t * 9 * sway + i;
      pos.setXYZ(
        i,
        at[0] + Math.sin(angle) * 0.012 * t + lean * 0.05 * t,
        at[1] + t * RISE,
        at[2] + Math.cos(angle) * 0.012 * t,
      );
      size.setX(i, 0.018 + t * 0.085);
      alpha.setX(i, Math.min(t * 6, 1) * (1 - t) * 0.42);
    }
    pos.needsUpdate = size.needsUpdate = alpha.needsUpdate = true;
    const fov = "fov" in camera ? (camera.fov as number) : 40;
    if (points.current) {
      (points.current.material as ShaderMaterial).uniforms.uScale.value =
        gl.domElement.height / (2 * Math.tan((fov * Math.PI) / 360));
    }
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}
