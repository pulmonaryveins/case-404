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
  MeshPhysicalMaterial,
  type Object3D,
  SRGBColorSpace,
  type Texture,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { storyRig } from "../../story/storyRig";
import { paintAboutPage } from "../surfaces/paintDossierPages";
import { DossierRecords } from "./DossierRecords";
import { DossierEvidence } from "./DossierEvidence";
import { PaperContactShadow } from "./PaperContactShadow";
import { createPaperBump } from "../surfaces/paperFinish";
import { DossierCoverDesign } from "./DossierCoverDesign";

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
  return new MeshPhysicalMaterial({
    map,
    bumpMap: createPaperBump(),
    bumpScale: 0.002,
    roughness: 1,
    specularIntensity: 0.12,
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
 * beside them. The separate cover design owns the main CASE 404 stamp.
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

/** Recolour the cardboard while retaining its original surface detail. */
function coverArtwork(ctx: CanvasRenderingContext2D, k: number, mesh: Mesh) {
  hideLogos(ctx, k);
  // Both sides of the cardboard share this finish. Paper meshes and the
  // near-vertical metal hardware stay outside this UV mask.
  const uv = mesh.geometry.getAttribute("uv");
  const normals = mesh.geometry.getAttribute("normal");
  const index = mesh.geometry.index;
  const count = index?.count ?? uv.count;
  const size = ctx.canvas.width;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < count; i += 3) {
    const ids = [0, 1, 2].map((offset) => (index ? index.getX(i + offset) : i + offset));
    if (Math.abs(ids.reduce((sum, id) => sum + normals.getY(id), 0) / 3) < 0.7) continue;
    ids.forEach((id, j) => {
      const x = uv.getX(id) * size;
      const y = uv.getY(id) * size;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }
  ctx.clip();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(181,151,107,0.88)";
  ctx.fillRect(0, 0, size, size);
  // Fine, deterministic flecks keep the tan stock from reading as flat paint.
  for (let i = 0; i < 95000; i++) {
    ctx.fillStyle = i % 2 ? "rgba(54,38,22,0.12)" : "rgba(237,218,175,0.10)";
    ctx.fillRect(
      ((i * 179) % 4096) * k,
      ((i * 313 + Math.floor(i / 4096) * 41) % 4096) * k,
      2 * k,
      k,
    );
  }
  // Uneven handling stains and scuffs, fixed across reloads. Everything is
  // clipped to the cardboard, leaving the documents and photographs intact.
  let seed = 404;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 65; i++) {
    ctx.save();
    ctx.translate(random() * size, random() * size);
    ctx.rotate(random() * Math.PI);
    ctx.scale((35 + random() * 145) * k, (25 + random() * 95) * k);
    const stain = ctx.createRadialGradient(-0.2, 0.1, 0.05, 0, 0, 1);
    stain.addColorStop(0, "rgba(75,49,25,0.23)");
    stain.addColorStop(0.45, "rgba(90,62,30,0.12)");
    stain.addColorStop(1, "rgba(90,62,30,0)");
    ctx.fillStyle = stain;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  for (let i = 0; i < 850; i++) {
    const x = random() * size;
    const y = random() * size;
    ctx.strokeStyle = i % 3 ? "rgba(70,49,29,0.16)" : "rgba(235,216,170,0.25)";
    ctx.lineWidth = (0.6 + random()) * k;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (random() - 0.5) * 45 * k, y + random() * 24 * k);
    ctx.stroke();
  }
  // Worn seams along the measured outer/inner cover UV-island edges.
  for (const u of [0.003, 0.352, 0.391, 0.745]) {
    const x = u * size;
    const edge = ctx.createLinearGradient(x - 22 * k, 0, x + 22 * k, 0);
    edge.addColorStop(0, "rgba(68,45,25,0)");
    edge.addColorStop(0.5, "rgba(68,45,25,0.24)");
    edge.addColorStop(1, "rgba(68,45,25,0)");
    ctx.fillStyle = edge;
    ctx.fillRect(x - 22 * k, 0, 44 * k, size);
  }
  ctx.restore();
}

/**
 * The folder's cover carries a third-party "BELL SYSTEMS" label (an
 * embossed plate: colour, normal and metal/roughness maps) and a Bell
 * emblem. Remove both from every map, including the baked bevel and shadow.
 */
function brandCover(mesh: Mesh) {
  const mat = mesh.material as MeshStandardMaterial;
  if (!mat.map || mat.map.userData.coverFinish === "aged-tan-both-sides-v3") return;
  const done = new Map<Texture, Texture>();
  const fix = (tex: Texture | null, paint: (ctx: CanvasRenderingContext2D, k: number) => void) => {
    if (!tex) return null;
    if (!done.has(tex)) done.set(tex, repaint(tex, paint));
    return done.get(tex)!;
  };
  mat.map = fix(mat.map, (ctx, k) => coverArtwork(ctx, k, mesh));
  mat.roughness = 0.95;
  mat.map!.userData.case404 = true;
  mat.map!.userData.coverFinish = "aged-tan-both-sides-v3";
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
  const coverDesign = useRef<Group>(null);
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
      if (coverDesign.current) {
        coverDesign.current.position.copy(leaf.current.position);
        coverDesign.current.rotation.copy(leaf.current.rotation);
      }
    }
  });

  return (
    <group position={asset.position} rotation={asset.rotation} scale={asset.scale}>
      <primitive object={animated.scene} />
      <DossierRecords />
      <group ref={coverDesign}>
        <DossierCoverDesign />
      </group>
      <group position={[0.02, 0.087, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <PaperContactShadow width={PAGE.w} height={PAGE.h} />
      </group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[0.02 + i * 0.018, 0.055 + i * 0.01, 0.12 - i * 0.025]}
          rotation={[-Math.PI / 2, 0, i * 0.009]}
          receiveShadow
          castShadow
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
