import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { CanvasTexture, FrontSide, SRGBColorSpace } from "three";

function Polaroid({
  url,
  caption,
  position,
  angle,
}: {
  url: string;
  caption: string;
  position: [number, number, number];
  angle: number;
}) {
  const photo = useTexture(url);
  const print = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 768;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f2ead7";
    ctx.fillRect(0, 0, 640, 768);
    const img = photo.image as HTMLImageElement;
    const size = Math.min(img.width, img.height);
    ctx.save();
    ctx.filter = "grayscale(1) contrast(1.16) brightness(0.96)";
    ctx.drawImage(
      img,
      (img.width - size) / 2,
      (img.height - size) / 2,
      size,
      size,
      34,
      34,
      572,
      572,
    );
    ctx.restore();
    // Fine, deterministic monochrome print grain, confined to the photo.
    const pixels = ctx.getImageData(34, 34, 572, 572);
    let seed = 404;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const gray =
        pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722;
      const value = Math.max(0, Math.min(255, gray + (seed / 2147483647 - 0.5) * 9));
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
    }
    ctx.putImageData(pixels, 34, 34);
    ctx.strokeStyle = "#b8af9b";
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, 572, 572);
    ctx.fillStyle = "#504537";
    ctx.font = '25px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText(caption, 320, 676);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = "#81715c";
    ctx.fillText("PHILIPPINES / EVERYDAY LIFE", 320, 721);
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, [photo, caption]);
  useEffect(() => () => print.dispose(), [print]);
  return (
    <group position={position} rotation={[0, 0, angle]}>
      {/* Front-only mounting paper: a solid box exposed a blank reverse
          through the cover while opening. These prints live inside it. */}
      <mesh receiveShadow>
        <planeGeometry args={[0.97, 1.164]} />
        <meshStandardMaterial color="#e8deca" roughness={0.9} side={FrontSide} />
      </mesh>
      <mesh position={[0, 0, 0.005]} receiveShadow>
        <planeGeometry args={[0.965, 1.159]} />
        <meshStandardMaterial map={print} roughness={0.7} side={FrontSide} />
      </mesh>
    </group>
  );
}

/** All three artifacts inherit the actual cover pose from Dossier's attachment. */
export function DossierEvidence() {
  const map = useTexture("/images/dossier/philippines.svg", (texture) => {
    if (!Array.isArray(texture)) {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 8;
    }
  });
  return (
    <group
      name="dossier-left-evidence"
      position={[-1.12, 0.025, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <Polaroid
        url="/images/dossier/market.jpg"
        caption="01 / CARBON MARKET"
        position={[-0.43, 0.68, 0.012]}
        angle={-0.065}
      />
      <Polaroid
        url="/images/dossier/street.jpg"
        caption="02 / A MORNING WALK"
        position={[-0.38, -0.61, 0.017]}
        angle={0.055}
      />
      <group position={[0.52, -0.02, 0.041]} rotation={[0, 0, -0.055]}>
        <mesh receiveShadow>
          <planeGeometry args={[0.98, 1.317]} />
          <meshStandardMaterial color="#e7dfc7" roughness={1} side={FrontSide} />
        </mesh>
        <mesh position={[0, 0, 0.003]} receiveShadow>
          <planeGeometry args={[0.976, 1.3115]} />
          <meshStandardMaterial map={map} roughness={0.95} side={FrontSide} />
        </mesh>
      </group>
    </group>
  );
}
