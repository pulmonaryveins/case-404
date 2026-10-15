import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  CanvasTexture,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Object3D,
  Vector3,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { merchDrawers, merchDrawersB, type MerchDrawer, type MerchItem } from "../../data/merch";
import { useExperienceStore } from "../../store/useExperienceStore";
import { storyRig } from "../../story/storyRig";
import { useCursor } from "../cursor/cursorStore";
import { Model } from "../models/Model";
import { CaseBoxes } from "./CaseBoxes";
import { Gramophone } from "./Gramophone";

/* ------------------------------------------------------------------ */
/* Placement (world space, metres)                                      */
/* ------------------------------------------------------------------ */

/**
 * Two file cabinets side by side in the left corner. Footprint centres stand
 * 0.43 m off the wall (half a cabinet's 0.83 m depth, plus a hair); the yaw
 * brings the model's drawer side (+X) round to face (0.62, 0.78), out into the
 * room: a quarter turn, less the archive desk's 0.67 tilt mirrored.
 *
 *  - A, the first, and B: together they fill the wall's straight run, from
 *    where its rounded corner at the back wall ends to where the one at the
 *    side wall starts (about 1.3 m), 1.6 cm apart, both flush to the wall. A
 *    is the one at the back, so the whole of it shows at the left of the
 *    opening shot, left of the mannequin.
 */
const CABINETS = [
  { at: new Vector3(-2.314, 0, -3.056), yaw: -Math.PI / 2 + 0.67, drawers: merchDrawers },
  { at: new Vector3(-2.82, 0, -2.655), yaw: -Math.PI / 2 + 0.67, drawers: merchDrawersB },
];
/** The model is ~1 unit tall; 1.3 makes a real four-drawer cabinet (~1.28 m). */
const CABINET_SCALE = 1.3;
/** The cabinet body's top, model units (file-cabinet.glb bounds). */
const BODY_TOP = 0.756;
/** How far the gramophone sits back from the middle of cabinet A's top (m). */
const GRAMOPHONE_SET_BACK = 0.08;

/**
 * Measured from file-cabinet.glb (model frame, after its own root turn): the
 * body's footprint and floor, and each drawer's resting min X (two ship
 * pulled out) plus its interior floor (a hollow tray ~0.019 above its base).
 */
const BODY = { cx: -1.4715, cz: -3.9655, floor: -0.231 };
const DRAWER_CLOSED_X = -1.752;
const DRAWER_FRONT_X = -1.151;
const DRAWER_CENTRE_Z = -3.9655;
/** Top to bottom: node suffix, base and top y. */
const DRAWERS = [
  { node: "01", base: 0.495, top: 0.717 },
  { node: "02", base: 0.271, top: 0.494 },
  { node: "03", base: 0.048, top: 0.27 },
  { node: "04", base: -0.176, top: 0.047 },
];
const TRAY_FLOOR = 0.019;
/** How far an open drawer slides out, model units (~0.55 m). */
const SLIDE = 0.42;

/** Chapter where the corner is the subject. */
const HERE = "MERCH";

/* ------------------------------------------------------------------ */
/* Paper and merch art (canvas, placeholder)                           */
/* ------------------------------------------------------------------ */

function canvasTexture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  paint(canvas.getContext("2d")!);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Typed index card for a drawer front's label holder. */
function paintLabel(text: string) {
  return canvasTexture(512, 150, (ctx) => {
    ctx.fillStyle = "#e3d8bd";
    ctx.fillRect(0, 0, 512, 150);
    ctx.strokeStyle = "rgba(60,40,20,0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 492, 130);
    ctx.fillStyle = "#8a2c2c";
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText("CASE 404 / MERCH", 26, 42);
    ctx.fillStyle = "#1d1a16";
    ctx.font = 'bold 64px "Courier New", monospace';
    ctx.textAlign = "center";
    ctx.fillText(text, 256, 116);
  });
}

const readable = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const l = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l > 150 ? "#1d1a16" : "#f2ead7";
};

