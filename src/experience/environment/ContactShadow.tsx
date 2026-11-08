import { useEffect, useMemo } from "react";
import { type CanvasTexture, MeshBasicMaterial } from "three";
import { DESK_TOP } from "./worldAnchors";

/**
 * A flat contact-shadow blob on the desk. `along` is the footprint's long
 * axis length (along local x before `yaw`), `across` the short one.
 */
export function ContactShadow({
  at,
  yaw,
  along,
  across,
  opacity,
  map,
}: {
  at: [number, number];
  yaw: number;
  along: number;
  across: number;
  opacity: number;
  map: CanvasTexture;
}) {
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        map,
        transparent: true,
        opacity,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        toneMapped: false,
      }),
    [map, opacity],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <group position={[at[0], DESK_TOP + 0.0008, at[1]]} rotation={[0, yaw, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} material={material}>
        <planeGeometry args={[along, across]} />
      </mesh>
    </group>
  );
}
