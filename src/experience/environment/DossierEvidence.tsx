import { useEffect, useMemo } from "react";
import { CanvasTexture, FrontSide, SRGBColorSpace } from "three";
import { paintApartmentPhoto, paintSilhouettePhoto } from "../surfaces/paintDossierPhotos";

/** Deterministic print grain plus a warm sepia tone over one canvas region. */
function toneAndGrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
) {
  const pixels = ctx.getImageData(x, y, w, h);
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const gray =
      pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722;
    const v = gray + (seed / 2147483647 - 0.5) * 22;
    pixels.data[i] = Math.max(0, Math.min(255, v * 1.02));
    pixels.data[i + 1] = Math.max(0, Math.min(255, v * 0.94));
    pixels.data[i + 2] = Math.max(0, Math.min(255, v * 0.8));
  }
  ctx.putImageData(pixels, x, y);
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function Polaroid({
  variant,
  caption,
  position,
  angle,
}: {
  variant: 0 | 1;
  caption: string;
  position: [number, number, number];
  angle: number;
}) {
  const print = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 768;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f2ead7";
    ctx.fillRect(0, 0, 640, 768);
    paintSilhouettePhoto(ctx, 34, 34, 572, variant);
    toneAndGrain(ctx, 34, 34, 572, 572, 404 + variant);
    ctx.strokeStyle = "#b8af9b";
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, 572, 572);
    ctx.fillStyle = "#504537";
    ctx.font = '25px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText(caption, 320, 676);
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = "#81715c";
    ctx.fillText("CASE 404 / NO FACE ON FILE", 320, 721);
    return toTexture(canvas);
  }, [variant, caption]);
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

/** Residence record card: a dusk photo of the subject's apartment block. */
function paintResidenceCard() {
  const w = 784;
  const h = 1054;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e7dfc7";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#8e221d";
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillText("CASE 404 / RESIDENCE RECORD", 44, 72);
  ctx.fillStyle = "#1f1b17";
  ctx.fillRect(44, 88, w - 88, 3);

  const px = 44;
  const py = 120;
  const pw = w - 88;
  const ph = 640;
  ctx.fillStyle = "#d8d4c6";
  ctx.fillRect(px - 14, py - 14, pw + 28, ph + 28);
  paintApartmentPhoto(ctx, px, py, pw, ph);
  toneAndGrain(ctx, px, py, pw, ph, 77);
  ctx.fillStyle = "rgba(235,228,205,0.55)"; // tape
  ctx.fillRect(px - 20, py - 18, 120, 36);
  ctx.fillRect(px + pw - 100, py - 18, 120, 36);

  ctx.fillStyle = "#504537";
  ctx.font = '26px "Courier New", monospace';
  ctx.fillText("RESIDENCE / UNIT NOT CONFIRMED", 44, 828);
  ctx.font = '19px "Courier New", monospace';
  ctx.fillStyle = "#81715c";
  ctx.fillText("ADDRESS:   WITHHELD", 44, 876);
  ctx.fillText("TENANT:    UNKNOWN", 44, 910);
  ctx.fillText("LAST SEEN: NOT RECORDED", 44, 944);
  ctx.fillStyle = "#1f1b17";
  ctx.fillRect(44, 976, w - 88, 2);
  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = "#81715c";
  ctx.fillText("FILE REF. CASE 404 / R-01", 44, 1010);
  return toTexture(canvas);
}

/** All three artifacts inherit the actual cover pose from Dossier's attachment. */
export function DossierEvidence() {
  const card = useMemo(() => paintResidenceCard(), []);
  useEffect(() => () => card.dispose(), [card]);
  return (
    <group
      name="dossier-left-evidence"
      position={[-1.12, 0.025, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <Polaroid
        variant={0}
        caption="01 / SUBJECT, UNIDENTIFIED"
        position={[-0.43, 0.68, 0.012]}
        angle={-0.065}
      />
      <Polaroid
        variant={1}
        caption="02 / LAST KNOWN SIGHTING"
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
          <meshStandardMaterial map={card} roughness={0.95} side={FrontSide} />
        </mesh>
      </group>
    </group>
  );
}
