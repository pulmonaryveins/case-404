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
import { paintPosterBack } from "../surfaces/paintPosterBack";
import { useDesignInspect } from "./designInspectState";
import { useWallInspect } from "./wallInspect";
import { shadowsChanged } from "../canvas/shadowUpdates";

/**
 * The design wall: the subject's own design work (data/designWork.ts) printed
 * on square posters and pinned up above the achievements shelf over the
 * terminal like evidence: scattered, tilted, each on a red pin, red string
 * running out from the hub print to every other one like a web. Click one
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
 * Where each print hangs, in the order of `designWork`: scattered round the
 * hub print (the Bay Harbor Butcher board, the largest, in the middle), no
 * two the same size or tilt, as if pinned up one at a time.
 */
interface Spot {
  x: number;
  y: number;
  roll: number;
  s: number;
}
const LAYOUT: Spot[] = [
  { x: -0.53, y: 2.58, roll: 0.08, s: 0.6 },
  { x: -0.2, y: 2.64, roll: -0.05, s: 0.57 },
  { x: 0.19, y: 2.6, roll: 0.06, s: 0.62 },
  { x: 0.55, y: 2.55, roll: -0.09, s: 0.6 },
  { x: -0.68, y: 2.25, roll: -0.06, s: 0.62 },
  { x: -0.37, y: 2.33, roll: 0.1, s: 0.56 },
  { x: 0, y: 2.29, roll: -0.03, s: 0.78 },
  { x: 0.37, y: 2.23, roll: -0.07, s: 0.58 },
  { x: 0.69, y: 2.31, roll: 0.05, s: 0.62 },
  { x: -0.49, y: 1.97, roll: 0.05, s: 0.6 },
  { x: -0.15, y: 1.94, roll: -0.08, s: 0.62 },
  { x: 0.2, y: 1.98, roll: 0.04, s: 0.58 },
  { x: 0.52, y: 1.94, roll: -0.06, s: 0.64 },
];

/** The hub: every string runs from its pin out to each other print's pin. */
const HUB = designWork.findIndex((p) => p.file === "9.webp");

/**
 * In the poster model's own units: the pin at the top centre, where the paper
 * lies flat (its top-left corner curls off the wall). The back sheet sits
 * just behind the print.
 */
const PIN = new Vector3(0, 0.148, 0.03);
const STRING_RADIUS = 0.0009;
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

const PIN_HEAD = new SphereGeometry(0.009, 14, 10);
const PIN_NEEDLE = new CylinderGeometry(0.0016, 0.0016, 0.03, 6);
const PIN_RED = new MeshStandardMaterial({ color: "#b0201a", roughness: 0.35, metalness: 0.2 });
const PIN_STEEL = new MeshStandardMaterial({ color: "#9a9a9a", roughness: 0.3, metalness: 0.8 });
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
    BASE_Z + (PIN.z + 0.008) * s,
  );
}

function DesignPrint({ piece, index }: { piece: DesignPiece; index: number }) {
  const { x, y, roll, s } = LAYOUT[index];
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

  // The back is only painted once the print is first turned over.
  const [backPainted, setBackPainted] = useState(false);
  if (flipped && !backPainted) setBackPainted(true);
  const backMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        // Blank paper (as a texture, so the shader never changes) until painted.
        map: backPainted ? toTexture(paintPosterBack(piece, index)) : BLANK,
        roughness: 0.95,
      }),
    [backPainted, piece, index],
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
      {/* The pin, and its strings, stay in the wall when the print is taken
          down to be turned over. */}
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
 * Red string from the hub's pin out to every other print's pin, like the
 * spokes of a web, running over the prints it crosses: nearly taut, bowed
 * off the wall enough to clear their paper. Merged into one mesh. It fades
 * out while a print is in the close-up, so nothing cuts across it.
 */
const STRING_FADE_SECONDS = 0.4;

function Strings() {
  const inspecting = useDesignInspect((st) => st.inspected !== null);
  const mesh = useRef<Mesh>(null);
  const material = useRef<MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    const m = material.current;
    if (!m || !mesh.current) return;
    const target = inspecting ? 0 : 1;
    if (m.opacity === target) return;
    const step = dt / STRING_FADE_SECONDS;
    m.opacity =
      target > m.opacity ? Math.min(target, m.opacity + step) : Math.max(target, m.opacity - step);
    mesh.current.visible = m.opacity > 0;
  });

  const geometry = useMemo(() => {
    const strand = (a: Vector3, b: Vector3) => {
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.y -= a.distanceTo(b) * 0.03;
      mid.z = Math.max(a.z, b.z) + 0.02;
      return new TubeGeometry(new QuadraticBezierCurve3(a, mid, b), 18, STRING_RADIUS, 5, false);
    };
    const count = Math.min(designWork.length, LAYOUT.length);
    if (HUB < 0 || HUB >= count) return null;
    const hub = pinAt(HUB);
    const tubes = Array.from({ length: count }, (_, i) => i)
      .filter((i) => i !== HUB)
      .map((i) => strand(hub, pinAt(i)));
    if (!tubes.length) return null;
    const merged = mergeGeometries(tubes);
    tubes.forEach((t) => t.dispose());
    return merged;
  }, []);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh ref={mesh} geometry={geometry} castShadow>
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
