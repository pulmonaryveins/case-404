import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  CanvasTexture,
  Euler,
  MeshBasicMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { archiveProjects } from "../../data/projects";
import { useExperienceStore } from "../../store/useExperienceStore";
import { Model } from "../models/Model";
import { paintArchiveScreen, SCREEN_H, SCREEN_W, type ScreenView } from "../surfaces/paintArchive";
import { ContactShadow } from "./ContactShadow";
import { stackPop, stackSlot, type StackRow } from "./diskStacks";
import { DesignPosters } from "./DesignPosters";
import { DeskProp } from "./DeskProps";
import { DeskLampLight } from "../lighting/DeskLampLight";
import { FloppyDisk, type DiskPose } from "./FloppyDisk";
import { PersonalComputer } from "./PersonalComputer";
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
const FLAT = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));
const yawQuat = (yaw: number) => new Quaternion().setFromEuler(new Euler(0, yaw, 0));

/** Redraws the CRT canvas and flags its texture for upload. */
function repaintScreen(
  screen: { canvas: HTMLCanvasElement; map: CanvasTexture },
  view: ScreenView,
) {
  paintArchiveScreen(screen.canvas, view);
  screen.map.needsUpdate = true;
}

/** Seconds of boot sequence after the camera reaches the archive desk. */
const BOOT_MS = 4200;

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

  const blob = useBlobTexture();
  // CRT contents, repainted whenever the inserted disk changes.
  const screen = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 8;
    const material = new MeshBasicMaterial({ map, toneMapped: false, color: "#d8d8d8" });
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
    if (online) repaintScreen(screen, { kind: "menu", active, projects: archiveProjects });
    else if (power.current.mode === "off") repaintScreen(screen, { kind: "off" });
  }, [screen, online, active]);
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

    const perRow = { Development: 0, "UI/UX": 0 };
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
      <DesignPosters />

      <PersonalComputer matrix={poses.matrix} screen={screen.material} />
      {poses.shadows.map((shadow, i) => (
        <ContactShadow key={i} {...shadow} map={blob} />
      ))}
      {/* The same banker's lamp as the working desk, at the right end, turned to
          shine back across the terminal. Lit only while the camera is here. */}
      <DeskProp id="deskLamp" lamp="archive" at={LAMP_AT} yaw={LAMP_YAW}>
        <DeskLampLight lamp="archive" shadowSize={1024} strength={0.4} />
      </DeskProp>

      {poses.disks.map(({ project, index, rest, insert }) => (
        <FloppyDisk
          key={project.id}
          project={project}
          index={index}
          rest={rest}
          insert={insert}
          outward={poses.outward}
          pop={stackPop(project.category as StackRow)}
          inserted={active?.id === project.id}
          interactive={interactive && online}
          onSelect={() => setActive(active?.id === project.id ? null : project.id)}
        />
      ))}
    </group>
  );
}
