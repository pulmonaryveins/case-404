import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  FrontSide,
  type Group,
  Mesh,
  type MeshStandardMaterial,
  SRGBColorSpace,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { frontOf, useFocusable } from "../camera/focus";
import { DESK_TOP } from "./worldAnchors";

/**
 * Which prints from the sheet (by node name; GLTFLoader names a mesh after
 * its node), and where they lie (station frame): x, z, yaw. Loosely
 * scattered round the camera (ArchiveStation's POLAROID_AT) as if just
 * ejected; the first two overlap a little, so each sits above the one before.
 */
const PRINTS = [
  { mesh: "Object_4", x: 0.41, z: 0.17, yaw: 0.35 },
  { mesh: "Object_14", x: 0.47, z: 0.03, yaw: -0.3 },
  { mesh: "Object_22", x: 0.65, z: 0.24, yaw: 0.6 },
] as const;
/**
 * Height of the lowest print above the desk, and the step between prints.
 * Millimetres, not fractions of one: the desk top is flat at DESK_TOP, so this
 * is enough for the depth buffer (it resolves microns at this range). No
 * polygonOffset: its slope term pulled the prints in front of the camera and
 * lamp at grazing angles.
 */
const BASE = 0.002;
const LAYER = 0.0015;
/** How much bigger than a print the close-up frame is. */
const FOCUS_FILL = 1.6;

/**
 * Each print mesh is two coplanar quads: vertices 0-3 the photo (facing up)
 * and 4-7 a second picture for its back (facing down). Drawn double-sided
 * they sat at the same height and fought, which looked like other pictures
 * stacked on the print. Keep only the face-up quad.
 *
 * The prints also share one small atlas with no padding between cells, so at
 * lower mip levels (which change as the camera moves) neighbours bled into
 * each other's edges. Cut this cell out into a texture of its own, inset a
 * pixel, with its own mipmaps and a UV set running 0..1.
 */
function ownPrint(source: Mesh) {
  const atlas = (source.material as MeshStandardMaterial).map?.image as
    (CanvasImageSource & { width: number; height: number }) | undefined;
  const src = source.geometry;
  const uv = src.getAttribute("uv");
  const position = src.getAttribute("position");
  const normal = src.getAttribute("normal");
  if (!atlas || !uv || !position || !normal) return null;
  const quad = [0, 1, 2, 3];
  if (normal.getY(0) < 0) return null; // authored order changed: keep the source mesh
  let u0 = Infinity,
    v0 = Infinity,
    u1 = -Infinity,
    v1 = -Infinity;
  for (const i of quad) {
    u0 = Math.min(u0, uv.getX(i));
    u1 = Math.max(u1, uv.getX(i));
    v0 = Math.min(v0, uv.getY(i));
    v1 = Math.max(v1, uv.getY(i));
  }
  // glTF UVs run down the image (v = 0 at the top row).
  const sx = u0 * atlas.width + 1;
  const sy = v0 * atlas.height + 1;
  const sw = (u1 - u0) * atlas.width - 2;
  const sh = (v1 - v0) * atlas.height - 2;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 616; // the print's 1.23 : 1.48 proportion
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(atlas, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.flipY = false;
  map.anisotropy = 8;
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(
      quad.flatMap((i) => [position.getX(i), position.getY(i), position.getZ(i)]),
      3,
    ),
  );
  geometry.setAttribute(
    "normal",
    new Float32BufferAttribute(
      quad.flatMap((i) => [normal.getX(i), normal.getY(i), normal.getZ(i)]),
      3,
    ),
  );
  geometry.setAttribute(
    "uv",
    new Float32BufferAttribute(
      quad.flatMap((i) => [(uv.getX(i) - u0) / (u1 - u0), (uv.getY(i) - v0) / (v1 - v0)]),
      2,
    ),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.userData.own = true;
  return { map, geometry };
}

/** Three loose polaroid prints on the archive desk; click one to look at it close. */
export function PolaroidPhotos({ interactive }: { interactive: boolean }) {
  const asset = assetManifest.polaroidPhotos;
  const { scene } = useGLTF(asset.url);
  const group = useRef<Group>(null);

  const prints = useMemo(() => {
    const byName = new Map<string, Mesh>();
    scene.traverse((o) => {
      if (o instanceof Mesh) byName.set(o.name, o);
    });
    return PRINTS.flatMap((p, i) => {
      const source = byName.get(p.mesh);
      if (!source) return [];
      const material = (source.material as MeshStandardMaterial).clone();
      material.side = FrontSide;
      material.roughness = 0.55;
      const own = ownPrint(source);
      if (own) {
        material.map = own.map;
      }
      return [
        {
          ...p,
          geometry: own?.geometry ?? source.geometry,
          material,
          y: DESK_TOP + BASE + i * LAYER,
        },
      ];
    });
  }, [scene]);

  useEffect(
    () => () =>
      prints.forEach((p) => {
        p.material.map?.dispose();
        p.material.dispose();
        if (p.geometry !== undefined && p.geometry.userData.own) p.geometry.dispose();
      }),
    [prints],
  );

  // Leans toward the archive desk's front, so prints read as from the desk view.
  const focus = useFocusable(() => interactive, {
    fill: FOCUS_FILL,
    label: "Inspect photo",
    get front() {
      return frontOf(group.current);
    },
  });

  return (
    <group ref={group} name="polaroid-photos">
      {prints.map((p) => (
        <mesh
          key={p.mesh}
          geometry={p.geometry}
          material={p.material}
          position={[p.x, p.y, p.z]}
          rotation={[0, p.yaw, 0]}
          scale={asset.scale}
          receiveShadow
          {...focus}
        />
      ))}
    </group>
  );
}