/** Face art for one merch piece: its colour, an edge and its text. */
function paintItem(item: MerchItem) {
  return canvasTexture(256, 256, (ctx) => {
    const ink = readable(item.colour);
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = item.colour;
    if (item.kind === "sticker") {
      // Die-cut sticker: a white border round the print.
      ctx.fillStyle = "#f4f1ea";
      ctx.beginPath();
      ctx.roundRect(4, 40, 248, 176, 36);
      ctx.fill();
      ctx.fillStyle = item.colour;
      ctx.beginPath();
      ctx.roundRect(16, 52, 224, 152, 28);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(128, 128, 124, 0, Math.PI * 2);
      ctx.fill();
      // Enamel pins get a gold rim; patches a stitched border.
      ctx.strokeStyle = item.kind === "patch" ? "#e8e1d3" : "#d9b46a";
      ctx.lineWidth = item.kind === "patch" ? 10 : 14;
      if (item.kind === "patch") ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.arc(128, 128, 110, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = item.text.length > 6 ? 30 : item.text.length > 3 ? 44 : 64;
    ctx.font = `bold ${size}px "Courier New", monospace`;
    ctx.fillText(item.text, 128, 130);
  });
}

/** Drawer liner (felt) colour per drawer. */
const LINER = ["#3a1414", "#14243a", "#1f2a1a", "#2a2018"];

/* ------------------------------------------------------------------ */
/* Drawer contents                                                      */
/* ------------------------------------------------------------------ */

/**
 * One piece of merch lying in a drawer, in metres. Pins are shallow discs
 * with a metal edge, patches thinner fabric discs, stickers flat die-cuts,
 * keychains a disc on a ring.
 */
function Piece({ item, at, turn }: { item: MerchItem; at: [number, number]; turn: number }) {
  const { face, edge } = useMemo(() => {
    const map = paintItem(item);
    const face = new MeshStandardMaterial({
      map,
      roughness: item.kind === "pin" ? 0.35 : 0.9,
      transparent: item.kind === "sticker",
      alphaTest: 0.5,
    });
    const edge = new MeshStandardMaterial({
      color: item.kind === "pin" || item.kind === "keychain" ? "#b8914f" : item.colour,
      metalness: item.kind === "pin" || item.kind === "keychain" ? 0.4 : 0,
      roughness: 0.45,
    });
    return { face, edge };
  }, [item]);
  useEffect(
    () => () => {
      face.map?.dispose();
      face.dispose();
      edge.dispose();
    },
    [face, edge],
  );

  const [x, z] = at;
  if (item.kind === "sticker") {
    return (
      <mesh
        position={[x, 0.0012, z]}
        rotation={[-Math.PI / 2, 0, turn]}
        material={face}
        receiveShadow
      >
        <planeGeometry args={[0.085, 0.085]} />
      </mesh>
    );
  }
  const r = item.kind === "patch" ? 0.042 : item.kind === "keychain" ? 0.026 : 0.021;
  const h = item.kind === "patch" ? 0.003 : 0.005;
  return (
    <group position={[x, h / 2, z]} rotation={[0, turn, 0]}>
      <mesh material={edge} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, h, 28]} />
      </mesh>
      <mesh position={[0, h / 2 + 0.0004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={face}>
        <circleGeometry args={[r * 0.99, 28]} />
      </mesh>
      {item.kind === "keychain" && (
        <mesh position={[0, 0, -r - 0.012]} rotation={[Math.PI / 2, 0, 0]} material={edge}>
          <torusGeometry args={[0.012, 0.0018, 8, 20]} />
        </mesh>
      )}
    </group>
  );
}

/**
 * A drawer's display, in metres: a felt liner and the pieces laid in a loose
 * grid in its front half (the part that clears the cabinet when it opens).
 * Local +X runs across the drawer, +Z toward its front.
 */
function DrawerContents({ drawer, liner }: { drawer: MerchDrawer; liner: string }) {
  const cols = 3;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0004, 0]} receiveShadow>
        <planeGeometry args={[0.44, 0.46]} />
        <meshStandardMaterial color={liner} roughness={1} />
      </mesh>
      {drawer.items.map((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        // Loosely laid, not on a ruler.
        const jitter = Math.sin(i * 12.9898) * 0.012;
        return (
          <Piece
            key={item.id}
            item={item}
            at={[(col - 1) * 0.13 + jitter, 0.13 - row * 0.12 - jitter]}
            turn={Math.sin(i * 7.31) * 0.35}
          />
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Cabinet                                                              */
/* ------------------------------------------------------------------ */

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
    let body: Mesh | null = null;
    const drawers: (Mesh | null)[] = [null, null, null, null];
    root.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const match = /cabinet[_ ]0([1-4])/i.exec(o.name);
      if (match) drawers[Number(match[1]) - 1] = take(o);
      else body = take(o);
    });
    const mat = material as MeshStandardMaterial | null;
    if (mat) {
      mat.metalness = 0.25;
      mat.color.set("#c9c4b8");
    }
    // Close the two drawers the model ships pulled out. The matrix has to be
    // composed first: measured against a stale (identity) matrix, the shift
    // came out in the raw geometry's axes and pushed the drawer bodies back
    // into the cabinet, leaving their labels and contents in an empty front.
    drawers.forEach((d) => {
      if (!d) return;
      d.updateMatrix();
      d.geometry.computeBoundingBox();
      const min = d.geometry.boundingBox!.clone().applyMatrix4(d.matrix).min.x;
      d.position.x += DRAWER_CLOSED_X - min;
    });
    return { body: body as Mesh | null, drawers, material: mat };
  }, [scene]);
}

