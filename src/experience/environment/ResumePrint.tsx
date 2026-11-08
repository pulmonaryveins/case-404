import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  BufferAttribute,
  CanvasTexture,
  DoubleSide,
  MathUtils,
  type Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import { useExperienceStore } from "../../store/useExperienceStore";
import { storyRig } from "../../story/storyRig";
import { typewriterAudio } from "../audio/typewriterAudio";
import { shadowsChanged } from "../canvas/shadowUpdates";
import { useCursor } from "../cursor/cursorStore";
import { loadProgress } from "../loading/loadProgress";
import { useResume } from "../resume/resumeState";
import { paintResume, RESUME_GRID } from "../surfaces/paintResume";

/**
 * The resume, fed out of the typewriter line by line when the case is closed
 * (chapter CASE_SOLVED): the page rises out of the platen, typed, leaning back
 * a little, until the whole sheet stands out of the machine. Once printed it
 * can be clicked: the camera zooms in on it, with buttons to download it or
 * read it full size (ResumeOverlay).
 *
 * In the typewriter model's own units (DeskProp parents it to the model; 1
 * unit is 8.5 mm): the platen's top, where the paper leaves it, is at y 1.72,
 * z -1.42, and the sheet is the platen's width (3 units, ~26 cm).
 */
const PLATEN = [0, 1.72, -1.42] as const;
const SHEET_W = 3.0;
const SHEET_H = (SHEET_W * RESUME_GRID.h) / RESUME_GRID.w;
/** Lean of the sheet back from the vertical, as it stands out of the machine. */
const LEAN = 0.7;
/** Lines it is fed out in, and seconds per line. */
const LINES = 34;
const LINE_SECONDS = 0.24;
/** How much of each line's time the paper moves (the rest is the typing). */
const FEED_SHARE = 0.35;
/** The sheet starts with a little already showing above the platen. */
const LEAD = 0.04;

const HERE = "CASE_SOLVED";
/** The zoomed-in frame round the sheet (1 = edge to edge): just inside the screen's height. */
const FILL = 1.06;
/**
 * Texture widths: the page as seen across the room, and in the close-up,
 * where it fills the screen and its small type must read. The close-up one is
 * made when the camera goes in and freed when it comes out.
 */
const ROOM_PX = 1024;
const CLOSE_UP_PX = 2048;

function pageTexture(width: number) {
  const map = new CanvasTexture(paintResume(width));
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 8;
  return map;
}
/**
 * After the scene is ready, how long until printing may start (ms): the
 * loading screen's fade, so a page reloaded at the ending prints in view.
 */
const AFTER_LOAD_MS = 1200;

export function ResumePrint() {
  const { geometry, material, roomMap } = useMemo(() => {
    const roomMap = pageTexture(ROOM_PX);
    // A unit plane, its bottom edge on the platen: scaled to the fed length,
    // its UVs showing the top of the page down to that length.
    const geometry = new PlaneGeometry(1, 1);
    geometry.translate(0, 0.5, 0);
    const material = new MeshStandardMaterial({
      map: roomMap,
      roughness: 0.95,
      side: DoubleSide,
    });
    return { geometry, material, roomMap };
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      roomMap.dispose();
      material.dispose();
    },
    [geometry, material, roomMap],
  );

  const sheet = useRef<Mesh>(null);

  // In the close-up, the sharp page; back out, the room's again.
  const focused = useResume((s) => s.focused);
  useEffect(() => {
    const paper = sheet.current?.material as MeshStandardMaterial | undefined;
    if (!focused || !paper) return;
    const closeMap = pageTexture(CLOSE_UP_PX);
    paper.map = closeMap;
    return () => {
      paper.map = roomMap;
      closeMap.dispose();
    };
  }, [focused, roomMap]);
  /** Lines fed so far (fractional while the paper moves). */
  const fed = useRef(LEAD * LINES);
  const lastLine = useRef(-1);
  const shown = useRef(-1);
  const readyAt = useRef(0);

  useFrame((_, dt) => {
    const store = useExperienceStore.getState();
    if (!readyAt.current && loadProgress.getState().stage === "ready")
      readyAt.current = performance.now();
    const inView = readyAt.current > 0 && performance.now() - readyAt.current > AFTER_LOAD_MS;
    const here = inView && store.currentChapter === HERE;
    if (here && fed.current < LINES) {
      fed.current = store.reducedMotion ? LINES : Math.min(LINES, fed.current + dt / LINE_SECONDS);
      const line = Math.floor(fed.current);
      if (line !== lastLine.current && line < LINES) {
        lastLine.current = line;
        // One line's sound covers a few lines of paper: a typed line is wider than a fed one.
        if (line % 3 === 0) typewriterAudio.line(LINE_SECONDS * 3);
      }
      if (fed.current >= LINES) useResume.getState().setPrinted();
    }
    // The paper moves in steps: still while the line is typed, then fed on.
    const whole = Math.floor(fed.current);
    const part = fed.current - whole;
    const step = Math.min(1, Math.max(0, (part - (1 - FEED_SHARE)) / FEED_SHARE));
    const length = (SHEET_H * Math.min(LINES, whole + step * step * (3 - 2 * step))) / LINES;
    if (length === shown.current || !sheet.current) return;
    shown.current = length;
    shadowsChanged();
    sheet.current.scale.set(SHEET_W, Math.max(1e-4, length), 1);
    sheet.current.visible = length > 1e-3;
    // The fed part is the top of the page.
    const uv = geometry.getAttribute("uv") as BufferAttribute;
    const v = 1 - length / SHEET_H;
    // PlaneGeometry's corners: top-left, top-right, bottom-left, bottom-right.
    uv.setY(0, 1);
    uv.setY(1, 1);
    uv.setY(2, v);
    uv.setY(3, v);
    uv.needsUpdate = true;
  });

  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);
  /**
   * Flies the camera square onto the printed page: along its face's normal
   * (up and out from the machine), far enough back that the whole sheet fits.
   */
  const zoomIn = () => {
    const mesh = sheet.current!;
    mesh.updateWorldMatrix(true, false);
    const centre = mesh.localToWorld(new Vector3(0, 0.5, 0));
    const normal = new Vector3(0, 0, 1).transformDirection(mesh.matrixWorld);
    const scale = mesh.getWorldScale(new Vector3());
    const tan = Math.tan(MathUtils.degToRad(("fov" in camera ? (camera.fov as number) : 50) / 2));
    const dist = Math.max((scale.y * FILL) / 2 / tan, (scale.x * FILL) / 2 / (tan * aspect));
    centre.clone().addScaledVector(normal, dist).toArray(storyRig.screenFocus.camera);
    centre.toArray(storyRig.screenFocus.target);
    useExperienceStore.getState().setScreenFocused(true, "photo");
    useResume.getState().setFocused(true);
  };

  const printed = () =>
    useResume.getState().printed && !useExperienceStore.getState().screenFocused;
  return (
    <group position={PLATEN} rotation={[-LEAN, 0, 0]}>
      <mesh
        ref={sheet}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        visible={false}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          // In the close-up already: let the click through, it zooms back out.
          if (!printed()) return;
          e.stopPropagation();
          useCursor.getState().clear();
          zoomIn();
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          if (!printed()) return;
          e.stopPropagation();
          useCursor.getState().set("inspect", "Look closer");
        }}
        onPointerOut={() => useCursor.getState().clear()}
      />
    </group>
  );
}
