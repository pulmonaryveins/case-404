import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { shadowsChanged, shadowsDue } from "./shadowUpdates";

/**
 * Redraws the shadow maps only when they are due (see shadowUpdates): when
 * something that casts a shadow moves, when a light changes, and when new
 * models or textures arrive (the renderer's geometry and texture counts
 * change as the scene streams in). Mounted once, inside the Canvas.
 */
export function ShadowDriver() {
  const seen = useRef("");
  useFrame(({ gl }) => {
    if (gl.shadowMap.autoUpdate) {
      gl.shadowMap.autoUpdate = false;
      // The first seconds: models and textures are still arriving.
      shadowsChanged(4000);
    }
    const { geometries, textures } = gl.info.memory;
    const now = `${geometries}/${textures}`;
    if (now !== seen.current) {
      seen.current = now;
      shadowsChanged(500);
    }
    if (shadowsDue()) gl.shadowMap.needsUpdate = true;
  });
  return null;
}