function Drawer({
  index,
  mesh,
  drawer,
  open,
  onOpen,
}: {
  index: number;
  mesh: Mesh;
  drawer: MerchDrawer;
  open: boolean;
  onOpen: (index: number, contents: Object3D) => void;
}) {
  const group = useRef<Group>(null);
  const contents = useRef<Group>(null);
  const slide = useRef(0);
  const label = useMemo(() => paintLabel(drawer.label), [drawer.label]);
  useEffect(() => () => label.dispose(), [label]);
  const { base, top } = DRAWERS[index];

  useFrame((_, dt) => {
    slide.current = MathUtils.damp(slide.current, open ? SLIDE : 0, 6, dt);
    if (group.current) group.current.position.x = slide.current;
  });

  const enabled = () => {
    const s = useExperienceStore.getState();
    return s.currentChapter === HERE && !s.screenFocused;
  };

  return (
    <group
      ref={group}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!enabled()) return;
        e.stopPropagation();
        useCursor.getState().clear();
        if (contents.current) onOpen(index, contents.current);
      }}
      onPointerOver={(e) => {
        if (!enabled()) return;
        e.stopPropagation();
        useCursor.getState().set("inspect", `Open ${drawer.label.toLowerCase()}`);
      }}
      onPointerOut={() => useCursor.getState().clear()}
    >
      <primitive object={mesh} />
      {/* Label in a holder near the top of the drawer front. */}
      <group
        position={[DRAWER_FRONT_X + 0.0015, top - 0.05, DRAWER_CENTRE_Z]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <mesh position={[0, 0, -0.0006]}>
          <planeGeometry args={[0.15, 0.048]} />
          <meshStandardMaterial color="#8d8679" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh>
          <planeGeometry args={[0.135, 0.039]} />
          <meshStandardMaterial map={label} roughness={0.95} />
        </mesh>
      </group>
      {/* Contents in the front half of the tray, in metres, +Z to the front. */}
      <group
        ref={contents}
        position={[-1.4, base + TRAY_FLOOR, DRAWER_CENTRE_Z]}
        rotation={[0, Math.PI / 2, 0]}
        scale={1 / CABINET_SCALE}
      >
        <DrawerContents drawer={drawer} liner={LINER[index]} />
      </group>
    </group>
  );
}

function FileCabinet({ at, yaw, drawers }: { at: Vector3; yaw: number; drawers: MerchDrawer[] }) {
  const parts = useCabinetParts();
  const [open, setOpen] = useState<number | null>(null);
  const cabinet = useRef<Group>(null);
  const setFocused = useExperienceStore((s) => s.setScreenFocused);

  // Closing the close-up (click, Esc, Back) closes the drawer; so does leaving.
  useEffect(
    () =>
      useExperienceStore.subscribe((s, prev) => {
        if ((prev.screenFocused && !s.screenFocused) || s.currentChapter !== HERE) setOpen(null);
      }),
    [],
  );

  useEffect(
    () => () => {
      parts.material?.dispose();
    },
    [parts],
  );

  /**
   * Slide the drawer out and look down into it: the camera rises over the
   * contents' resting place once open, leaning a little toward the room so
   * the pieces read the right way up.
   */
  const openDrawer = (index: number, contents: Object3D) => {
    const front = new Vector3(1, 0, 0).transformDirection(cabinet.current!.matrixWorld);
    const target = contents.getWorldPosition(new Vector3());
    // Where the contents will be once the drawer is fully out.
    const already = (contents.parent as Group).position.x;
    target.addScaledVector(front, (SLIDE - already) * CABINET_SCALE);
    const camera = target
      .clone()
      .add(new Vector3(0, 0.62, 0))
      .addScaledVector(front, 0.3);
    camera.toArray(storyRig.screenFocus.camera);
    target.toArray(storyRig.screenFocus.target);
    setOpen(index);
    setFocused(true, "photo");
  };

  return (
    <group
      ref={cabinet}
      name="file-cabinet"
      position={at}
      rotation={[0, yaw, 0]}
      scale={CABINET_SCALE}
    >
      <group position={[-BODY.cx, -BODY.floor, -BODY.cz]}>
        {parts.body && <primitive object={parts.body} />}
        {parts.drawers.map(
          (mesh, i) =>
            mesh &&
            drawers[i] && (
              <Drawer
                key={i}
                index={i}
                mesh={mesh}
                drawer={drawers[i]}
                open={open === i}
                onOpen={openDrawer}
              />
            ),
        )}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Mannequin, boxes, light                                             */
/* ------------------------------------------------------------------ */

/**
 * The left side of the office: the merch file cabinets, a mannequin for the
 * tees, and evidence boxes on the cabinets and stacked beside them.
 */
export function MerchCorner() {
  return (
    <group name="merch-corner">
      {CABINETS.map((c, i) => (
        <FileCabinet key={i} at={c.at} yaw={c.yaw} drawers={c.drawers} />
      ))}
      <Model id="mannequin" />
      <CaseBoxes cabinets={CABINETS} top={(BODY_TOP - BODY.floor) * CABINET_SCALE} />
      {/* The gramophone on cabinet A, set back a little toward the wall so the
          horn does not overhang, its front turned to the room (the cabinet's
          drawer side), a touch toward the middle of the office. */}
      <Gramophone
        position={[
          CABINETS[0].at.x - 0.62 * GRAMOPHONE_SET_BACK,
          (BODY_TOP - BODY.floor) * CABINET_SCALE,
          CABINETS[0].at.z - 0.78 * GRAMOPHONE_SET_BACK,
        ]}
        yaw={CABINETS[0].yaw - Math.PI / 2 + 0.3}
      />
    </group>
  );
}
