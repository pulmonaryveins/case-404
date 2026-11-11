import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { CanvasTexture, Mesh, MeshStandardMaterial, SRGBColorSpace, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { Gramophone } from "./Gramophone";

/**
 * Two old file cabinets on the back wall, either side of the evidence board,
 * mirrored about it: props, their drawers shut, each drawer labelled with the
 * case numbers filed in it. Static: no per-frame work, no clicks.
 *
 * Each stands in the straight wall between the board (its edges at x +-1.14)
 * and the corner desk's inner back corner, which the desks (on their corner
 * walls' centres) bring to within ~0.5 m of the board: a 0.46 m cabinet, ~9 cm
 * clear of the board and ~5 cm of the desk. Footprint centres stand 0.31 m off
 * the wall (half a cabinet's depth, plus a hair); the yaw turns the model's
 * drawer side (+X) to face the room (+Z).
 */
const CABINETS = [
  { at: new Vector3(-1.46, 0, -3.49), yaw: -Math.PI / 2, cases: [401, 402, 403, 404] },
  { at: new Vector3(1.46, 0, -3.49), yaw: -Math.PI / 2, cases: [405, 406, 407, 408] },
];
/**
 * The model is ~1 unit tall (0.48 wide, 0.64 deep); 0.95 makes a compact
 * four-drawer cabinet, 0.94 m tall, its top just under the board's foot (0.97 m).
 */
const CABINET_SCALE = 0.95;

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
/** The body's top (model y), for what stands on a cabinet. */
const BODY_TOP = 0.7558;
const CABINET_TOP = (BODY_TOP - BODY.floor) * CABINET_SCALE;

/**
 * The gramophone stands on the left cabinet, beside the typewriter desk: at
 * 0.8 its ~23 cm case sits well inside the 0.46 x 0.61 m top, its horn (to
 * ~1.42 m) clear of the board and under the sconce, turned to the room.
 */
const GRAMOPHONE_SIZE = 0.8;
const GRAMOPHONE_YAW = Math.PI + 0.4;

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
      <Gramophone
        position={[CABINETS[0].at.x, CABINET_TOP, CABINETS[0].at.z]}
        yaw={GRAMOPHONE_YAW}
        size={GRAMOPHONE_SIZE}
      />
    </group>
  );
}
