import { useEffect, useMemo, useRef } from "react";
import type { PointLight } from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  CanvasTexture,
  Euler,
  MathUtils,
  MeshBasicMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { archiveProjects, type Project } from "../../data/projects";
import { useExperienceStore } from "../../store/useExperienceStore";
import { storyRig } from "../../story/storyRig";
import { computerAudio } from "../audio/computerAudio";
import { Model } from "../models/Model";
import {
  paintArchiveScreen,
  scanlines,
  SCREEN_H,
  SCREEN_W,
  type ScreenView,
} from "../surfaces/paintArchive";
import { nigelFaceAt, paintNigelChat, paintNigelSplash } from "../surfaces/paintNigel";
import {
  MAX_INPUT,
  nigel,
  nigelReset,
  nigelSkip,
  nigelStep,
  nigelSubmit,
  nigelType,
} from "../nigel/nigelChat";
import { AchievementShelf } from "./AchievementShelf";
import { ContactShadow } from "./ContactShadow";
import { DiskRack } from "./DiskRack";
import { DISK, DISK_T, RACK_AT, rackSlot, type RackColumn } from "./diskRackLayout";
import { DesignPosters } from "./DesignPosters";
import { DeskProp } from "./DeskProps";
import { DeskLampLight } from "../lighting/DeskLampLight";
import { FloppyDisk, INSERT_SECONDS, type DiskPose } from "./FloppyDisk";
import { PersonalComputer } from "./PersonalComputer";
import { PolaroidPhotos } from "./PolaroidPhotos";
import { PowerButton } from "./PowerButton";
import { WallE } from "./WallE";
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
// The shade faces the camera, a little to the left. The light is aimed further
// left than the shade faces (in the lamp's own space: less to the right, more
// forward), so it still reaches the disk rack and the terminal.
const LAMP_YAW = 5.5;
const LAMP_AIM: [number, number, number] = [0.02, -0.12, 0.4];
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

/** Paints the CRT with `paint` (then its scanlines) and flags the texture for upload. */
function paintOnScreen(
  screen: { canvas: HTMLCanvasElement; map: CanvasTexture },
  paint: (ctx: CanvasRenderingContext2D) => void,
) {
  const ctx = screen.canvas.getContext("2d")!;
  paint(ctx);
  scanlines(ctx);
  screen.map.needsUpdate = true;
}

/** Length of the CRT switch-off. */
const SHUTDOWN_MS = 1100;

/**
 * Shortest gap between screen repaints while it scrolls, plays a clip or
 * switches off. Every repaint re-uploads the whole 1024 x 683 screen texture
 * to the GPU; ~30 a second is smooth on a CRT and half the cost of every frame.
 */
const PAINT_MS = 33;
const paintClock = { last: 0 };

/**
 * One frame of a CRT switching off, drawn over the last picture: the image
 * squeezes to a bright horizontal line, the line shrinks to a dot, and the
 * dot fades, as the tube's beam collapses.
 */
