import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { CylinderGeometry, type Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { useExperienceStore } from "../../store/useExperienceStore";
import { useFocusable } from "../camera/focus";

/** The back wall's face (see RoomShell). */
const WALL_Z = -3.8;

/**
 * An M1 Garand hung on the back wall just above the evidence board (whose top
 * is at ~2.14 m; the rifle spans ~2.17-2.37 m, inside the opening shot) as a
 * display piece, lying level on two brass wall pegs, facing
 * left: muzzle to the left, its left side to the room.
 *
 * The model (m1Garand) is 853 units long: muzzle at -z, butt at +z, up +y,
 * its right side at +x. At 0.0013 it is a real 1.1 m rifle. `AT` is where the
 * model's origin goes; the rifle is centred on the board (x 0).
 */
const AT = { x: -0.038, y: 2.26, z: WALL_Z + 0.07 };
/**
 * The pegs, under the handguard and under the stock just behind the wrist,
 * at the model's z (along the rifle) and the underside's height there.
 */
const PEGS = [
  { along: -175, under: 41.5 },
  { along: 240, under: -10 },
];
const PEG_R = 0.007;
/** From the wall out past the rifle's middle, with a turned-up tip. */
const PEG_LENGTH = 0.115;

/** It can be inspected while the board is in view: the opening shot and the board chapter. */
const inspectable = () => {
  const chapter = useExperienceStore.getState().currentChapter;
  return chapter === "CASE_OPENED" || chapter === "EVIDENCE_BOARD";
};
const TO_ROOM = new Vector3(0, 0, 1);

const BRASS = new MeshStandardMaterial({ color: "#a8823f", metalness: 0.6, roughness: 0.38 });
const ROD = new CylinderGeometry(PEG_R, PEG_R, PEG_LENGTH, 12);
const TIP = new CylinderGeometry(PEG_R * 0.9, PEG_R, 0.02, 12);
const ROSE = new CylinderGeometry(0.012, 0.013, 0.005, 20);

export function RifleDisplay() {
  const asset = assetManifest.m1Garand;
  const { scene } = useGLTF(asset.url);
  const { rifle, owned } = useMemo(() => {
    const owned: MeshStandardMaterial[] = [];
    const copy = scene.clone(true);
    copy.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      // Fully metallic steel shows only what it reflects, and the room has no
      // environment map: it went black. Half metal keeps the blued look lit.
      // The walnut stock read near black up there: lifted a little.
      const m = o.material as MeshStandardMaterial;
      const own = m.clone();
      if (m.metalness > 0.5) own.metalness = 0.45;
      else own.color.multiplyScalar(1.45);
      o.material = own;
      owned.push(own);
    });
    return { rifle: copy, owned };
  }, [scene]);
  useEffect(() => () => owned.forEach((m) => m.dispose()), [owned]);

  // Click to look closer: square-on from the room, the rifle filling the width.
  const display = useRef<Group>(null);
  const inspect = useFocusable(inspectable, {
    view: "front",
    target: () => display.current,
    front: TO_ROOM,
    label: "Inspect rifle",
    fill: 1.15,
  });

  const s = asset.scale;
  return (
    <group name="rifle-display" ref={display} {...inspect}>
      {/* A quarter turn: the rifle's length (z) along the wall, muzzle (-z)
          to the left, its left side (-x) facing the room. */}
      <primitive
        object={rifle}
        position={[AT.x, AT.y, AT.z]}
        rotation={[0, Math.PI / 2, 0]}
        scale={s}
      />
      {PEGS.map(({ along, under }) => {
        // Under the rifle: its z runs along world +x after the turn.
        const x = AT.x + along * s;
        const y = AT.y + under * s - PEG_R;
        return (
          <group key={along} position={[x, y, WALL_Z]}>
            {/* Round plate on the wall. */}
            <mesh
              geometry={ROSE}
              material={BRASS}
              position={[0, 0, 0.003]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            />
            <mesh
              geometry={ROD}
              material={BRASS}
              position={[0, 0, PEG_LENGTH / 2]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            />
            <mesh geometry={TIP} material={BRASS} position={[0, 0.01, PEG_LENGTH]} castShadow />
          </group>
        );
      })}
    </group>
  );
}
