import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { CanvasTexture, FrontSide, ImageLoader, SRGBColorSpace } from "three";
import { createPaperBump, paintPaperFinish } from "../surfaces/paperFinish";
import { PaperContactShadow } from "./PaperContactShadow";
import { useFocusable } from "../camera/focus";
import { dossierReadable } from "./dossierState";

/**
 * The subject's photographs (public/images/profile), laid inside the cover as
 * square prints. `crop` is the square of the source shown in the window (x, y,
 * side, in source pixels); without one, the source is square already. The
 * graduation portrait's square sits inside its white studio mount and the
 * bevelled line round it, high enough to keep the face and the stole.
 */
const PHOTOS = {
  graduation: {
    url: "/images/profile/subject-graduation.jpg",
    crop: [46, 70, 658] as const,
  },
  field: { url: "/images/profile/subject-field.jpg" },
  id: { url: "/images/profile/subject-id.jpg" },
};

/**
 * A print's canvas: square, the photograph's square inside an even white
 * border all round. 0.97 a side in the cover's units.
 */
const POLAROID = { w: 768, h: 768, border: 44, side: 680 };
const POLAROID_SIZE = [0.97, 0.97] as const;

/**
 * Turns a canvas region to black and white, with deterministic print grain,
 * so the prints sit in the file as old photographs, not screenshots.
 */
function monoAndGrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
) {
  const pixels = ctx.getImageData(x, y, w, h);
  const d = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const grain = (seed / 2147483647 - 0.5) * 14;
    const gray = d[i] * 0.2126 + d[i + 1] * 0.7152 + d[i + 2] * 0.0722;
    d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, gray + grain));
  }
  ctx.putImageData(pixels, x, y);
}

/** One print: the photograph's square, black and white, in its white border, no caption. */
function paintPolaroid(
  img: HTMLImageElement,
  crop: readonly [number, number, number] | undefined,
  seed: number,
) {
  const { w, h, border, side } = POLAROID;
  const [sx, sy, ss] = crop ?? [0, 0, Math.min(img.width, img.height)];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  // Toned pixel by pixel (getImageData): keep it on the CPU.
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#f6f3ec";
  ctx.fillRect(0, 0, w, h);
  paintPaperFinish(ctx, w, h);
  ctx.drawImage(img, sx, sy, ss, ss, border, border, side, side);
  monoAndGrain(ctx, border, border, side, side, seed);
  ctx.strokeStyle = "rgba(120,108,88,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(border, border, side, side);
  return canvas;
}

function Polaroid({
  canvas,
  position,
  angle,
}: {
  canvas: HTMLCanvasElement;
  position: [number, number, number];
  angle: number;
}) {
  const [width, height] = POLAROID_SIZE;
  const bump = useMemo(() => createPaperBump(), []);
  useEffect(() => () => bump.dispose(), [bump]);
  const map = useMemo(() => {
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, [canvas]);
  useEffect(() => () => map.dispose(), [map]);
  const focus = useFocusable(dossierReadable, { label: "Inspect photo" });
  return (
    <group position={position} rotation={[0, 0, angle]}>
      <PaperContactShadow width={width} height={height} />
      <mesh receiveShadow castShadow {...focus}>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          map={map}
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

/**
 * The left cover's contents, inheriting the cover pose from Dossier's
 * attachment: the graduation portrait and the ID photograph down the left,
 * the field shot in the middle, all square black-and-white prints. They stay
 * put whichever sheet is on top of the stack.
 */
export function DossierEvidence() {
  const [graduation, field, id] = useLoader(ImageLoader, [
    PHOTOS.graduation.url,
    PHOTOS.field.url,
    PHOTOS.id.url,
  ]);
  const canvases = useMemo(
    () => ({
      graduation: paintPolaroid(graduation, PHOTOS.graduation.crop, 404),
      field: paintPolaroid(field, undefined, 405),
      id: paintPolaroid(id, undefined, 406),
    }),
    [graduation, field, id],
  );
  return (
    <group
      name="dossier-left-evidence"
      position={[-1.12, 0.025, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <Polaroid canvas={canvases.graduation} position={[-0.43, 0.68, 0.012]} angle={-0.065} />
      <Polaroid canvas={canvases.id} position={[-0.38, -0.61, 0.017]} angle={0.055} />
      <Polaroid canvas={canvases.field} position={[0.52, -0.02, 0.024]} angle={-0.04} />
    </group>
  );
}
