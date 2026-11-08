import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { CanvasTexture, Mesh, MeshStandardMaterial, SRGBColorSpace, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";

/**
 * Two old file cabinets on the back wall, either side of the evidence board,
 * mirrored about it: props, their drawers shut, each drawer labelled with the
 * case numbers filed in it. Static: no per-frame work, no clicks.
 *
 * Each stands in the 0.81 m of straight wall between a rounded corner (its
 * edge at x +-1.95) and the board (its edges at x +-1.14, its foot at 0.97 m,
 * below a cabinet's top): one 0.63 m cabinet, clear of the board and of the
 * corner desk's end (both desks are slid along their walls to make room,
 * STATION_SLIDE). Footprint centres stand 0.43 m off the wall (half a
 * cabinet's depth, plus a hair); the yaw turns the model's drawer side (+X)
 * to face the room (+Z).
 */
const CABINETS = [
  { at: new Vector3(-1.55, 0, -3.37), yaw: -Math.PI / 2, cases: [401, 402, 403, 404] },
  { at: new Vector3(1.55, 0, -3.37), yaw: -Math.PI / 2, cases: [405, 406, 407, 408] },
];
/** The model is ~1 unit tall; 1.3 makes a real four-drawer cabinet (~1.28 m). */
const CABINET_SCALE = 1.3;

/**
 * Measured from file-cabinet.glb (model frame, after its own root turn): the
 * body's footprint and floor, each drawer's resting min X (two ship pulled
 * out) and the drawer fronts' plane.
 */
const BODY = { cx: -1.4715, cz: -3.9655, floor: -0.231 };
const DRAWER_CLOSED_X = -1.752;
const DRAWER_FRONT_X = -1.151;
const DRAWER_CENTRE_Z = -3.9655;
/** Each drawer's top (model y), top to bottom: its label sits just under it. */
const DRAWER_TOPS = [0.717, 0.494, 0.27, 0.047];

/** A typed index card for a drawer's label holder: the case filed in it. */
function paintLabel(caseNo: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 150;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e3d8bd";
  ctx.fillRect(0, 0, 512, 150);
  ctx.strokeStyle = "rgba(60,40,20,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, 492, 130);
  ctx.fillStyle = "#8a2c2c";
  ctx.font = 'bold 22px "Courier New", monospace';
  ctx.fillText("CASE FILES", 26, 42);
  ctx.textAlign = "right";
  ctx.fillText(caseNo === 404 ? "OPEN" : "CLOSED", 486, 42);
  ctx.fillStyle = "#1d1a16";
  ctx.font = 'bold 64px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.fillText(`No. ${caseNo}`, 256, 116);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** The cabinet model taken apart: its body and its four drawers, closed. */
function useCabinetParts() {
  const { scene } = useGLTF(assetManifest.fileCabinet.url);
  return useMemo(() => {
    const root = scene.clone(true);
    root.updateMatrixWorld(true);
    // The model's metal is fully metallic; with no environment map that
    // renders near black. A little metal keeps the sheen, the rest is paint.
    let material: MeshStandardMaterial | null = null;
    const take = (o: Mesh) => {
      const m = new Mesh(
        o.geometry,
        material ?? (material = (o.material as MeshStandardMaterial).clone()),
      );
      o.matrixWorld.decompose(m.position, m.quaternion, m.scale);
      m.castShadow = m.receiveShadow = true;
      return m;
    };
    const parts: Mesh[] = [];
    root.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const part = take(o);
      // Close the two drawers the model ships pulled out. The matrix has to be
      // composed first: measured against a stale (identity) matrix, the shift
      // comes out in the raw geometry's axes.
      if (/cabinet[_ ]0[1-4]/i.test(o.name)) {
        part.updateMatrix();
        part.geometry.computeBoundingBox();
        const min = part.geometry.boundingBox!.clone().applyMatrix4(part.matrix).min.x;
        part.position.x += DRAWER_CLOSED_X - min;
      }
      parts.push(part);
    });
    const mat = material as MeshStandardMaterial | null;
    if (mat) {
      mat.metalness = 0.25;
      mat.color.set("#c9c4b8");
    }
    return { parts, material: mat };
  }, [scene]);
}

function FileCabinet({ at, yaw, cases }: (typeof CABINETS)[number]) {
  const { parts, material } = useCabinetParts();
  const labels = useMemo(() => cases.map(paintLabel), [cases]);
  useEffect(
    () => () => {
      material?.dispose();
      labels.forEach((t) => t.dispose());
    },
    [material, labels],
  );
  return (
    <group name="file-cabinet" position={at} rotation={[0, yaw, 0]} scale={CABINET_SCALE}>
      <group position={[-BODY.cx, -BODY.floor, -BODY.cz]}>
        {parts.map((part, i) => (
          <primitive key={i} object={part} />
        ))}
        {/* A label in its holder near the top of each drawer front. */}
        {labels.map((map, i) => (
          <group
            key={i}
            position={[DRAWER_FRONT_X + 0.0015, DRAWER_TOPS[i] - 0.05, DRAWER_CENTRE_Z]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <mesh position={[0, 0, -0.0006]}>
              <planeGeometry args={[0.15, 0.048]} />
              <meshStandardMaterial color="#8d8679" metalness={0.3} roughness={0.5} />
            </mesh>
            <mesh>
              <planeGeometry args={[0.135, 0.039]} />
              <meshStandardMaterial map={map} roughness={0.95} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export function FileCabinets() {
  return (
    <group name="file-cabinets">
      {CABINETS.map((c, i) => (
        <FileCabinet key={i} {...c} />
      ))}
    </group>
  );
}
