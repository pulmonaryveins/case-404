import { type ReactNode, useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { assetManifest, type AssetId } from "../../assets/assetManifest";
import { useExperienceStore } from "../../store/useExperienceStore";
import { DeskLampLight } from "../lighting/DeskLampLight";
import { DeskSmoke } from "./DeskSmoke";
import { DESK_TOP } from "./worldAnchors";

/**
 * Places one desk prop from the manifest, grounded from its real bounds
 * rather than a hand-tuned y: the model is oriented and scaled, measured,
 * then moved so its lowest point rests on DESK_TOP and its footprint centre
 * lands on the manifest x/z. Static — built once, no per-frame work.
 *
 * `children` are parented to the prop in the model's own space (e.g. the
 * lamp's light at its bulb), so they follow wherever the prop is placed.
 */
function DeskProp({ id, children }: { id: AssetId; children?: ReactNode }) {
  const asset = assetManifest[id];
  const { scene } = useGLTF(asset.url);

  const prop = useMemo(() => {
    const placed = new Group();
    placed.add(scene.clone(true));
    const [rx, ry, rz] = asset.rotation;
    placed.rotation.set(rx, ry, rz, "YXZ");
    placed.scale.setScalar(asset.scale);
    placed.updateMatrixWorld(true);

    const box = new Box3().setFromObject(placed);
    const centre = box.getCenter(new Vector3());
    placed.position.set(
      asset.position[0] - centre.x,
      DESK_TOP - box.min.y,
      asset.position[2] - centre.z,
    );

    placed.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = asset.castShadow;
        o.receiveShadow = asset.receiveShadow;
        if (id === "deskLamp") {
          const brighten = (material: MeshStandardMaterial) => {
            if (!material.emissiveMap) return material;
            const owned = material.clone();
            // The atlas masks emission to the bulb, leaving the green shade alone.
            owned.emissiveIntensity = Math.max(material.emissiveIntensity, 3);
            return owned;
          };
          o.material = Array.isArray(o.material)
            ? o.material.map((material) => brighten(material as MeshStandardMaterial))
            : brighten(o.material as MeshStandardMaterial);
        }
      }
    });
    return placed;
  }, [scene, asset, id]);

  useEffect(
    () => () => {
      if (id !== "deskLamp") return;
      prop.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if ((material as MeshStandardMaterial).emissiveMap) material.dispose();
        });
      });
    },
    [prop, id],
  );

  return <primitive object={prop}>{children}</primitive>;
}

const DESK_PROPS: AssetId[] = ["ashtray", "handgun", "plant"];

/**
 * Tip of the cigarette standing in the ashtray, in world space. Measured, not
 * eyeballed: the ashtray model's highest vertices (the standing butt) after
 * the manifest yaw and the same grounding DeskProp applies — x -0.446,
 * y 0.811, z -1.975 at the manifest position. Re-measure if the ashtray moves.
 */
const SMOKE_AT: [number, number, number] = [-0.446, 0.811, -1.975];

/**
 * The working detective's desk around the CASE 404 folder: lamp at the back
 * left with the ashtray in front of it, handgun and plant to the right. The
 * back-right corner is left clear for the vintage telephone, which is
 * reserved until a licensed local model exists.
 */
export function DeskProps() {
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  return (
    <group name="desk-props">
      <DeskProp id="deskLamp">
        <DeskLampLight />
      </DeskProp>
      {DESK_PROPS.map((id) => (
        <DeskProp key={id} id={id} />
      ))}
      {!reducedMotion && <DeskSmoke at={SMOKE_AT} />}
    </group>
  );
}
