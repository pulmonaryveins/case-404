import { useEffect, useMemo } from "react";
import { CanvasTexture, FrontSide, SRGBColorSpace } from "three";

/** Transparent printed artwork: the original cardboard remains visible. */
export function DossierCoverDesign() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1460;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.translate(512, 485);
    ctx.rotate(-0.025);
    ctx.strokeStyle = ctx.fillStyle = "#642820";
    ctx.lineWidth = 9;
    ctx.strokeRect(-422, -105, 844, 210);
    ctx.textAlign = "center";
    ctx.font = 'bold 142px "Arial Narrow", Impact, sans-serif';
    ctx.fillText("CASE 404", 0, 53, 750);
    ctx.restore();

    // Break up the ink itself, leaving the cardboard visible through wear.
    ctx.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 2400; i++) {
      const x = (i * 179 + 43) % 1024;
      const y = 365 + ((i * 73) % 244);
      ctx.fillStyle = i % 3 ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.7)";
      ctx.fillRect(x, y, 1 + (i % 4), 1 + (i % 3));
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#292820";
    ctx.textAlign = "center";
    ctx.font = 'italic 49px "Segoe Print", "Courier New", cursive';
    ctx.fillText("INCOMPLETE FILE", 512, 705);
    ctx.strokeStyle = "#292820";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(230, 747);
    ctx.quadraticCurveTo(510, 715, 798, 749);
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.font = '24px "Courier New", monospace';
    ctx.fillText("SUBJECT UNKNOWN / RECORD 01", 512, 1268);
    ctx.font = 'bold 28px "Courier New", monospace';
    ctx.fillText("CONFIDENTIAL", 512, 1315);
    ctx.globalAlpha = 1;

    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group position={[-1.12, -0.018, 0]} rotation={[Math.PI / 2, 0, Math.PI]}>
      <mesh receiveShadow>
        <planeGeometry args={[1.85, 2.65]} />
        <meshPhysicalMaterial
          map={texture}
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
