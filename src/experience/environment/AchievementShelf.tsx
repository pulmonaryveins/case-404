import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  CanvasTexture,
  type Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { certificates, type Certificate } from "../../data/certificates";
import { Model } from "../models/Model";
import { paintCertificate } from "../surfaces/paintCertificate";
import { ShipDisplay } from "./ShipDisplay";
import { useWallInspect } from "./wallInspect";

/**
 * The achievements: a wooden shelf on the angled wall just above the archive
 * terminal: two framed certificates at each end, standing on it and leaning
 * back against the wall, and the Bismarck model on its plinth between them. In the archive station's frame (see DesignPosters): `x`
 * runs along the wall, the wall's front face is at z = WALL_Z.
 */
const WALL_Z = -0.476;
/** The shelf's top face: clear of Wall-E on the terminal (its head is at ~1.45 m). */
const SHELF_TOP = 1.56;
/** The shelf model's top face, in its own units (its back is at z 0). */
const SHELF_MODEL_TOP = 0.016;
/**
 * The plank is stretched along its length only (its depth and thickness stay
 * at the manifest scale): 1.71 m as authored, 1.02 m at 0.6, 1.54 m at 0.9.
 */
const SHELF_LENGTH_SCALE = 0.9;
/** Frame centres along the shelf, from its centre, and a slight turn each. */
const FRAMES = [
  { x: -0.655, yaw: 0.04 },
  { x: -0.43, yaw: -0.02 },
  { x: 0.43, yaw: 0.025 },
  { x: 0.655, yaw: -0.04 },
];
/** The ship's plinth: centred on the shelf, halfway out from the wall. */
const SHIP_Z = 0.0625;
/** Gap between a frame's back and the wall. */
const FRAME_GAP = 0.012;

/**
 * The frame model's inner panel (mat and certificate), in its mesh's own
 * units: x +-0.606, z +-0.393, face at y 0.486 (+y is the frame's front;
 * -z is up). The certificate lies a hair in front of it, still behind the
 * frame's moulding (y 0.6 to 0.67).
 */
const PANEL = { w: 1.2116, h: 0.7852, y: 0.546 };
const SHEET = new PlaneGeometry(PANEL.w, PANEL.h);
/**
 * Canvas size, in the panel's proportions once the mesh's node scale
 * (0.663 x 0.802) is applied: 1.276 : 1.
 */
const CERT_PX: [number, number] = [384, 301];

function Diploma({ cert, x, yaw }: { cert: Certificate; x: number; yaw: number }) {
  const group = useRef<Group>(null);
  const inspect = useWallInspect(() => group.current, "Inspect certificate", 1.6);
  const asset = assetManifest.diplomaFrame;
  const { scene } = useGLTF(asset.url);

  const { frame, offset, texture, material } = useMemo(() => {
    const frame = scene.clone(true);
    const texture = new CanvasTexture(paintCertificate(cert, ...CERT_PX));
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    const material = new MeshStandardMaterial({ map: texture, roughness: 0.85 });
    let mesh: Mesh | null = null;
    frame.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      mesh ??= o;
    });
    // Face +y, top toward -z, as the panel lies.
    const sheet = new Mesh(SHEET, material);
    sheet.rotation.x = -Math.PI / 2;
    sheet.position.y = PANEL.y;
    sheet.receiveShadow = true;
    (mesh as Mesh | null)?.add(sheet);
    // Stand it on its bottom edge with its back against the wall.
    frame.updateMatrixWorld(true);
    const box = new Box3().setFromObject(frame);
    const s = asset.scale;
    const offset = new Vector3(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -box.min.z * s);
    return { frame, offset, texture, material };
  }, [scene, cert, asset.scale]);

  useEffect(
    () => () => {
      texture.dispose();
      material.dispose();
    },
    [texture, material],
  );

  return (
    <group
      ref={group}
      position={[x, SHELF_TOP, WALL_Z + FRAME_GAP]}
      rotation={[0, yaw, 0]}
      {...inspect}
    >
      <primitive object={frame} position={offset} scale={asset.scale} />
    </group>
  );
}

export function AchievementShelf({ x }: { x: number }) {
  const shelfY = SHELF_TOP - SHELF_MODEL_TOP * assetManifest.woodShelf.scale;
  const ship = useRef<Group>(null);
  const inspectShip = useWallInspect(() => ship.current, "Inspect model", 1.3);
  return (
    <group name="achievement-shelf" position={[x, 0, 0]}>
      <group
        position={[0, shelfY, WALL_Z]}
        scale={[SHELF_LENGTH_SCALE / assetManifest.woodShelf.scale, 1, 1]}
      >
        <Model id="woodShelf" />
      </group>
      {/* Plinth length along the shelf, its plate toward the room. */}
      <group ref={ship} {...inspectShip}>
        <ShipDisplay at={[0, SHELF_TOP, WALL_Z + SHIP_Z]} yaw={-Math.PI / 2} />
      </group>
      {FRAMES.map((f, i) =>
        certificates[i] ? <Diploma key={i} cert={certificates[i]} x={f.x} yaw={f.yaw} /> : null,
      )}
    </group>
  );
}
