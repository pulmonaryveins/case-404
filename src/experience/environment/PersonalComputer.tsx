import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import {
  type Matrix4,
  Mesh,
  type MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { PC_MODEL } from "./computerPlacement";
import { useCursor } from "../cursor/cursorStore";

const styled = new WeakSet<Object3D>();

/**
 * Sets the terminal into this room's light. Runs once per loaded scene.
 * Its maps mark a few parts as metal; with nothing in the room to reflect,
 * metal renders as black smears, and this is a plastic terminal, so the metal
 * is dropped and the roughness kept.
 */
function styleComputer(scene: Object3D) {
  if (styled.has(scene)) return;
  styled.add(scene);
  scene.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    // No cast shadow: lit by the low moon from the left, the terminal's shadow
    // landed high on the angled wall behind it as a hard-edged polygon. The
    // soft contact shadow under it (ArchiveStation) grounds it on the desk.
    o.castShadow = false;
    o.receiveShadow = true;
    const material = o.material as MeshStandardMaterial;
    material.metalness = 0;
    // The beige rim is bright for a dim room; pull it down a little.
    material.color.set("#cfc7b6");
  });
}

interface Props {
  /** Model frame to station frame (see placeComputer). */
  matrix: Matrix4;
  /** What the CRT shows. */
  screen: MeshBasicMaterial;
  /** The CRT was clicked; undefined while it is not clickable. */
  onScreenClick?: (e: ThreeEvent<MouseEvent>) => void;
}

/**
 * The archive computer: a 1970s terminal, with a live canvas laid over its
 * CRT and a dark slot drawn on its front panel where the floppy disks go in.
 */
export function PersonalComputer({ matrix, screen, onScreenClick }: Props) {
  const { scene } = useGLTF(assetManifest.archiveComputer.url);
  const model = useMemo(() => {
    styleComputer(scene);
    return scene;
  }, [scene]);

  const { screen: glass, door, slot } = PC_MODEL;
  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      <primitive object={model} />
      <mesh
        position={[glass.x, glass.y, glass.z]}
        material={screen}
        onClick={onScreenClick}
        onPointerOver={() => {
          if (onScreenClick) useCursor.getState().set("inspect", "Use terminal");
        }}
        onPointerOut={() => useCursor.getState().clear()}
      >
        <planeGeometry args={[glass.w, glass.h]} />
      </mesh>
      {/* The panel has no opening of its own: a dark slot, so disks can go in. */}
      <mesh position={[door.x, slot.y, door.frontZ + 0.0008]}>
        <planeGeometry args={[slot.w, slot.h]} />
        <meshStandardMaterial color="#030303" roughness={0.9} />
      </mesh>
    </group>
  );
}
