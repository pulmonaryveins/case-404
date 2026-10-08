import { useEffect, useMemo } from "react";
import {
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  FrontSide,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import { paintPortrait } from "../surfaces/paintCaseBoard";

/** The board's anonymous subject print, now clipped onto the profile sheet. */
export function DossierPortrait() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 384;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#eee7d5";
    ctx.fillRect(0, 0, 384, 512);
    paintPortrait(ctx, 22, 22, 340, 418);
    // A handled photographic print, not an image printed onto the profile.
    const random = (index: number) => {
      const value = Math.sin(index * 127.1 + 404) * 43758.5453;
      return value - Math.floor(value);
    };
    for (let i = 0; i < 3500; i++) {
      const x = random(i * 5) * 384;
      const y = random(i * 5 + 1) * 512;
      if (x > 22 && x < 362 && y > 22 && y < 440) continue;
      ctx.fillStyle = `rgba(85,60,35,${0.04 + random(i * 5 + 2) * 0.15})`;
      ctx.fillRect(x, y, 1 + random(i * 5 + 3) * 4, 1 + random(i * 5 + 4) * 2);
    }
    ctx.strokeStyle = "#b8a788";
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 380, 508);
    ctx.fillStyle = "rgba(130,100,61,0.24)";
    ctx.beginPath();
    ctx.moveTo(335, 512);
    ctx.lineTo(384, 472);
    ctx.lineTo(384, 512);
    ctx.fill();
    ctx.fillStyle = "#171814";
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText("SUBJECT / 404", 192, 482);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, []);
  const print = useMemo(() => {
    const face = new PlaneGeometry(0.46, 0.59, 16, 20);
    const stock = new BoxGeometry(0.46, 0.59, 0.004, 16, 20, 1);
    for (const geometry of [face, stock]) {
      const positions = geometry.getAttribute("position");
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        // Pinned at the top; the lower outer corner gently lifts off the sheet.
        const lower = Math.max(0, (0.295 - y) / 0.59);
        const corner = Math.max(0, (x + 0.23) / 0.46);
        positions.setZ(i, positions.getZ(i) + 0.035 * lower ** 3 * corner ** 2);
      }
      geometry.computeVertexNormals();
    }
    return { face, stock };
  }, []);
  const clip = useMemo(
    () =>
      new CatmullRomCurve3(
        [
          new Vector3(-0.012, -0.045, 0.006),
          new Vector3(-0.012, 0.06, 0.006),
          new Vector3(0.005, 0.078, 0.006),
          new Vector3(0.022, 0.06, 0.006),
          new Vector3(0.022, -0.07, 0.006),
          new Vector3(0, -0.092, 0.006),
          new Vector3(-0.03, -0.07, 0.006),
          new Vector3(-0.03, 0.072, 0.006),
          new Vector3(-0.012, 0.098, -0.004),
          new Vector3(0.01, 0.077, -0.024),
          new Vector3(0.01, -0.057, -0.024),
        ],
        false,
        "centripetal",
      ),
    [],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(
    () => () => {
      print.face.dispose();
      print.stock.dispose();
    },
    [print],
  );
  return (
    <group position={[0.7, 0.108, -0.99]} rotation={[-Math.PI / 2, 0, -0.065]}>
      <mesh geometry={print.stock} castShadow receiveShadow>
        <meshStandardMaterial color="#b9a98c" roughness={1} />
      </mesh>
      <mesh geometry={print.face} position={[0, 0, 0.0025]} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={texture}
          roughness={1}
          specularIntensity={0.12}
          side={FrontSide}
        />
      </mesh>
      <mesh position={[-0.15, 0.265, 0.005]} castShadow receiveShadow>
        <tubeGeometry args={[clip, 80, 0.0045, 10, false]} />
        <meshStandardMaterial color="#bfc3c5" metalness={0.72} roughness={0.24} />
      </mesh>
    </group>
  );
}
