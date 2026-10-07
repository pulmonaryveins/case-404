import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  CanvasTexture,
  DoubleSide,
  FrontSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  SRGBColorSpace,
  type Texture,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { storyRig } from "../../story/storyRig";
import { paintAboutPage } from "../surfaces/paintDossierPages";
import { DossierRecords } from "./DossierRecords";
import { DossierEvidence } from "./DossierEvidence";

/**
 * Morph-target frames of the folder's recorded animation: 0 = closed,
 * OPEN_FRAME = cover flat on the desk (the clip then holds and closes).
 */
const OPEN_FRAME = 88;

/** Page planes in folder-local units (folder is 2.28 x 3.1 before scaling). */
const PAGE = { w: 2.02, h: 2.75 };
const RIGHT_PAGE: [number, number, number] = [0.02, 0.1, 0.12];
const LEFT_PAGE: [number, number, number] = [-2.34, 0.14, 0.12];

// One dossier in the scene, so its live three.js parts are module state:
// mutated every frame, never React state.
const parts = {
  right: null as MeshStandardMaterial | null,
};

function pageMaterial(canvas: HTMLCanvasElement) {
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  return new MeshStandardMaterial({
    map,
    roughness: 0.92,
    // The printed face is inside the cover. Rendering its reverse side
    // exposes mirrored text above the cover when the folder is closed.
    side: FrontSide,
  });
}

function pageMaterials() {
  parts.right ??= pageMaterial(paintAboutPage());
  return parts.right;
}

/**
 * The folder's cover texture carries a third-party "BELL SYSTEMS" label and
 * a Bell emblem. Both are covered with plain cover texture copied from right
 * beside them, and the label becomes a red CASE 404 stamp. Atlas pixels
 * (4096 texture); the cover is mirrored in the atlas, so the stamp is too.
 */
/** Copies `tex` to a canvas, runs `paint` on it, returns the new texture. */
function repaint(tex: Texture, paint: (ctx: CanvasRenderingContext2D, k: number) => void) {
  const img = tex.image as ImageBitmap;
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  paint(ctx, img.width / 4096);
  const out = new CanvasTexture(canvas);
  out.flipY = tex.flipY;
  out.colorSpace = tex.colorSpace;
  out.anisotropy = 8;
  return out;
}

/** Covers both logos with plain cover from right beside them. */
function hideLogos(ctx: CanvasRenderingContext2D, k: number) {
  const src = ctx.canvas;
  const patch = (sx: number, sy: number, dx: number, dy: number, w: number, h: number) =>
    ctx.drawImage(src, sx * k, sy * k, w * k, h * k, dx * k, dy * k, w * k, h * k);
  patch(420, 1550, 830, 1550, 410, 300); // BELL SYSTEMS label (plate incl. bevel)
  patch(2120, 1190, 2120, 890, 210, 195); // Bell emblem
}

/**
 * The label plate is raised geometry on the cover, so it becomes a pasted
 * paper case label (plate face = atlas 877..1210 x 1590..1808) carrying a
 * red CASE 404 stamp.
 */
function caseLabel(ctx: CanvasRenderingContext2D, k: number) {
  ctx.fillStyle = "#d9cfb9";
  ctx.fillRect(872 * k, 1585 * k, 344 * k, 228 * k);
  ctx.save();
  ctx.translate(1043 * k, 1699 * k);
  ctx.scale(-1, 1);
  ctx.globalAlpha = 0.88;
  ctx.strokeStyle = ctx.fillStyle = "#a3271f";
  ctx.lineWidth = 6 * k;
  ctx.strokeRect(-140 * k, -62 * k, 280 * k, 118 * k);
  ctx.font = `bold ${44 * k}px "Courier New", Courier, monospace`;
  ctx.textAlign = "center";
  ctx.fillText("CASE", 0, -10 * k);
  ctx.fillText("404", 0, 38 * k);
  ctx.font = `bold ${15 * k}px "Courier New", Courier, monospace`;
  ctx.fillText("SUBJECT / PERSONAL RECORD", 0, 82 * k);
  ctx.restore();
}

/** Keep the source cardboard colour; only add the case artwork. */
function coverArtwork(ctx: CanvasRenderingContext2D, k: number) {
  hideLogos(ctx, k);
  caseLabel(ctx, k);
  // An original evidence illustration printed as a taped photograph.
  // It shares the cover atlas, so it follows every recorded morph frame.
  ctx.save();
  ctx.translate(2225 * k, 1050 * k);
  ctx.scale(-k, k);
  ctx.rotate(-0.08);
  ctx.fillStyle = "rgba(35,25,15,0.3)";
  ctx.fillRect(-101, -144, 214, 308);
  ctx.fillStyle = "#eee7d3";
  ctx.fillRect(-107, -150, 214, 308);
  const sky = ctx.createLinearGradient(0, -132, 0, 90);
  sky.addColorStop(0, "#465157");
  sky.addColorStop(1, "#b7a887");
  ctx.fillStyle = sky;
  ctx.fillRect(-91, -132, 182, 236);
  ctx.fillStyle = "#303735";
  for (let i = 0; i < 8; i++) {
    const h = 45 + ((i * 37) % 87);
    ctx.fillRect(-91 + i * 24, 104 - h, 23, h);
  }
  ctx.fillStyle = "#e5d2a0";
  for (let i = 0; i < 24; i++) ctx.fillRect(-80 + (i % 8) * 23, 55 + Math.floor(i / 8) * 16, 3, 5);
  ctx.fillStyle = "#44392d";
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.fillText("CEBU / FIELD RECORD", 0, 134);
  ctx.fillStyle = "rgba(215,194,142,0.65)";
  ctx.fillRect(-35, -163, 70, 33);
  ctx.restore();
}

