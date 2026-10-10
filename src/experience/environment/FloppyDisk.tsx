import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  CanvasTexture,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Group } from "three";
import { assetManifest } from "../../assets/assetManifest";
import type { Project } from "../../data/projects";
import { LABEL_H, LABEL_W, paintDiskLabel } from "../surfaces/paintArchive";

/**
 * Where the paper label sits on the disk's front (+Z) face, in the model's
 * own metres. Measured from an orthographic render of the floppy GLB.
 */
const LABEL = { x: -0.0017, y: -0.0177, w: 0.0612, h: 0.0395, z: 0.00243 };

export interface DiskPose {
  position: Vector3;
  quaternion: Quaternion;
}

interface Props {
  project: Project;
  index: number;
  rest: DiskPose;
  insert: DiskPose;
  /** Unit vector pointing out of the drive slot, toward the viewer. */
  outward: Vector3;
  inserted: boolean;
  interactive: boolean;
  onSelect: () => void;
}

const smooth = (a: number, b: number, t: number) => MathUtils.smoothstep(t, a, b);
const LIFT = 0.09;
const APPROACH = 0.14;
const SECONDS = 1.3;

/**
 * One project on a 3.5in floppy. Disks share the floppy GLB's geometry and
 * materials; only the label differs. `t` runs 0 (resting in the tray) to 1
 * (in the drive): lift out, carry to the slot, slide in.
 */
export function FloppyDisk({
  project,
  index,
  rest,
  insert,
  outward,
  inserted,
  interactive,
  onSelect,
}: Props) {
  const { scene } = useGLTF(assetManifest.floppy.url);
  const body = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o instanceof Mesh) o.castShadow = o.receiveShadow = true;
    });
    return clone;
  }, [scene]);
  const group = useRef<Group>(null);
  const t = useRef(0);
  const hover = useRef(0);
  const hovered = useRef(false);

  const label = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = LABEL_W;
    canvas.height = LABEL_H;
    paintDiskLabel(canvas, project, index);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 8;
    return new MeshStandardMaterial({
      map,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
  }, [project, index]);
  useEffect(
    () => () => {
      label.map?.dispose();
      label.dispose();
    },
    [label],
  );

  const scratch = useMemo(() => ({ a: new Vector3(), b: new Vector3(), c: new Vector3() }), []);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const target = inserted ? 1 : 0;
    t.current +=
      Math.sign(target - t.current) * Math.min(Math.abs(target - t.current), dt / SECONDS);
    const u = t.current;
    const { a, b, c } = scratch;
    // rest -> lifted -> in front of the slot -> in the slot
    a.copy(rest.position).y += LIFT;
    b.copy(insert.position).addScaledVector(outward, APPROACH);
    c.copy(rest.position).lerp(a, smooth(0, 0.3, u));
    c.lerp(b, smooth(0.3, 0.7, u));
    c.lerp(insert.position, smooth(0.7, 1, u));
    hover.current = MathUtils.damp(
      hover.current,
      hovered.current && interactive && u === 0 ? 1 : 0,
      12,
      dt,
    );
    g.position.copy(c);
    g.position.y += hover.current * 0.012;
    g.quaternion.copy(rest.quaternion).slerp(insert.quaternion, smooth(0.2, 0.7, u));
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        hovered.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hovered.current = false;
        document.body.style.cursor = "";
      }}
    >
      <primitive object={body} />
      <mesh position={[LABEL.x, LABEL.y, LABEL.z + 0.0003]} material={label}>
        <planeGeometry args={[LABEL.w, LABEL.h]} />
      </mesh>
    </group>
  );
}
