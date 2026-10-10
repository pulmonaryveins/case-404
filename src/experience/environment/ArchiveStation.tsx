import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  CanvasTexture,
  Euler,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { archiveProjects, type Project } from "../../data/projects";
import { useExperienceStore } from "../../store/useExperienceStore";
import { Model } from "../models/Model";
import { paintArchiveScreen, SCREEN_H, SCREEN_W } from "../surfaces/paintArchive";
import { ContactShadow } from "./ContactShadow";
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

const PC_POS = new Vector3(-0.3, DESK_TOP, -0.05);
const PC_FACING = 0.1;
const RACK_POS = new Vector3(0.5, DESK_TOP, 0.05);
/**
 * The wooden letter tray is parked for now: with it off, the disks lie flat on
 * the desk where the tray stood. Flip to bring the rack back; the disks follow.
 */
const SHOW_RACK = false;
/** Desk rows (no rack), in the station frame: development in front, UI/UX behind. */
const DESK_ROW_Z = { Development: 0.1, "UI/UX": -0.05 } as const;
const DESK_DISK_SPACING = 0.12;
const RACK_SCALE = assetManifest.fileRack.scale;

/**
 * The rack's top tray floor in the rack's own units (0.3 scale to metres),
 * measured from the mesh. The lower trays sit under it and their front lip
 * hides anything lying behind it, so all disks lie label-up on the top tray:
 * development in the front row, UI/UX behind it, both clear of the lip.
 */
const TOP_TRAY = { y: 0.78, frontZ: 0.324 };
const DISK_X = [-0.35, 0, 0.35];
const DISK_YAW = [0.06, -0.05, 0.03];
const DISK_THICK = 0.0026;
const ROW_Z = { Development: 0.55, "UI/UX": 0.95 } as const;

const FLAT = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0));
const yawQuat = (yaw: number) => new Quaternion().setFromEuler(new Euler(0, yaw, 0));

/** Redraws the CRT canvas and flags its texture for upload. */
function repaintScreen(
  screen: { canvas: HTMLCanvasElement; map: CanvasTexture },
  p: Project | null,
) {
  paintArchiveScreen(screen.canvas, p);
  screen.map.needsUpdate = true;
}

/** The wooden three-tier letter tray the disks sit in. */
function FileRack() {
  const rack = useGLTF(assetManifest.fileRack.url).scene;
  const scene = useMemo(() => {
    const clone = rack.clone(true);
    clone.traverse((o) => {
      if (o instanceof Mesh) o.castShadow = o.receiveShadow = true;
    });
    return clone;
  }, [rack]);
  return (
    <group position={RACK_POS} scale={RACK_SCALE}>
      <primitive object={scene} />
    </group>
  );
}

/** Project of the disk currently in the drive, or null. */
function useActiveProject() {
  const id = useExperienceStore((s) => s.activeProjectId);
  return archiveProjects.find((p) => p.id === id) ?? null;
}

/**
 * The project archive: a 90s PC and a set of floppy disks on a
 * second desk. Selecting a disk slides it into the drive and puts its record
 * on the CRT. Static geometry; only the disks and the screen change.
 */
export function ArchiveStation() {
  const chapter = useExperienceStore((s) => s.currentChapter);
  const setActive = useExperienceStore((s) => s.setActiveProjectId);
  const active = useActiveProject();
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
  useEffect(() => repaintScreen(screen, active), [screen, active]);
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
    // Soft footprints under the case, keyboard and mouse, in the station frame.
    const scale = assetManifest.pc90s.scale;
    const foot = (f: { x: number; z: number; d: number; w: number }, grow: number) => {
      const at = new Vector3(f.x, PC_MODEL.min.y, f.z).applyMatrix4(pc.matrix);
      // The footprint's wide axis is the model's z; blobs run along their local x.
      return {
        at: [at.x, at.z] as [number, number],
        yaw: pc.yaw - Math.PI / 2,
        along: f.w * scale * grow,
        across: f.d * scale * grow,
      };
    };
    const shadows = [
      { ...foot(PC_MODEL.caseFoot, 1.12), opacity: 0.85 },
      { ...foot(PC_MODEL.keyboardFoot, 1.2), opacity: 0.6 },
      { ...foot(PC_MODEL.mouseFoot, 1.5), opacity: 0.5 },
    ];

    const perRow = { Development: 0, "UI/UX": 0 };
    const disks = archiveProjects.map((project, index) => {
      const row = project.category as keyof typeof ROW_Z;
      const slot = perRow[row]++;
      const position = SHOW_RACK
        ? new Vector3(DISK_X[slot], TOP_TRAY.y, TOP_TRAY.frontZ - ROW_Z[row])
            .multiplyScalar(RACK_SCALE)
            .add(RACK_POS)
        : new Vector3(
            RACK_POS.x + (slot - 1) * DESK_DISK_SPACING,
            DESK_TOP,
            RACK_POS.z + DESK_ROW_Z[row],
          );
      position.y += DISK_THICK;
      const rest: DiskPose = {
        position,
        quaternion: yawQuat(DISK_YAW[slot]).multiply(FLAT),
      };
      return { project, index, rest, insert: { position: insertCentre, quaternion: insertQuat } };
    });
    return { disks, outward: pc.outward, glowAt: pc.glowAt, shadows, matrix: pc.matrix };
  }, []);

  return (
    <group name="archive-station" position={STATION_POS} rotation={[0, STATION_YAW, 0]}>
      <Model id="archiveDesk" />

      <PersonalComputer matrix={poses.matrix} screen={screen.material} />
      {poses.shadows.map((shadow, i) => (
        <ContactShadow key={i} {...shadow} map={blob} />
      ))}
      <pointLight
        position={poses.glowAt}
        color="#7dffb0"
        intensity={0.05}
        distance={0.9}
        decay={2}
      />
      {/* Warm fill: the station is far from the desk lamp. No shadows. */}
      <pointLight
        position={[0.1, 1.25, 0.55]}
        color="#ffb877"
        intensity={1.8}
        distance={1.9}
        decay={1}
      />

      {SHOW_RACK && <FileRack />}

      {poses.disks.map(({ project, index, rest, insert }) => (
        <FloppyDisk
          key={project.id}
          project={project}
          index={index}
          rest={rest}
          insert={insert}
          outward={poses.outward}
          inserted={active?.id === project.id}
          interactive={interactive}
          onSelect={() => setActive(active?.id === project.id ? null : project.id)}
        />
      ))}
    </group>
  );
}