/**
 * The folder's cover carries a third-party "BELL SYSTEMS" label (an
 * embossed plate: colour, normal and metal/roughness maps) and a Bell
 * emblem. Both are removed from every map; the plate becomes a paper case
 * label. Atlas pixels assume 4096; the cover is mirrored in the atlas, so
 * the label text is drawn mirrored.
 */
function brandCover(mesh: Mesh) {
  const mat = mesh.material as MeshStandardMaterial;
  if (!mat.map || mat.map.userData.case404) return;
  const done = new Map<Texture, Texture>();
  const fix = (tex: Texture | null, paint: (ctx: CanvasRenderingContext2D, k: number) => void) => {
    if (!tex) return null;
    if (!done.has(tex)) done.set(tex, repaint(tex, paint));
    return done.get(tex)!;
  };
  mat.map = fix(mat.map, coverArtwork);
  mat.roughness = 0.95;
  mat.map!.userData.case404 = true;
  mat.normalMap = fix(mat.normalMap, hideLogos);
  mat.roughnessMap = fix(mat.roughnessMap, hideLogos);
  mat.metalnessMap = fix(mat.metalnessMap, hideLogos);
  mat.aoMap = fix(mat.aoMap, hideLogos);
  mat.needsUpdate = true;
}

function attachFolder(scene: Object3D) {
  scene.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (o.morphTargetInfluences?.length) {
      brandCover(o);
    }
  });
}

/**
 * The case dossier. Its cover opening is scrubbed from storyRig.dossierOpen
 * using the folder's own recorded morph frames; photos and the map stay
 * attached to the left cover, with profile records on the right.
 */
export function Dossier() {
  const asset = assetManifest.dossierFolder;
  const { scene } = useGLTF(asset.url);
  const animated = useMemo(() => {
    const owned = scene.clone(true);
    let cover: Mesh | undefined;
    owned.traverse((object) => {
      if (object instanceof Mesh && object.geometry.morphAttributes.position?.length)
        cover = object;
    });
    if (!cover) throw new Error("Dossier cover animation is missing");
    const source = cover.geometry;
    const geometry = source.clone();
    // Only 908 vertices: interpolate the two recorded frames directly.
    // This avoids uploading all 210 morph targets and keeps the attachment
    // and rendered cover on exactly the same evaluated geometry.
    geometry.morphAttributes = {};
    cover.geometry = geometry;
    cover.morphTargetInfluences = [];
    cover.frustumCulled = false;
    return { scene: owned, cover, source, geometry };
  }, [scene]);
  const rightMat = pageMaterials();
  const leaf = useRef<Group>(null);
  const lastProgress = useRef(-1);

  useLayoutEffect(() => {
    attachFolder(animated.scene);
    brandCover(animated.cover);
    lastProgress.current = -1;
    return () => animated.geometry.dispose();
  }, [animated]);
  useFrame(() => {
    const p = Math.max(0, Math.min(1, storyRig.dossierOpen));
    if (p !== lastProgress.current) {
      const frame = p * OPEN_FRAME;
      const index = Math.floor(frame);
      const blend = frame - index;
      const base = animated.source.getAttribute("position");
      const targets = animated.source.morphAttributes.position!;
      const before = index > 0 ? targets[index - 1] : undefined;
      const after = targets[index];
      const output = animated.geometry.getAttribute("position");
      for (let i = 0; i < base.count; i++) {
        const x = base.getX(i),
          y = base.getY(i),
          z = base.getZ(i);
        output.setXYZ(
          i,
          x + (before?.getX(i) ?? 0) * (1 - blend) + after.getX(i) * blend,
          y + (before?.getY(i) ?? 0) * (1 - blend) + after.getY(i) * blend,
          z + (before?.getZ(i) ?? 0) * (1 - blend) + after.getZ(i) * blend,
        );
      }
      output.needsUpdate = true;
      animated.geometry.computeVertexNormals();
      lastProgress.current = p;
    }
    if (leaf.current) {
      leaf.current.visible = p > 0;
      // Measured vertices on the source cover: spine (150), outer edge (7).
      // Follow its recorded pose, including its slow start and hinge flex.
      const position = animated.geometry.getAttribute("position");
      const x = position.getX(150),
        y = position.getY(150);
      leaf.current.position.set(x, y, LEFT_PAGE[2]);
      leaf.current.rotation.z = Math.atan2(y - position.getY(7), x - position.getX(7));
    }
  });

  return (
    <group position={asset.position} rotation={asset.rotation} scale={asset.scale}>
      <primitive object={animated.scene} />
      <DossierRecords material={rightMat} />
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0.02 + i * 0.018, 0.055 + i * 0.01, 0.12 - i * 0.025]}
          rotation={[-Math.PI / 2, 0, i * 0.009]}
          receiveShadow
        >
          <planeGeometry args={[PAGE.w + 0.025, PAGE.h + 0.03]} />
          <meshStandardMaterial
            color={i % 2 ? "#ded5b9" : "#eee7cf"}
            roughness={1}
            side={DoubleSide}
          />
        </mesh>
      ))}
      <mesh
        position={RIGHT_PAGE}
        rotation={[-Math.PI / 2, 0, 0]}
        material={rightMat}
        receiveShadow
        castShadow
      >
        <planeGeometry args={[PAGE.w, PAGE.h]} />
      </mesh>
      <group
        ref={leaf}
        visible={false}
        position={[-1.16, LEFT_PAGE[1], LEFT_PAGE[2]]}
        rotation={[0, 0, -Math.PI]}
      >
        <Suspense fallback={null}>
          <DossierEvidence />
        </Suspense>
      </group>
    </group>
  );
}
