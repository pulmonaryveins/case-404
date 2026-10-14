import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { BufferAttribute, Mesh, MeshStandardMaterial, type Object3D } from "three";
import { assetManifest } from "../../assets/assetManifest";
import { useExperienceStore } from "../../store/useExperienceStore";
import { useCursor } from "../cursor/cursorStore";
import { LAMP_COLOUR, lampOn, stepLamp, toggleLamp } from "../lighting/lampState";

/** The model's support arm and its switch: left out, only the lamp itself is shown. */
const LEFT_OUT = new Set(["Support_Metal_0", "Switch_Plastic_0"]);

/**
 * Where the board's brown weave (the cork's colour) lies, clean of the baked
 * shadows, in its texture atlas: a strip at u 0.034-0.141, v 0.652-0.681
 * (x 70-290, y 1335-1395 of 2048). Its aspect, 3.7 : 1, is the lamp's bar
 * (370 x 24 units, 15 : 1) stretched along the weave, which runs lengthwise.
 */
const WEAVE = { u: 0.034, du: 0.107, v: 0.652, dv: 0.029 };

/**
 * A copy of the bar's geometry with UVs laid flat on the weave strip: along
 * its length (x) for u, up its height (y) for v. The model has none of its own.
 */
function weaveUVs(source: Mesh["geometry"]) {
  const geometry = source.clone();
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox!;
  const pos = geometry.getAttribute("position");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = (pos.getX(i) - min.x) / (max.x - min.x);
    const y = (pos.getY(i) - min.y) / (max.y - min.y);
    uv[i * 2] = WEAVE.u + x * WEAVE.du;
    uv[i * 2 + 1] = WEAVE.v + (1 - y) * WEAVE.dv;
  }
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
  return geometry;
}

/**
 * The wall light over the board: the lamp's bar alone, textured and shaded
 * with the board's own material (its brown weave, from the board model), with its
 * underside glowing while it is on, fixed flat against the wall. The model
 * came with a long support arm standing out from the wall; without it the bar
 * would float, so it is mounted directly: the bar's back face is at the wall
 * (the manifest origin puts it there). Its light is a separate soft spot
 * (LampSpot, lamp "wall"), switched by the same lamp state. Click to switch.
 */
export function WallLamp() {
  const asset = assetManifest.wallLamp;
  const { scene } = useGLTF(asset.url);
  const { scene: boardScene } = useGLTF(assetManifest.investigationBoard.url);

  const { lamp, metal, strip } = useMemo(() => {
    // The board's own material, cloned: the same texture maps (shared, so
    // no extra texture memory) and the same shading, so the bar reads as cut
    // from the same stuff. The board model itself is not changed.
    let boardMaterial: MeshStandardMaterial | null = null;
    boardScene.traverse((o) => {
      if (!boardMaterial && o instanceof Mesh && (o.material as MeshStandardMaterial).map) {
        boardMaterial = o.material as MeshStandardMaterial;
      }
    });
    const metal = boardMaterial
      ? (boardMaterial as MeshStandardMaterial).clone()
      : new MeshStandardMaterial({ color: "#6b3a22", roughness: 0.55 });
    let strip: MeshStandardMaterial | null = null;
    const copy = scene.clone(true);
    const drop: Object3D[] = [];
    copy.traverse((o) => {
      if (LEFT_OUT.has(o.name)) drop.push(o);
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const name = (o.material as MeshStandardMaterial).name;
      if (name === "Metal") {
        o.material = metal;
        if (metal.map) o.geometry = weaveUVs(o.geometry);
      } else if (name === "Emissive") {
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
  }, [scene, boardScene]);

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
  // The cloned bar geometry is ours; the cached scene's own is left alone.
  useEffect(
    () => () => {
      lamp.traverse((o) => {
        if (o instanceof Mesh && o.material === metal && o.geometry.getAttribute("uv")) {
          o.geometry.dispose();
        }
      });
    },
    [lamp, metal],
  );

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
