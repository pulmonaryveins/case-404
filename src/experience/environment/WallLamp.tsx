import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Mesh, MeshStandardMaterial, type Object3D } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { useExperienceStore } from "../../store/useExperienceStore";
import { useCursor } from "../cursor/cursorStore";
import { LAMP_COLOUR, lampOn, stepLamp, toggleLamp } from "../lighting/lampState";

/** The model's support arm and its switch: left out, only the lamp itself is shown. */
const LEFT_OUT = new Set(["Support_Metal_0", "Switch_Plastic_0"]);

/**
 * The wall light over the board: the lamp's bar alone, in dark metal like the
 * file cabinet, with its
 * underside glowing while it is on, fixed flat against the wall. The model
 * came with a long support arm standing out from the wall; without it the bar
 * would float, so it is mounted directly: the bar's back face is at the wall
 * (the manifest origin puts it there). Its light is a separate soft spot
 * (LampSpot, lamp "wall"), switched by the same lamp state. Click to switch.
 */
export function WallLamp() {
  const asset = assetManifest.wallLamp;
  const { scene } = useGLTF(asset.url);

  const { lamp, metal, strip } = useMemo(() => {
    // Dark gunmetal, the colour the merch file cabinet renders in: a dark
    // body with a little metal for the sheen (with no environment map to
    // reflect, more metal would go black) and a satin finish, so the lamp's
    // own light does not glare on it.
    const metal = new MeshStandardMaterial({ color: "#2b2d2f", metalness: 0.3, roughness: 0.48 });
    let strip: MeshStandardMaterial | null = null;
    const copy = scene.clone(true);
    const drop: Object3D[] = [];
    copy.traverse((o) => {
      if (LEFT_OUT.has(o.name)) drop.push(o);
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const name = (o.material as MeshStandardMaterial).name;
      if (name === "Metal") o.material = metal;
      else if (name === "Emissive") {
        const m = (o.material as MeshStandardMaterial).clone();
        m.color.set("#fff0d6");
        m.emissive.set(LAMP_COLOUR);
        m.emissiveIntensity = 0;
        o.material = m;
        o.castShadow = false;
        strip = m;
      }
    });
    drop.forEach((o) => o.removeFromParent());
    return { lamp: copy, metal, strip: strip as MeshStandardMaterial | null };
  }, [scene]);

  // The strip's material, held in a ref so the frame loop can switch it.
  const glow = useRef<MeshStandardMaterial | null>(null);
  useEffect(() => {
    glow.current = strip;
    return () => {
      glow.current = null;
      metal.dispose();
      strip?.dispose();
    };
  }, [metal, strip]);

  useFrame((_, dt) => {
    const lit = stepLamp("wall", dt);
    if (glow.current) glow.current.emissiveIntensity = 2.4 * lit;
  });

  const enabled = () => !useExperienceStore.getState().screenFocused;
  const label = () => (lampOn.wall ? "Lamp off" : "Lamp on");

  return (
    <primitive
      object={lamp}
      name="wall-lamp"
      position={asset.position}
      rotation={asset.rotation}
      scale={asset.scale}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!enabled()) return;
        e.stopPropagation();
        toggleLamp("wall");
        useCursor.getState().set("switch", label());
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (!enabled()) return;
        e.stopPropagation();
        useCursor.getState().set("switch", label());
      }}
      onPointerOut={() => useCursor.getState().clear()}
    />
  );
}
