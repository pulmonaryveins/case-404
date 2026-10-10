import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { CanvasTexture, FrontSide, Mesh, MeshStandardMaterial, SRGBColorSpace } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { boardIslands, type BoardPieceId } from "../surfaces/boardIslands";
import { paintApartmentPhoto } from "../surfaces/paintDossierPhotos";
import { createPaperBump, paintPaperFinish } from "../surfaces/paperFinish";
import { PaperContactShadow } from "./PaperContactShadow";
import { useFocusable } from "../camera/focus";
import { dossierReadable } from "./dossierState";

/** Unwrap the board's photo UV island into an upright print. */
function boardPhoto(
  source: CanvasImageSource & { width: number; height: number },
  id: BoardPieceId,
) {
  const { uv, right, down } = boardIslands[id];
  const [x0, y0, x1, y1] = uv.map((n, i) => n * (i % 2 ? source.height : source.width));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(right[0] ? x1 - x0 : y1 - y0);
  canvas.height = Math.round(down[0] ? x1 - x0 : y1 - y0);
  const ox = right[0] === 1 || down[0] === 1 ? x0 : x1;
  const oy = right[1] === 1 || down[1] === 1 ? y0 : y1;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(
    right[0],
    down[0],
    right[1],
    down[1],
    -(right[0] * ox + right[1] * oy),
    -(down[0] * ox + down[1] * oy),
  );
  ctx.drawImage(source, 0, 0);
  return canvas;
}

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
  photo,
  caption,
  position,
  angle,
}: {
  photo: HTMLCanvasElement;
  caption: string;
  position: [number, number, number];
  angle: number;
}) {
  const bump = useMemo(() => createPaperBump(), []);
  useEffect(() => () => bump.dispose(), [bump]);
  const print = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 768;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f2ead7";
    ctx.fillRect(0, 0, 640, 768);
    paintPaperFinish(ctx, 640, 768);
    const crop = Math.min(photo.width, photo.height) * 0.86;
    ctx.drawImage(
      photo,
      (photo.width - crop) / 2,
      (photo.height - crop) / 2,
      crop,
      crop,
      34,
      34,
      572,
      572,
    );
    toneAndGrain(ctx, 34, 34, 572, 572, 404);
    ctx.strokeStyle = "#b8af9b";
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 34, 572, 572);
    ctx.fillStyle = "#10110f";
    ctx.font = 'bold 34px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText(caption, 320, 676);
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillStyle = "#26241e";
    ctx.fillText("CASE 404 / BOARD ARCHIVE", 320, 721);
    return toTexture(canvas);
  }, [photo, caption]);
  useEffect(() => () => print.dispose(), [print]);
  const focus = useFocusable(dossierReadable, { label: "Inspect photo" });
  return (
    <group position={position} rotation={[0, 0, angle]}>
      <PaperContactShadow width={0.97} height={1.164} />
      {/* Front-only mounting paper: a solid box exposed a blank reverse
          through the cover while opening. These prints live inside it. */}
      <mesh receiveShadow>
        <planeGeometry args={[0.97, 1.164]} />
        <meshStandardMaterial color="#e8deca" roughness={0.9} side={FrontSide} />
      </mesh>
      <mesh position={[0, 0, 0.005]} receiveShadow castShadow {...focus}>
        <planeGeometry args={[0.965, 1.159]} />
        <meshPhysicalMaterial
          map={print}
          bumpMap={bump}
          bumpScale={0.0015}
          roughness={0.95}
          specularIntensity={0.12}
          side={FrontSide}
        />
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
  paintPaperFinish(ctx, w, h);
  ctx.fillStyle = "#641b18";
  ctx.font = 'bold 30px "Courier New", monospace';
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

  ctx.fillStyle = "#10110f";
  ctx.font = 'bold 34px "Courier New", monospace';
  ctx.fillText("RESIDENCE / UNCONFIRMED", 44, 828);
  ctx.font = 'bold 29px "Courier New", monospace';
  ctx.fillStyle = "#26241e";
  ctx.fillText("ADDRESS:   WITHHELD", 44, 876);
  ctx.fillText("TENANT:    UNKNOWN", 44, 910);
  ctx.fillText("LAST SEEN: NOT RECORDED", 44, 944);
  ctx.fillStyle = "#1f1b17";
  ctx.fillRect(44, 976, w - 88, 2);
  ctx.font = 'bold 26px "Courier New", monospace';
  ctx.fillStyle = "#26241e";
  ctx.fillText("FILE REF. CASE 404 / R-01", 44, 1010);
  return toTexture(canvas);
}

/** All three artifacts inherit the actual cover pose from Dossier's attachment. */
export function DossierEvidence() {
  const bump = useMemo(() => createPaperBump(), []);
  useEffect(() => () => bump.dispose(), [bump]);
  const { scene } = useGLTF(assetManifest.investigationBoard.url);
  const photos = useMemo(() => {
    let atlas: CanvasImageSource & { width: number; height: number };
    scene.traverse((node) => {
      if (!(node instanceof Mesh) || atlas) return;
      const map = (node.material as MeshStandardMaterial).map;
      if (map) atlas = map.userData.originalImage ?? map.image;
    });
    return [boardPhoto(atlas!, "Plane061__0"), boardPhoto(atlas!, "Plane067__0")];
  }, [scene]);
  const card = useMemo(() => paintResidenceCard(), []);
  const focus = useFocusable(dossierReadable, { label: "Inspect record" });
  useEffect(() => () => card.dispose(), [card]);
  return (
    <group
      name="dossier-left-evidence"
      position={[-1.12, 0.025, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <Polaroid
        photo={photos[0]}
        caption="01 / STREET SCENE"
        position={[-0.43, 0.68, 0.012]}
        angle={-0.065}
      />
      <Polaroid
        photo={photos[1]}
        caption="02 / STREET ARCHIVE"
        position={[-0.38, -0.61, 0.017]}
        angle={0.055}
      />
      <group position={[0.52, -0.02, 0.041]} rotation={[0, 0, -0.055]}>
        <PaperContactShadow width={0.98} height={1.317} />
        <mesh receiveShadow>
          <planeGeometry args={[0.98, 1.317]} />
          <meshStandardMaterial color="#e7dfc7" roughness={1} side={FrontSide} />
        </mesh>
        <mesh position={[0, 0, 0.003]} receiveShadow castShadow {...focus}>
          <planeGeometry args={[0.976, 1.3115]} />
          <meshPhysicalMaterial
            map={card}
            bumpMap={bump}
            bumpScale={0.002}
            roughness={1}
            specularIntensity={0.12}
            side={FrontSide}
          />
        </mesh>
      </group>
    </group>
  );
}
