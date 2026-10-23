import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  CanvasTexture,
  CylinderGeometry,
  type Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  QuadraticBezierCurve3,
  SRGBColorSpace,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { assetManifest } from "../../assets/assetManifest";
import { designWork, designWorkUrl, type DesignPiece } from "../../data/designWork";
import { useExperienceStore } from "../../store/useExperienceStore";
import { paintPosterBack, paintStickyNote } from "../surfaces/paintPosterBack";
import { useDesignInspect } from "./designInspectState";
import { useWallInspect } from "./wallInspect";
import { shadowsChanged } from "../canvas/shadowUpdates";

/**
 * The design wall: the subject's own design work (data/designWork.ts) printed
 * on square posters and pinned up above the achievements shelf over the
 * terminal like evidence: scattered, tilted, each with a red pin and a
 * numbered sticky note, the pieces tied together with red string. Click one
 * for a close-up; it can be turned over there to read the pencilled notes on
 * its back. In the archive station's frame: the wall's front face is 0.476 m
 * behind the station centre (see RoomShell), `x` runs along the wall, `y` is
 * a poster's centre above the floor.
 */
const WALL_Z = -0.476;
const BASE_Z = WALL_Z + 0.004;
/** The square poster model is 0.36 m a side at 1. */
const MODEL_SIZE = 0.36;

/**
 * Where each print hangs, in the order of `designWork`: four, five, four, in
 * loose rows, each tilted and sized a little differently, the centre piece
 * largest. `note` is the sticky note's tilt; `noteTop` puts it at the top
 * right instead of the bottom right, where it would cover the poster's title.
 */
interface Spot {
  x: number;
  y: number;
  roll: number;
  s: number;
  note: number;
  noteTop?: boolean;
}
const LAYOUT: Spot[] = [
  { x: -0.55, y: 2.57, roll: 0.06, s: 0.64, note: 0.14 },
  { x: -0.2, y: 2.6, roll: -0.05, s: 0.6, note: -0.1 },
  { x: 0.14, y: 2.55, roll: 0.035, s: 0.64, note: 0.08 },
  { x: 0.5, y: 2.6, roll: -0.07, s: 0.6, note: -0.16 },
  { x: -0.66, y: 2.22, roll: -0.05, s: 0.62, note: 0.12 },
  { x: -0.37, y: 2.27, roll: 0.07, s: 0.6, note: -0.06 },
  { x: -0.05, y: 2.25, roll: -0.02, s: 0.74, note: 0.1 },
  { x: 0.29, y: 2.21, roll: 0.05, s: 0.62, note: -0.12 },
  { x: 0.62, y: 2.26, roll: -0.04, s: 0.62, note: 0.15, noteTop: true },
  { x: -0.5, y: 1.95, roll: 0.04, s: 0.62, note: -0.08 },
  { x: -0.17, y: 1.93, roll: -0.06, s: 0.6, note: 0.11 },
  { x: 0.17, y: 1.96, roll: 0.05, s: 0.62, note: -0.14 },
  { x: 0.51, y: 1.93, roll: -0.03, s: 0.64, note: 0.09 },
];

/**
 * Red string between prints (indices into `designWork`): the centre piece is
 * the hub; the rest link by kind (events, the seasonal posts) and neighbour.
 */
const LINKS: [number, number][] = [
  [0, 1],
  [1, 6],
  [2, 6],
  [3, 8],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [6, 10],
  [9, 10],
  [11, 6],
  [12, 8],
];

/**
 * In the poster model's own units: the pin at the top centre, where the paper
 * lies flat (its top-left corner curls off the wall), and the sticky note on
 * the flat lower right. The back sheet sits just behind the print.
 */
const PIN = new Vector3(0, 0.148, 0.03);
const NOTE = { x: 0.105, y: -0.115, top: 0.1, z: 0.008, size: 0.1 };
const STRING_RADIUS = 0.0015;
const STRING_COLOR = "#9b2823";

/**
 * Texture sizes: 512 px is plenty for a print on the wall at the camera's
 * ~2 m; the one in the close-up, which then fills most of the screen, loads
 * its full 1024 px source, and drops back once the close-up ends.
 */
const PRINT_PX = 512;
const CLOSE_UP_PX = 1024;

/** Turning a print over: how long, and how far it comes off the wall. */
const FLIP_SECONDS = 0.7;
/** Off the wall once turned (m), plus the arc it swings out on in between. */
const LIFT_TURNED = 0.06;
const LIFT_ARC = 0.11;

