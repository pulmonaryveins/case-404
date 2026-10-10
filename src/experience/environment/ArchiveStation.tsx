import { useEffect, useMemo, useRef, useState } from "react";
import type { PointLight, SpotLight } from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  CanvasTexture,
  Euler,
  MathUtils,
  Object3D,
  MeshBasicMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { archiveProjects } from "../../data/projects";
import { useExperienceStore } from "../../store/useExperienceStore";
import { storyRig } from "../../story/storyRig";
import { Model } from "../models/Model";
import { paintArchiveScreen, SCREEN_H, SCREEN_W, type ScreenView } from "../surfaces/paintArchive";
import { ContactShadow } from "./ContactShadow";
import { STACK_POP, stackSlot, type StackRow } from "./diskStacks";
import { DesignPosters } from "./DesignPosters";
import { DeskProp } from "./DeskProps";
import { DeskLampLight } from "../lighting/DeskLampLight";
import { FloppyDisk, INSERT_SECONDS, type DiskPose } from "./FloppyDisk";
import { PersonalComputer } from "./PersonalComputer";
import { PolaroidPhotos } from "./PolaroidPhotos";
import { PC_MODEL, placeComputer } from "./computerPlacement";
import { useBlobTexture } from "./useBlobTexture";
import { ARCHIVE_YAW, DESK_TOP, worldAnchors } from "./worldAnchors";

/**
 * The second desk stands in the back-right corner, turned ~38 degrees so its
 * front faces the room and stays in view from the opening shot. Everything
 * below is in the station's own frame (desk centre at the origin); this
 * group's transform is the only place the corner position lives. The
 * angled wall behind it is in RoomShell. Keep in sync with the
 * `digitalArchive` camera anchor.
 */
const STATION_POS = worldAnchors.digitalArchive!;
const STATION_YAW = ARCHIVE_YAW;

const PC_POS = new Vector3(-0.4, DESK_TOP, -0.03);
const PC_FACING = 0.1;
/** Lamp footprint centre (station frame) and yaw: its shade faces the camera. */
const LAMP_AT: [number, number] = [0.52, -0.15];
const LAMP_YAW = 5.8;
/** Polaroid camera footprint centre (station frame). */
const POLAROID_AT: [number, number] = [0.62, 0.07];
const FLAT = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));
const yawQuat = (yaw: number) => new Quaternion().setFromEuler(new Euler(0, yaw, 0));

/** Redraws the CRT canvas and flags its texture for upload. */
function repaintScreen(
  screen: { canvas: HTMLCanvasElement; map: CanvasTexture },
  view: ScreenView,
  scroll = 0,
) {
  const max = paintArchiveScreen(screen.canvas, view, scroll);
  screen.map.needsUpdate = true;
  return max;
}

/** The terminal's scroll, in canvas px: where it is, where it is heading, how far it can go. */
const terminalScroll = { target: 0, current: 0, max: 0 };

/**
 * What the CRT shows for the disk in the drive: the menu while it is still
 * travelling in, a "disk inserted" read-out, then the file itself.
 */
const insertPhase = { since: 0, last: 0, ready: false };
const READ_MS = 1500;

/** Keep the CRT this much larger than the frame's height when zoomed on. */
const ZOOM_FILL = 1.18;
/** Pixels of terminal scroll per wheel pixel, and per arrow-key press. */
const WHEEL_GAIN = 0.9;
const KEY_STEP = 90;

/** Seconds of boot sequence after the camera reaches the archive desk. */
const BOOT_MS = 4200;

/** Chapters where the camera is at the archive desk or its poster wall. */
const AT_ARCHIVE = ["DIGITAL_ARCHIVE", "GRAPHIC_DESIGN"];
const KEY = 1.1;
const SCREEN_GLOW = 0.3;

