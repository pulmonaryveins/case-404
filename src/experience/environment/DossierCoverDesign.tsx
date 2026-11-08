import { useEffect, useMemo } from "react";
import { CanvasTexture, FrontSide, SRGBColorSpace } from "three";
import { paintCover } from "../surfaces/paintDossierCover";

/** Transparent printed artwork: the original cardboard remains visible. */
export function DossierCoverDesign() {
  const { map, bump } = useMemo(() => {
    const { color, height } = paintCover();
    const map = new CanvasTexture(color);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 8;
    const bump = new CanvasTexture(height);
    bump.anisotropy = 8;
    return { map, bump };
  }, []);
  useEffect(
    () => () => {
      map.dispose();
      bump.dispose();
    },
    [map, bump],
  );
  return (
    <group position={[-1.12, -0.018, 0]} rotation={[Math.PI / 2, 0, Math.PI]}>
      <mesh receiveShadow>
        <planeGeometry args={[1.85, 2.65]} />
        <meshPhysicalMaterial
          map={map}
          bumpMap={bump}
          bumpScale={0.6}
          transparent
          alphaTest={0.02}
          depthWrite={false}
          roughness={1}
          specularIntensity={0.1}
          side={FrontSide}
        />
      </mesh>
    </group>
  );
}