const PIN_HEAD = new SphereGeometry(0.014, 14, 10);
const PIN_NEEDLE = new CylinderGeometry(0.0025, 0.0025, 0.03, 6);
const PIN_RED = new MeshStandardMaterial({ color: "#b0201a", roughness: 0.35, metalness: 0.2 });
const PIN_STEEL = new MeshStandardMaterial({ color: "#9a9a9a", roughness: 0.3, metalness: 0.8 });
const NOTE_PLANE = new PlaneGeometry(NOTE.size, NOTE.size);
const BACK_PLANE = new PlaneGeometry(MODEL_SIZE * 1.005, MODEL_SIZE);

/**
 * Blank paper, shown until a print has loaded. A texture from the start (not
 * none), so swapping in the print never changes the shader.
 */
const BLANK = (() => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e8e1d3";
  ctx.fillRect(0, 0, 1, 1);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
})();

/**
 * Loads an image and draws it to `px` square, so a print on the wall holds a
 * 512 px texture, not the 1024 px source (about 1.4 MB of GPU memory, not 5.6).
 * The poster models' UVs run bottom-up, so the texture is flipped on upload.
 * A change of size keeps the old print up until the new one is ready, and
 * frees it only once the new one has replaced it.
 */
function usePrint(url: string, px: number) {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = px;
      const ctx = canvas.getContext("2d")!;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, px, px);
      const made = new CanvasTexture(canvas);
      made.flipY = true;
      made.colorSpace = SRGBColorSpace;
      made.anisotropy = 8;
      setTexture(made);
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url, px]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Where a print's pin head is, in the station frame (for its strings). */
function pinAt(i: number) {
  const { x, y, roll, s } = LAYOUT[i];
  const c = Math.cos(roll);
  const n = Math.sin(roll);
  return new Vector3(
    x + (PIN.x * c - PIN.y * n) * s,
    y + (PIN.x * n + PIN.y * c) * s,
    BASE_Z + (PIN.z + 0.012) * s,
  );
}

function DesignPrint({ piece, index }: { piece: DesignPiece; index: number }) {
  const { x, y, roll, s, note, noteTop } = LAYOUT[index];
  const number = index + 1;
  const { scene } = useGLTF(assetManifest.posterSquare.url);
  const inspected = useDesignInspect((st) => st.inspected === piece.file);
  const flipped = useDesignInspect((st) => st.inspected === piece.file && st.flipped);
  const print = usePrint(designWorkUrl(piece.file), inspected ? CLOSE_UP_PX : PRINT_PX);

  const { object, materials } = useMemo(() => {
    const materials: MeshStandardMaterial[] = [];
    const copy = scene.clone(true);
    copy.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const m = (o.material as MeshStandardMaterial).clone();
      m.map = print ?? BLANK;
      m.color.set("#ffffff");
      m.roughness = 0.85;
      m.metalness = 0;
      o.material = m;
      o.castShadow = true;
      o.receiveShadow = true;
      materials.push(m);
    });
    return { object: copy, materials };
  }, [scene, print]);
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  const noteMaterial = useMemo(
    () => new MeshStandardMaterial({ map: toTexture(paintStickyNote(number)), roughness: 0.9 }),
    [number],
  );
  useEffect(
    () => () => {
      noteMaterial.map?.dispose();
      noteMaterial.dispose();
    },
    [noteMaterial],
  );

  // The back is only painted once the print is first turned over.
  const [backPainted, setBackPainted] = useState(false);
  if (flipped && !backPainted) setBackPainted(true);
  const backMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        // Blank paper (as a texture, so the shader never changes) until painted.
        map: backPainted ? toTexture(paintPosterBack(piece, number)) : BLANK,
        roughness: 0.95,
      }),
    [backPainted, piece, number],
  );
  useEffect(
    () => () => {
      if (backMaterial.map !== BLANK) backMaterial.map?.dispose();
      backMaterial.dispose();
    },
    [backMaterial],
  );

  // Turning over: about its own upright, swinging out off the wall and back.
  const flipper = useRef<Group>(null);
  const turn = useRef(0);
  useFrame((_, dt) => {
    const target = flipped ? 1 : 0;
    // Back on the wall after the close-up: free its painted back (~4 MB).
    if (turn.current === 0 && backPainted && !inspected) setBackPainted(false);
    if (!flipper.current || turn.current === target) return;
    shadowsChanged();
    const step = dt / FLIP_SECONDS;
    turn.current =
      target > turn.current
        ? Math.min(target, turn.current + step)
        : Math.max(target, turn.current - step);
    const e = MathUtils.smootherstep(turn.current, 0, 1);
    flipper.current.rotation.y = Math.PI * e;
    flipper.current.position.z = LIFT_TURNED * e + LIFT_ARC * Math.sin(Math.PI * e);
  });

  // Click to look closer: the print fills most of the frame.
  const group = useRef<Group>(null);
  // A little wider than the print, so the "Turn over" button below clears it.
  const inspect = useWallInspect(() => group.current, "Inspect design", 1.4);
  const handlers = {
    ...inspect,
    onClick: (e: ThreeEvent<MouseEvent>) => {
      // Only the click that opens the close-up picks the print; a click while
      // already zoomed in is the one that zooms back out.
      const wasFocused = useExperienceStore.getState().screenFocused;
      inspect.onClick(e);
      if (!wasFocused && useExperienceStore.getState().screenFocused)
        useDesignInspect.getState().inspect(piece.file);
    },
  };

  return (
    <group ref={group} position={[x, y, BASE_Z]} rotation={[0, 0, roll]} {...handlers}>
      {/* The pin through its top, and its strings, stay in the wall when the
          print is taken down to be turned over. */}
      <group scale={s}>
        <mesh geometry={PIN_HEAD} material={PIN_RED} position={PIN} castShadow />
        <mesh
          geometry={PIN_NEEDLE}
          material={PIN_STEEL}
          position={[PIN.x, PIN.y, PIN.z - 0.015]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </group>
      <group ref={flipper}>
        <group scale={s}>
          <primitive object={object} />
          {/* Its number, on a sticky note stuck to the lower right. */}
          <mesh
            geometry={NOTE_PLANE}
            material={noteMaterial}
            position={[NOTE.x, noteTop ? NOTE.top : NOTE.y, NOTE.z]}
            rotation={[0, 0, note]}
            castShadow
            receiveShadow
          />
          {/* Its back, facing the wall until it is turned over. */}
          <mesh
            geometry={BACK_PLANE}
            material={backMaterial}
            position={[0, 0, -0.001]}
            rotation={[0, Math.PI, 0]}
            receiveShadow
          />
        </group>
      </group>
    </group>
  );
}