/**
 * Desk lighting: a soft, shadowless warm key from in front and above, and a
 * faint phosphor-green spill from the CRT. The key fades in only while the
 * camera is here, so this corner does not outshine the main desk in the
 * opening shot; the green spill exists only while the terminal is on.
 * Both keep a fixed light count (intensity 0, never unmounted) so switching
 * never recompiles the room's materials.
 */
function StationLights() {
  const key = useRef<SpotLight>(null);
  const glow = useRef<PointLight>(null);
  const [target] = useState(() => new Object3D());
  useFrame((_, dt) => {
    const { currentChapter, archiveOnline } = useExperienceStore.getState();
    if (key.current) {
      const to = AT_ARCHIVE.includes(currentChapter) ? KEY : 0;
      key.current.intensity = MathUtils.damp(key.current.intensity, to, 2, dt);
    }
    if (glow.current) {
      const to = archiveOnline ? SCREEN_GLOW : 0;
      glow.current.intensity = MathUtils.damp(glow.current.intensity, to, 3, dt);
    }
  });
  return (
    <>
      <primitive object={target} position={[0.05, DESK_TOP, -0.05]} />
      <spotLight
        ref={key}
        position={[0.1, 1.45, 1.1]}
        target={target}
        color="#ffd9aa"
        intensity={0}
        decay={0}
        angle={0.75}
        penumbra={1}
      />
      <pointLight
        ref={glow}
        position={[PC_POS.x - 0.1, DESK_TOP + 0.45, PC_POS.z + 0.45]}
        color="#6dffb0"
        intensity={0}
        distance={1.4}
        decay={2}
      />
    </>
  );
}

/** Project of the disk currently in the drive, or null. */
function useActiveProject() {
  const id = useExperienceStore((s) => s.activeProjectId);
  return archiveProjects.find((p) => p.id === id) ?? null;
}

/**
 * The project archive: a 1970s terminal and a set of floppy disks on a
 * second desk. Selecting a disk slides it into the drive and puts its record
 * on the CRT. Static geometry; only the disks and the screen change.
 */
