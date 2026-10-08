import { useEffect, useMemo } from "react";
import { CanvasTexture, FrontSide } from "three";

/** Subtle local occlusion, supplementing the room's real cast shadows.
 * Travels with the paper so it stays aligned throughout folder opening.
 */
export function PaperContactShadow({ width, height }: { width: number; height: number }) {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.filter = "blur(5px)";
    ctx.fillStyle = "rgba(24,18,12,0.16)";
    ctx.fillRect(18, 20, 218, 218);
    ctx.filter = "blur(2px)";
    ctx.fillStyle = "rgba(24,18,12,0.10)";
    ctx.fillRect(18, 18, 218, 218);
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh position={[width * 0.006, -height * 0.006, -0.002]}>
      <planeGeometry args={[width * 1.17, height * 1.17]} />
      <meshBasicMaterial
        map={map}
        transparent
        depthWrite={false}
        toneMapped={false}
        side={FrontSide}
      />
    </mesh>
  );
}
