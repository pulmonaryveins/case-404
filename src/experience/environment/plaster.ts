import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { DoubleSide, type BufferGeometry, type MeshStandardMaterial } from "three";
import { assetManifest } from "../../assets/assetManifest";

/**
 * The plaster modules' UV layout, measured from the GLB's front face: one
 * texture repeat per metre, with u running UP the wall and v ALONG it
 * (rotated against the usual layout). Surfaces built in code remap their
 * plain 0..1 UVs to match, so the grain is the same size and direction as on
 * the modules. Getting this backwards stretched the grain ~10x and the curves
 * read as smooth paint.
 */
export function plasterUVs(geometry: BufferGeometry, w: number, h: number) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const along = uv.getX(i) * w;
    const up = uv.getY(i) * h;
    uv.setXY(i, up, along);
  }
  return geometry;
}

/**
 * The plaster modules' own material, double-sided, for the walls built in
 * code (the side walls and the rounded corners), so every wall in the room
 * shares one colour, grain and response to light.
 */
export function usePlaster() {
  const { materials } = useGLTF(assetManifest.plasterWall.url);
  const plaster = useMemo(() => {
    // Model gives the modules the manifest colour (map dropped) when they
    // mount, which can be after this clone: apply it here too, or these
    // surfaces keep the GLB's raw dark-green base colour.
    const m = (Object.values(materials)[0] as MeshStandardMaterial).clone();
    m.map = null;
    m.color.set(assetManifest.plasterWall.color);
    m.side = DoubleSide;
    return m;
  }, [materials]);
  useEffect(() => () => plaster.dispose(), [plaster]);
  return plaster;
}