/**
 * Red string between the pins of linked prints, sagging, merged into one mesh.
 * It fades back while a print is in the close-up, so it does not cut across it.
 */
const STRING_FADED = 0.18;
const STRING_FADE_SECONDS = 0.4;

function Strings() {
  const inspecting = useDesignInspect((st) => st.inspected !== null);
  const material = useRef<MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    const m = material.current;
    if (!m) return;
    const target = inspecting ? STRING_FADED : 1;
    if (m.opacity === target) return;
    const step = (dt / STRING_FADE_SECONDS) * (1 - STRING_FADED);
    m.opacity =
      target > m.opacity ? Math.min(target, m.opacity + step) : Math.max(target, m.opacity - step);
  });

  const geometry = useMemo(() => {
    const strand = (a: Vector3, b: Vector3) => {
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.y -= a.distanceTo(b) * 0.12;
      mid.z = Math.max(a.z, b.z) + 0.01;
      return new TubeGeometry(new QuadraticBezierCurve3(a, mid, b), 18, STRING_RADIUS, 5, false);
    };
    const count = Math.min(designWork.length, LAYOUT.length);
    const tubes = LINKS.filter(([a, b]) => a < count && b < count).map(([a, b]) =>
      strand(pinAt(a), pinAt(b)),
    );
    if (!tubes.length) return null;
    const merged = mergeGeometries(tubes);
    tubes.forEach((t) => t.dispose());
    return merged;
  }, []);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow>
      <meshStandardMaterial
        ref={material}
        color={STRING_COLOR}
        roughness={0.92}
        metalness={0}
        transparent
      />
    </mesh>
  );
}

export function DesignPosters() {
  // The close-up ending ends the inspection (and turns the print back).
  useEffect(
    () =>
      useExperienceStore.subscribe((state, prev) => {
        if (prev.screenFocused && !state.screenFocused) useDesignInspect.getState().clear();
      }),
    [],
  );
  return (
    <group name="design-posters">
      {designWork.slice(0, LAYOUT.length).map((piece, i) => (
        <DesignPrint key={piece.file} piece={piece} index={i} />
      ))}
      <Strings />
    </group>
  );
}