export function ArchiveStation() {
  const chapter = useExperienceStore((s) => s.currentChapter);
  const setActive = useExperienceStore((s) => s.setActiveProjectId);
  const active = useActiveProject();
  const online = useExperienceStore((s) => s.archiveOnline);
  const setOnline = useExperienceStore((s) => s.setArchiveOnline);
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const interactive = chapter === "DIGITAL_ARCHIVE";
  const focused = useExperienceStore((s) => s.screenFocused);
  const setFocused = useExperienceStore((s) => s.setScreenFocused);
  const focusKind = useExperienceStore((s) => s.focusKind);
  const camera = useThree((s) => s.camera);
  const aspect = useThree((s) => s.size.width / s.size.height);

  const blob = useBlobTexture();
  // CRT contents, repainted whenever the inserted disk changes.
  const screen = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 8;
    const material = new MeshBasicMaterial({ map, toneMapped: false, color: "#ffffff" });
    return { canvas, map, material };
  }, []);
  // The terminal is off until the camera reaches it, then boots; leaving puts it
  // back to sleep and ejects the disk.
  const power = useRef({ mode: "off" as "off" | "boot" | "on", since: 0, last: 0 });
  useFrame(() => {
    const p = power.current;
    const now = performance.now();
    if (!interactive) {
      if (p.mode !== "off") {
        p.mode = "off";
        repaintScreen(screen, { kind: "off" });
        setOnline(false);
        setActive(null);
        if (useExperienceStore.getState().screenFocused) setFocused(false);
      }
      return;
    }
    if (p.mode === "off") {
      p.mode = "boot";
      p.since = now;
      p.last = 0;
    }
    if (p.mode === "boot") {
      const t = reducedMotion ? 1 : (now - p.since) / BOOT_MS;
      if (t >= 1) {
        p.mode = "on";
        setOnline(true);
      } else if (now - p.last > 70) {
        p.last = now;
        repaintScreen(screen, { kind: "boot", t });
      }
    }
  });
  // Menu or the inserted disk's record once online; blank while it is off.
  useEffect(() => {
    // A new page starts at the top.
    terminalScroll.target = terminalScroll.current = 0;
    insertPhase.since = performance.now();
    insertPhase.last = 0;
    insertPhase.ready = false;
    if (online) {
      // The disk is not in the drive yet (or has been ejected): the menu.
      terminalScroll.max = repaintScreen(screen, {
        kind: "menu",
        active: null,
        projects: archiveProjects,
      });
    } else if (power.current.mode === "off") repaintScreen(screen, { kind: "off" });
  }, [screen, online, active]);
  // The inserted video disk plays its clip on the tube, repainted each frame.
  const video = useRef<HTMLVideoElement | null>(null);
  const clip = active?.video ?? null;
  useEffect(() => {
    if (!clip) return;
    const el = document.createElement("video");
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.src = clip;
    el.play().catch(() => {});
    video.current = el;
    return () => {
      video.current = null;
      el.pause();
      el.removeAttribute("src");
      el.load();
    };
  }, [clip]);
  // Eases the terminal's scroll, and repaints while it moves or a clip plays.
  useFrame((_, dt) => {
    const sinceInsert = performance.now() - insertPhase.since;
    if (online && active && !insertPhase.ready) {
      const wait = INSERT_SECONDS * 1000;
      if (sinceInsert < wait) return;
      const t = reducedMotion ? 1 : (sinceInsert - wait) / READ_MS;
      if (t < 1) {
        if (performance.now() - insertPhase.last > 70) {
          insertPhase.last = performance.now();
          repaintScreen(screen, { kind: "insert", project: active, t });
        }
        return;
      }
      insertPhase.ready = true;
      terminalScroll.max = repaintScreen(screen, {
        kind: "menu",
        active,
        projects: archiveProjects,
      });
    }
    if (active && !insertPhase.ready) return;
    const el = video.current;
    const playing = !!active?.video && !!el && el.readyState >= 2;
    terminalScroll.target = MathUtils.clamp(terminalScroll.target, 0, terminalScroll.max);
    const before = terminalScroll.current;
    terminalScroll.current = MathUtils.damp(terminalScroll.current, terminalScroll.target, 14, dt);
    if (Math.abs(terminalScroll.current - terminalScroll.target) < 0.3)
      terminalScroll.current = terminalScroll.target;
    if (!online || (!playing && terminalScroll.current === before)) return;
    terminalScroll.max = repaintScreen(
      screen,
      { kind: "menu", active, projects: archiveProjects, video: playing ? el : undefined },
      terminalScroll.current,
    );
  });
  // Zoomed onto the screen: the wheel, arrows and touch scroll the terminal.
  useEffect(() => {
    storyRig.screenFocus.on = focused;
    if (!focused || focusKind !== "screen") return;
    const by = (px: number) => {
      terminalScroll.target = MathUtils.clamp(terminalScroll.target + px, 0, terminalScroll.max);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      by(e.deltaY * WHEEL_GAIN);
    };
    const onKey = (e: KeyboardEvent) => {
      const step: Record<string, number> = {
        ArrowDown: KEY_STEP,
        ArrowUp: -KEY_STEP,
        PageDown: KEY_STEP * 5,
        PageUp: -KEY_STEP * 5,
        " ": KEY_STEP * 5,
        Home: -1e5,
        End: 1e5,
      };
      if (e.key in step) {
        e.preventDefault();
        by(step[e.key]);
      }
    };
    let lastY = 0;
    const onTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0].clientY;
      by((lastY - y) * 1.6);
      lastY = y;
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [focused, focusKind]);

  /** Click the CRT: fly the camera square-on to it, filling the view. */
  const zoomToScreen = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || !online) return;
    e.stopPropagation();
    const o = e.object;
    o.updateWorldMatrix(true, false);
    const centre = new Vector3();
    const quat = new Quaternion();
    const size = new Vector3();
    o.matrixWorld.decompose(centre, quat, size);
    const { w, h } = PC_MODEL.screen;
    const fov = "fov" in camera ? (camera.fov as number) : 40;
    const tan = Math.tan(MathUtils.degToRad(fov / 2));
    // Fit whichever of the screen's height or width is the tighter fit.
    const dist = (Math.max(h * size.y, (w * size.x) / aspect) * ZOOM_FILL) / 2 / tan;
    const at = new Vector3(0, 0, 1).applyQuaternion(quat).multiplyScalar(dist).add(centre);
    at.toArray(storyRig.screenFocus.camera);
    centre.toArray(storyRig.screenFocus.target);
    setFocused(true);
  };
  useEffect(
    () => () => {
      screen.map.dispose();
      screen.material.dispose();
    },
    [screen],
  );

  const poses = useMemo(() => {
    const pc = placeComputer(PC_POS, DESK_TOP, PC_FACING);
    const insertQuat = yawQuat(PC_FACING).multiply(FLAT);
    const insertCentre = pc.insertAt;
    // A soft footprint under the terminal, in the station frame.
    const scale = assetManifest.archiveComputer.scale;
    const foot = (f: { x: number; z: number; d: number; w: number }, grow: number) => {
      const at = new Vector3(f.x, PC_MODEL.min.y, f.z).applyMatrix4(pc.matrix);
      // The footprint's wide axis is the model's x, which is a blob's local x.
      return {
        at: [at.x, at.z] as [number, number],
        yaw: pc.yaw,
        along: f.w * scale * grow,
        across: f.d * scale * grow,
      };
    };
    const shadows = [{ ...foot(PC_MODEL.caseFoot, 1.2), opacity: 0.9 }];

    const perRow = { Development: 0, "UI/UX": 0, "Video Editing": 0 };
    const disks = archiveProjects.map((project, index) => {
      const row = project.category as StackRow;
      const slot = perRow[row]++;
      const rest: DiskPose = {
        position: stackSlot(row, slot),
        quaternion: FLAT,
      };
      return { project, index, rest, insert: { position: insertCentre, quaternion: insertQuat } };
    });
    return { disks, outward: pc.outward, shadows, matrix: pc.matrix };
  }, []);

  return (
    <group name="archive-station" position={STATION_POS} rotation={[0, STATION_YAW, 0]}>
      <Model id="archiveDesk" />
      <StationLights />
      <DesignPosters />

      <PersonalComputer
        matrix={poses.matrix}
        screen={screen.material}
        onScreenClick={interactive && online && !focused ? zoomToScreen : undefined}
      />
      {poses.shadows.map((shadow, i) => (
        <ContactShadow key={i} {...shadow} map={blob} />
      ))}
      {/* The same banker's lamp as the working desk, at the right end, turned to
          shine back across the terminal. Lit only while the camera is here. */}
      {/* Front-right of the desk, between the disk rows and the lamp: the
          instant camera turned a little toward the room, its prints spilled
          around it. */}
      <DeskProp id="polaroidCamera" at={POLAROID_AT} yaw={-0.5} />
      <PolaroidPhotos interactive={interactive} />
      <DeskProp id="deskLamp" lamp="archive" at={LAMP_AT} yaw={LAMP_YAW}>
        <DeskLampLight lamp="archive" shadowSize={1024} strength={0.35} />
      </DeskProp>

      {poses.disks.map(({ project, index, rest, insert }) => (
        <FloppyDisk
          key={project.id}
          project={project}
          index={index}
          rest={rest}
          insert={insert}
          outward={poses.outward}
          pop={STACK_POP}
          inserted={active?.id === project.id}
          interactive={interactive && online}
          onSelect={() => setActive(active?.id === project.id ? null : project.id)}
        />
      ))}
    </group>
  );
}
