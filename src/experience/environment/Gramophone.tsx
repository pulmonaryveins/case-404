import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Group, Mesh, type MeshStandardMaterial, Vector3 } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { useExperienceStore } from "../../store/useExperienceStore";
import { gramophone } from "../audio/gramophoneAudio";
import { useCursor } from "../cursor/cursorStore";

/**
 * A wind-up gramophone on top of a merch file cabinet. Click it to put the
 * needle on the record and play "Cool Vibes", and again to lift it: the
 * record spins up and winds down with the music (see gramophoneAudio).
 *
 * The model (gramophone) stands on feet at y -12.3, its front (the horn's
 * mouth and the maker's plate) toward -z, 168 units tall: a 0.6 m gramophone
 * on a 29 cm case (so the merch shot has it whole, horn and all). The record and the turntable under it are spun
 * together about the record pin.
 */
const SPINNING = ["Vinyl_Lowpoly__0", "RecordPlate_Lowpoly__0"];
const FEET = 12.26;
/** Full speed: 33 rpm. */
const SPIN = (33 / 60) * Math.PI * 2;

const at = new Vector3();

export function Gramophone({
  position,
  yaw,
}: {
  /** Where its feet stand, world space. */
  position: [number, number, number];
  /** Turn about the vertical; 0 faces its front (-z) away from +z. */
  yaw: number;
}) {
  const asset = assetManifest.gramophone;
  const { scene } = useGLTF(asset.url);

  // The record and turntable regrouped under a pivot at their centre, so they
  // turn about the pin; the cached scene is cloned, not changed.
  const { model, pivot, owned } = useMemo(() => {
    const model = scene.clone(true);
    model.updateMatrixWorld(true);
    const spinning: Mesh[] = [];
    // One material, fully metallic by its factor: with no environment map to
    // reflect, the brass horn rendered black. Half metal keeps it lit.
    const owned = (
      (scene.getObjectByProperty("type", "Mesh") as Mesh | undefined)?.material as
        MeshStandardMaterial | undefined
    )?.clone();
    if (owned) owned.metalness = 0.5;
    model.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      if (owned) o.material = owned;
      if (SPINNING.includes(o.name)) spinning.push(o);
    });
    const pivot = new Group();
    if (spinning.length) {
      const box = new Box3();
      spinning.forEach((m) => box.expandByObject(m));
      box.getCenter(pivot.position);
      model.add(pivot);
      pivot.updateMatrixWorld(true);
      spinning.forEach((m) => pivot.attach(m));
    }
    return { model, pivot, owned };
  }, [scene]);
  useEffect(() => () => owned?.dispose(), [owned]);

  // The pivot, held in a ref so the frame loop can turn it.
  const turntable = useRef<Group | null>(null);
  useEffect(() => {
    turntable.current = pivot;
  }, [pivot]);

  const group = useRef<Group>(null);
  useFrame(({ camera }, dt) => {
    // The record turns with the music: winding up, playing, winding down.
    if (turntable.current) turntable.current.rotation.y -= SPIN * gramophone.speed * dt;
    // Where it sounds from: how far, and which side of the view.
    if (!group.current) return;
    group.current.getWorldPosition(at);
    const distance = at.distanceTo(camera.position);
    const side = at.project(camera).x;
    gramophone.place(dt, distance, side);
  });

  const enabled = () => !useExperienceStore.getState().screenFocused;
  const label = () => (gramophone.on ? "Stop the record" : "Play a record");
  const handlers = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (!enabled()) return;
      e.stopPropagation();
      gramophone.toggle();
      useCursor.getState().set("switch", label());
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (!enabled()) return;
      e.stopPropagation();
      useCursor.getState().set("switch", label());
    },
    onPointerOut: () => useCursor.getState().clear(),
  };

  return (
    <group ref={group} name="gramophone" position={position} rotation={[0, yaw, 0]} {...handlers}>
      <primitive object={model} position={[0, FEET * asset.scale, 0]} scale={asset.scale} />
    </group>
  );
}
