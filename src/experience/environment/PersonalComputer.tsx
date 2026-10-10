import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  type Matrix4,
  Mesh,
  type MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { PC_MODEL } from "./computerPlacement";

const styled = new WeakSet<Object3D>();

/**
 * Sets the 90s PC into this room's light. Runs once per loaded scene.
 * The maps mark parts of the plastic as metal, and with nothing in the room to
 * reflect, metal renders as black smears: this is a plastic computer, so the
 * metal is dropped and the roughness kept. The painted colour is also a touch
 * bright and green for the dim warm light, so it is pulled down and warmed.
 */
function styleComputer(scene: Object3D) {
  if (styled.has(scene)) return;
  styled.add(scene);
  scene.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.castShadow = o.receiveShadow = true;
    const material = o.material as MeshStandardMaterial;
    // The CRT glass is bulged and leans back; the flat overlay replaces it.
    if (material.name === "computer_screen") o.visible = false;
    material.metalness = 0;
    if (material.name === "computer" || material.name === "hard_desk") {
      material.color.set("#ece3cf");
    }
  });
}

interface Props {
  /** Model frame to station frame (see placeComputer). */
  matrix: Matrix4;
  /** What the CRT shows. */
  screen: MeshBasicMaterial;
}

/** The desk computer, with a live canvas laid over its CRT glass. */
export function PersonalComputer({ matrix, screen }: Props) {
  const { scene } = useGLTF(assetManifest.pc90s.url);
  const model = useMemo(() => {
    styleComputer(scene);
    return scene;
  }, [scene]);

  const glass = PC_MODEL.screen;
  // The glass leans back by atan(slope); the overlay sits a hair in front of it along its normal.
  const pitch = Math.atan(glass.slope);
  const lift = 0.004;
  const centreX = glass.faceX + glass.y * glass.slope - Math.cos(pitch) * lift;
  const centreY = glass.y + Math.sin(pitch) * lift;
  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      <primitive object={model} />
      {/* Faces -X and tilts up with the glass (Z applied after Y, hence ZYX). */}
      <mesh
        position={[centreX, centreY, glass.z]}
        rotation={[0, -Math.PI / 2, -pitch, "ZYX"]}
        material={screen}
      >
        <planeGeometry args={[glass.w, glass.h]} />
      </mesh>
    </group>
  );
}
