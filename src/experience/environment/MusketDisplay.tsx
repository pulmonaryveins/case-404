import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { CylinderGeometry, type Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { useExperienceStore } from "../../store/useExperienceStore";
import { useFocusable } from "../camera/focus";

/** The back wall's face (see RoomShell). */
const WALL_Z = -3.8;

/**
 * An old musket hung on the back wall just above the evidence board (whose
 * top is at ~2.14 m; the musket spans ~2.17-2.35 m, inside the opening shot) as
 * a display piece, lying level on two brass wall pegs, facing left: muzzle to
 * the left, butt to the right.
 *
 * The model (oldMusket) is 2 units long, centred on its origin, with its butt
 * at -x and muzzle at +x, but UP at +z and its sides at +-y. It is stood up
 * (a quarter turn about x) and turned to point left (a half turn about y);
 * the rotation's order is Y then X, so the half turn comes last. At 0.75 it is
 * a 1.5 m musket. `AT` is where its origin goes; it is centred on the board.
 */
const AT = { x: 0, y: 2.26, z: WALL_Z + 0.06 };
/**
 * The pegs, under the barrel and under the stock before the lock, at the
 * model's x (along the musket) and the underside's height there (its z).
 */
const PEGS = [
  { along: 0.42, under: 0.022 },
  { along: -0.28, under: 0.031 },
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

export function MusketDisplay() {
  const asset = assetManifest.oldMusket;
  const { scene } = useGLTF(asset.url);
  const { musket, owned } = useMemo(() => {
    const owned: MeshStandardMaterial[] = [];
    const copy = scene.clone(true);
    copy.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      // One material for wood and iron, its metalness from the map: fully
      // metallic iron shows only what it reflects, and the room has no
      // environment map, so it went black. Half metal keeps the iron lit; a
      // little lift for the wood, which read dark up there.
      const own = (o.material as MeshStandardMaterial).clone();
      own.metalness = 0.5;
      own.color.multiplyScalar(1.3);
      o.material = own;
      owned.push(own);
    });
    return { musket: copy, owned };
  }, [scene]);
  useEffect(() => () => owned.forEach((m) => m.dispose()), [owned]);

  // Click to look closer: square-on from the room, the musket filling the width.
  const display = useRef<Group>(null);
  const inspect = useFocusable(inspectable, {
    view: "front",
    target: () => display.current,
    front: TO_ROOM,
    label: "Inspect musket",
    fill: 1.15,
  });

  const s = asset.scale;
  return (
    <group name="musket-display" ref={display} {...inspect}>
      {/* Stood up (x quarter turn) and turned to point left (y half turn). */}
      <primitive
        object={musket}
        position={[AT.x, AT.y, AT.z]}
        rotation={[-Math.PI / 2, Math.PI, 0, "YXZ"]}
        scale={s}
      />
      {PEGS.map(({ along, under }) => {
        // Under the musket: its x runs along world -x after the half turn.
        const x = AT.x - along * s;
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