function paintShutdown(
  screen: { canvas: HTMLCanvasElement; map: CanvasTexture },
  last: HTMLCanvasElement,
  t: number,
) {
  const ctx = screen.canvas.getContext("2d")!;
  const W = SCREEN_W;
  const H = SCREEN_H;
  const cx = W / 2;
  const cy = H / 2;
  const easeIn = (x: number) => x * x * x;
  ctx.save();
  ctx.fillStyle = "#020403";
  ctx.fillRect(0, 0, W, H);
  if (t < 0.45) {
    const k = easeIn(t / 0.45);
    const h = Math.max(4, H * (1 - k));
    const w = W * (1 - 0.06 * k);
    ctx.drawImage(last, cx - w / 2, cy - h / 2, w, h);
    // The picture brightens as the beam's energy concentrates.
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.7 * k;
    ctx.fillStyle = "#9effc8";
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  } else if (t < 0.75) {
    const k = easeIn((t - 0.45) / 0.3);
    const w = Math.max(8, W * 0.94 * (1 - k));
    ctx.fillStyle = "rgba(120, 255, 180, 0.35)";
    ctx.fillRect(cx - w / 2, cy - 7, w, 14);
    ctx.fillStyle = "#eefff4";
    ctx.fillRect(cx - w / 2, cy - 2, w, 4);
  } else {
    const k = (t - 0.75) / 0.25;
    const a = 1 - k;
    const r = 22 * (1 - 0.5 * k);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(245, 255, 248, ${a})`);
    g.addColorStop(0.35, `rgba(120, 255, 180, ${0.6 * a})`);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
  ctx.restore();
  screen.map.needsUpdate = true;
}

/** Length of the CRT's change from a disk's record back to the menu. */
const TRANSITION_MS = 750;

/** A copy of a canvas's picture, to keep what was showing. */
function copyOf(canvas: HTMLCanvasElement) {
  const copy = document.createElement("canvas");
  copy.width = canvas.width;
  copy.height = canvas.height;
  copy.getContext("2d")!.drawImage(canvas, 0, 0);
  return copy;
}

/**
 * The change from a disk's record back to the menu: the picture tears into
 * horizontal bands that slip sideways, a bright band sweeps down the tube and
 * the static thickens to a flash at the middle, where it swaps to the menu and
 * settles. `t` runs 0 to 1. Per frame, a few dozen band copies and a few
 * hundred specks (nothing under a clip).
 */
function paintTransition(
  screen: { canvas: HTMLCanvasElement; map: CanvasTexture },
  from: HTMLCanvasElement,
  to: HTMLCanvasElement,
  t: number,
) {
  const ctx = screen.canvas.getContext("2d")!;
  const W = SCREEN_W;
  const H = SCREEN_H;
  // Nothing at either end, full at the middle.
  const k = Math.sin(Math.PI * t);
  const src = t < 0.5 ? from : to;
  ctx.save();
  ctx.fillStyle = "#020403";
  ctx.fillRect(0, 0, W, H);
  let y = 0;
  while (y < H) {
    const h = Math.min(6 + Math.random() * 26, H - y);
    const shift = (Math.random() - 0.5) * 200 * k * k;
    ctx.drawImage(src, 0, y, W, h, shift, y, W, h);
    y += h;
  }
  ctx.globalCompositeOperation = "lighter";
  const band = (t * 1.5 - 0.15) * H;
  ctx.fillStyle = `rgba(150, 255, 200, ${0.16 * k})`;
  ctx.fillRect(0, band - 28, W, 56);
  const specks = Math.round(900 * k * k);
  for (let i = 0; i < specks; i++) {
    ctx.fillStyle = `rgba(190, 255, 215, ${0.12 + Math.random() * 0.5 * k})`;
    ctx.fillRect(
      Math.random() * W,
      Math.random() * H,
      2 + Math.random() * 40 * k,
      1 + Math.random() * 2,
    );
  }
  if (Math.abs(t - 0.5) < 0.08) {
    ctx.fillStyle = "rgba(120, 255, 180, 0.28)";
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  screen.map.needsUpdate = true;
}

/** The change in progress (if any), mutated by the effect that starts it and the frame loop. */
const crtTransition: {
  run: { since: number; last: number; from: HTMLCanvasElement; to: HTMLCanvasElement } | null;
} = { run: null };

/** The terminal's scroll, in canvas px: where it is, where it is heading, how far it can go. */
const terminalScroll = { target: 0, current: 0, max: 0 };

/**
 * What the CRT shows for the disk in the drive: the menu while it is still
 * travelling in, a "disk inserted" read-out, then the file itself.
 */
const insertPhase = { since: 0, last: 0, ready: false };
const READ_MS = 1500;

/**
 * The red disk by the rack: N.I.G.E.L., the inquiry program (nigelChat). It
 * goes in and out like a project disk; while it is in, the CRT runs the chat.
 */
const NIGEL_ID = "nigel";
const NIGEL_DISK: Project = {
  id: NIGEL_ID,
  title: "N.I.G.E.L. Inquiry Program",
  category: "Development",
  description: "",
  tools: [],
};
/** The program's splash, after the disk has gone in. */
const NIGEL_SPLASH_MS = 2600;
/** What the chat last painted (see the frame loop): repaint only when it changes. */
const nigelPaint = { last: 0, key: "" };

/** Keep the CRT this much larger than the frame's height when zoomed on. */
const ZOOM_FILL = 1.18;
/** Pixels of terminal scroll per wheel pixel, and per arrow-key press. */
const WHEEL_GAIN = 0.9;
const KEY_STEP = 90;

/** Seconds of boot sequence after the camera reaches the archive desk. */
const BOOT_MS = 4200;

const SCREEN_GLOW = 0.3;

/**
 * Desk lighting: a faint phosphor-green spill from the CRT, which exists only
 * while the terminal is on. It keeps a fixed light count (intensity 0, never
 * unmounted) so switching never recompiles the room's materials.
 */
function StationLights() {
  const glow = useRef<PointLight>(null);
  useFrame((_, dt) => {
    const { archiveOnline } = useExperienceStore.getState();
    if (glow.current) {
      const to = archiveOnline ? SCREEN_GLOW : 0;
      glow.current.intensity = MathUtils.damp(glow.current.intensity, to, 3, dt);
    }
  });
  return (
    <>
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
  const nigelIn = useExperienceStore((s) => s.activeProjectId === NIGEL_ID);
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
  // back to sleep and ejects the disk. The red power button switches it off
  // (with the CRT collapse) and on again; switched off, it stays off, even
  // when the camera leaves and comes back, until it is switched on.
  const power = useRef({
    mode: "off" as "off" | "boot" | "on" | "shutdown",
    since: 0,
    last: 0,
    userOff: false,
    /** Switched on by the button (a click behind the sound) rather than by arriving. */
    pressed: false,
    picture: null as HTMLCanvasElement | null,
  });
  const togglePower = () => {
    const p = power.current;
    if (p.mode === "shutdown") return;
    if (p.mode === "off") {
      p.userOff = false; // boots on the next frame
      p.pressed = true;
      return;
    }
    p.userOff = true;
    computerAudio.powerOff(SHUTDOWN_MS / 1000);
    p.mode = "shutdown";
    p.since = performance.now();
    // Keep the last picture to collapse.
    const copy = document.createElement("canvas");
    copy.width = SCREEN_W;
    copy.height = SCREEN_H;
    copy.getContext("2d")!.drawImage(screen.canvas, 0, 0);
    p.picture = copy;
    setOnline(false);
    setActive(null);
    if (useExperienceStore.getState().screenFocused) setFocused(false);
  };
  useFrame(() => {
    const p = power.current;
    const now = performance.now();
    if (p.mode === "shutdown") {
      const t = reducedMotion ? 1 : (now - p.since) / SHUTDOWN_MS;
      if (t >= 1 || !p.picture) {
        p.mode = "off";
        p.picture = null;
        repaintScreen(screen, { kind: "off" });
      } else if (now - p.last >= PAINT_MS) {
        p.last = now;
        paintShutdown(screen, p.picture, t);
      }
      return;
    }
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
      if (p.userOff) return;
      p.mode = "boot";
      p.since = now;
      p.last = 0;
      computerAudio.powerOn(BOOT_MS / 1000, p.pressed);
      p.pressed = false;
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
  const wasActive = useRef(false);
  useEffect(() => {
    // A disk coming out while the terminal is on: the record that was showing.
    const ejected = wasActive.current && !active && !nigelIn && online;
    wasActive.current = !!active || nigelIn;
    if (nigelIn) nigelReset();
    // A new page starts at the top.
    terminalScroll.target = terminalScroll.current = 0;
    insertPhase.since = performance.now();
    insertPhase.last = 0;
    insertPhase.ready = false;
    crtTransition.run = null;
    if (online) {
      if (ejected && !reducedMotion) {
        // Back to the menu through a burst of CRT static, from the record on
        // show (the screen has not been repainted yet).
        const to = document.createElement("canvas");
        to.width = SCREEN_W;
        to.height = SCREEN_H;
        terminalScroll.max = paintArchiveScreen(to, {
          kind: "menu",
          active: null,
          projects: archiveProjects,
        });
        crtTransition.run = {
          since: performance.now(),
          last: 0,
          from: copyOf(screen.canvas),
          to,
        };
      } else {
        // The disk is not in the drive yet (or has been ejected): the menu.
        terminalScroll.max = repaintScreen(screen, {
          kind: "menu",
          active: null,
          projects: archiveProjects,
        });
      }
    } else if (power.current.mode === "off") repaintScreen(screen, { kind: "off" });
  }, [screen, online, active, nigelIn, reducedMotion]);
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
    const run = crtTransition.run;
    if (run) {
      if (!online) crtTransition.run = null;
      else {
        const now = performance.now();
        const t = (now - run.since) / TRANSITION_MS;
        if (t < 1) {
          if (now - run.last >= PAINT_MS) {
            run.last = now;
            paintTransition(screen, run.from, run.to, t);
          }
          return;
        }
        crtTransition.run = null;
        terminalScroll.max = repaintScreen(screen, {
          kind: "menu",
          active: null,
          projects: archiveProjects,
        });
      }
    }
    const sinceInsert = performance.now() - insertPhase.since;
    if (online && nigelIn) {
      const now = performance.now();
      const wait = INSERT_SECONDS * 1000;
      if (sinceInsert < wait) return;
      const t = reducedMotion ? 1 : (sinceInsert - wait) / NIGEL_SPLASH_MS;
      if (t < 1) {
        if (now - insertPhase.last > 70) {
          insertPhase.last = now;
          paintOnScreen(screen, (ctx) => paintNigelSplash(ctx, t, now));
        }
        return;
      }
      insertPhase.ready = true;
      nigelStep(dt);
      // Everything the picture depends on: the conversation, the cursor's
      // blink, the mascot's face, the "consulting" dots and the focus.
      const focusedNow = useExperienceStore.getState().screenFocused;
      const talking = nigel.lines.some((l) => l.who === "nigel" && l.shown < l.text.length);
      const key = [
        nigel.version,
        Math.floor(now / 500) % 2,
        nigelFaceAt(now, talking, nigel.thinking),
        nigel.thinking ? Math.floor(now / 300) % 3 : 0,
        focusedNow,
      ].join("|");
      if (key !== nigelPaint.key && now - nigelPaint.last >= PAINT_MS) {
        nigelPaint.last = now;
        nigelPaint.key = key;
        paintOnScreen(screen, (ctx) =>
          paintNigelChat(
            ctx,
            {
              lines: nigel.lines,
              input: nigel.input,
              thinking: nigel.thinking,
              focused: focusedNow,
            },
            now,
          ),
        );
      }
      return;
    }
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
    const moved = terminalScroll.current !== before;
    if (!online || (!playing && !moved)) return;
    // Throttled, except the frame the scroll comes to rest on, so it never
    // stops a step short.
    const now = performance.now();
    const resting = !playing && terminalScroll.current === terminalScroll.target;
    if (now - paintClock.last < PAINT_MS && !resting) return;
    paintClock.last = now;
    terminalScroll.max = repaintScreen(
      screen,
      { kind: "menu", active, projects: archiveProjects, video: playing ? el : undefined },
      terminalScroll.current,
    );
  });
  // Zoomed onto the screen: the wheel, arrows and touch scroll the terminal.
  useEffect(() => {
    storyRig.screenFocus.on = focused;
    if (!focused || focusKind !== "screen" || nigelIn) return;
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
  }, [focused, focusKind, nigelIn]);

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
    // Turned half round in its own plane, as it stands in the rack, so the
    // disk does not spin about its face on the way to the drive.
    const insertQuat = yawQuat(PC_FACING)
      .multiply(FLAT)
      .multiply(new Quaternion().setFromEuler(new Euler(0, 0, Math.PI)));
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
      const row = project.category as RackColumn;
      const rest: DiskPose = rackSlot(row, perRow[row]++);
      return { project, index, rest, insert: { position: insertCentre, quaternion: insertQuat } };
    });
    // Top of the terminal's case, where Wall-E stands.
    const top = new Vector3(PC_MODEL.topSpot.x, PC_MODEL.max.y, PC_MODEL.topSpot.z).applyMatrix4(
      pc.matrix,
    );
    // N.I.G.E.L.'s red disk lies flat on the desk in front of the rack, centred
    // on it and just clear of its front ledge, turned a touch, label up.
    const nigelRest: DiskPose = {
      position: new Vector3(RACK_AT.x, DESK_TOP + DISK_T / 2, RACK_AT.z + DISK * 0.62),
      quaternion: yawQuat(0.08)
        .multiply(FLAT)
        .multiply(new Quaternion().setFromEuler(new Euler(0, 0, Math.PI))),
    };
    const nigelDisk = {
      rest: nigelRest,
      insert: { position: insertCentre, quaternion: insertQuat },
    };
    return { disks, nigelDisk, outward: pc.outward, shadows, matrix: pc.matrix, top };
  }, []);

  /** Click a disk: put it in (taking out the one already there), or take it out. */
  const inDrive = nigelIn ? NIGEL_ID : (active?.id ?? null);
  const toggleDisk = (id: string) => {
    if (inDrive === id) {
      computerAudio.eject(INSERT_SECONDS);
      setActive(null);
      return;
    }
    // Another disk comes out as this one goes in: no screen change to sound.
    if (inDrive) computerAudio.eject(INSERT_SECONDS, { screen: false });
    computerAudio.insert(INSERT_SECONDS, (id === NIGEL_ID ? NIGEL_SPLASH_MS : READ_MS) / 1000);
    setActive(id);
  };

  // N.I.G.E.L.'s keyboard: zoomed onto the screen with its disk in, keys go to
  // a hidden text field (so phones bring up their keyboard too) and from there
  // to the prompt. "EXIT" ejects the disk.
  useEffect(() => {
    if (!nigelIn || !focused || focusKind !== "screen") return;
    const field = document.createElement("input");
    field.type = "text";
    field.maxLength = MAX_INPUT;
    field.autocomplete = "off";
    field.setAttribute("autocapitalize", "characters");
    field.setAttribute("aria-label", "Ask N.I.G.E.L. about the subject");
    Object.assign(field.style, {
      position: "fixed",
      left: "0",
      bottom: "0",
      width: "1px",
      height: "1px",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.appendChild(field);
    field.value = nigel.input;
    field.focus({ preventScroll: true });
    // A tap anywhere puts the focus back (a phone keyboard needs the gesture).
    const refocus = () => field.focus({ preventScroll: true });
    const onInput = () => {
      nigelType(field.value);
      computerAudio.key();
    };
    const onKey = (e: KeyboardEvent) => {
      // Escape still reaches the close-up controls (it zooms back out).
      if (e.key === "Escape") return;
      e.stopPropagation();
      if (insertPhase.ready && nigel.lines.some((l) => l.shown < l.text.length)) nigelSkip();
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (!insertPhase.ready || nigel.thinking) return;
      computerAudio.key();
      const asked = nigel.input.trim().length > 0;
      const result = nigelSubmit();
      field.value = "";
      if (result === "exit") {
        setFocused(false);
        computerAudio.eject(INSERT_SECONDS);
        setActive(null);
      } else if (asked && nigel.thinking) computerAudio.consult(1.6);
    };
    field.addEventListener("input", onInput);
    field.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", refocus);
    return () => {
      field.removeEventListener("input", onInput);
      field.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", refocus);
      field.remove();
    };
  }, [nigelIn, focused, focusKind, setActive, setFocused]);

  return (
    <group name="archive-station" position={STATION_POS} rotation={[0, STATION_YAW, 0]}>
      <Model id="archiveDesk" />
      <StationLights />
      <DesignPosters />
      {/* Centred on the wall, under the posters (whose rows centre on x 0). */}
      <AchievementShelf x={0} />

      <PersonalComputer
        matrix={poses.matrix}
        screen={screen.material}
        onScreenClick={interactive && online && !focused ? zoomToScreen : undefined}
      />
      <group matrix={poses.matrix} matrixAutoUpdate={false}>
        <PowerButton
          at={PC_MODEL.power}
          level={() => (power.current.mode === "on" || power.current.mode === "boot" ? 1 : 0)}
          enabled={() =>
            interactive &&
            power.current.mode !== "shutdown" &&
            !useExperienceStore.getState().screenFocused
          }
          label={() => (power.current.mode === "off" ? "Power on" : "Power off")}
          onPress={togglePower}
        />
      </group>
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
      <DiskRack />
      <WallE at={poses.top} yaw={PC_FACING - 0.5} />
      <DeskProp id="deskLamp" lamp="archive" at={LAMP_AT} yaw={LAMP_YAW}>
        <DeskLampLight lamp="archive" shadowSize={1024} strength={0.6} aim={LAMP_AIM} />
      </DeskProp>

      {poses.disks.map(({ project, index, rest, insert }) => (
        <FloppyDisk
          key={project.id}
          project={project}
          index={index}
          rest={rest}
          insert={insert}
          outward={poses.outward}
          inserted={inDrive === project.id}
          interactive={interactive && online}
          onSelect={() => toggleDisk(project.id)}
        />
      ))}
      <FloppyDisk
        project={NIGEL_DISK}
        index={-1}
        rest={poses.nigelDisk.rest}
        insert={poses.nigelDisk.insert}
        outward={poses.outward}
        inserted={nigelIn}
        interactive={interactive && online}
        onSelect={() => toggleDisk(NIGEL_ID)}
      />
    </group>
  );
}
