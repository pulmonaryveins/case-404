import { type ReactNode, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, NearestFilter, Group, Matrix4, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { assetManifest, type AssetId } from "../../assets/assetManifest";
import { useExperienceStore } from "../../store/useExperienceStore";
import { DeskLampLight } from "../lighting/DeskLampLight";
import { DeskSmoke } from "./DeskSmoke";
import { ContactShadow } from "./ContactShadow";
import { useBlobTexture } from "./useBlobTexture";
import { DESK_TOP } from "./worldAnchors";

const CHAMBERED_BULLET = /^Bullet\d+_/;

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
        // The revolver's chambered rounds sit inside a closed cylinder.
        if (id === "revolver" && CHAMBERED_BULLET.test(o.name)) o.visible = false;
        // The pens model ships on a flat display plate; the desk is the ground.
        if (id === "fountainPens" && o.name.startsWith("ground")) o.visible = false;
        // The creeper is a 64x32 pixel texture: sample it unfiltered up close.
        if (id === "creeper") {
          const mat = o.material as MeshStandardMaterial;
          if (mat.map) {
            mat.map.magFilter = NearestFilter;
            mat.map.needsUpdate = true;
          }
        }
        // The pull-chain hangs beside the bulb, so its shadow would be thrown as a
        // huge beaded stripe across the wall. It is its own mesh in the lamp model
        // (scripts/split-lamp-chain.mjs) so it can be left out of the shadow pass.
        if (id === "deskLamp" && o.name.includes("chain")) o.castShadow = false;
        if (id === "deskLamp") {
          const brighten = (material: MeshStandardMaterial) => {
            if (!material.emissiveMap) return material;
            const owned = material.clone();
            // The atlas masks emission to the bulb, leaving the green shade alone.
            owned.emissiveIntensity = Math.max(material.emissiveIntensity, 6);
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

// `fountainPens` is parked: its model and manifest entry stay, it is just not
// placed on the desk for now.
const DESK_PROPS: AssetId[] = [
  "ashtray",
  "revolver",
  "plant",
  "aluminiumPen",
  "creeper",
  "roblox",
  "magnifier",
  "phone",
  "fedora",
  "sheriffBadge",
];

/** Cartridge length on the desk: a real 40 mm .357 round, in proportion to the 25 cm revolver. */
const BULLET_LENGTH = 0.04;
const BULLET_TEMPLATE = "bullet_mesh_03";
/** x, z, yaw, standing: three rounds just behind the revolver (toward the back of the desk). */
const BULLETS: [number, number, number, boolean][] = [
  [-0.47, -2.07, 0.5, false],
  [-0.43, -2.11, -0.4, false],
  [-0.5, -2.13, 0, true],
];

/** Three .357 rounds from the bullets model, scattered behind the revolver. */
function MagnumBullets() {
  const { scene } = useGLTF(assetManifest.magnumBullets.url);
  const blob = useBlobTexture();
  const rounds = useMemo(() => {
    let template: Mesh | undefined;
    scene.traverse((o) => {
      if (!template && o instanceof Mesh && o.name.startsWith(BULLET_TEMPLATE)) template = o;
    });
    if (!template) return [];
    scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(template);
    const centre = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const scale = BULLET_LENGTH / size.y;
    // Centre the round on its own origin; the model is authored standing up.
    const toOrigin = new Matrix4()
      .makeTranslation(-centre.x, -centre.y, -centre.z)
      .multiply(template.matrixWorld);
    return BULLETS.map(([x, z, yaw, standing]) => {
      const round = new Group();
      round.rotation.set(0, yaw, standing ? 0 : Math.PI / 2, "YXZ");
      round.scale.setScalar(scale);
      const radius = (size.x / 2) * scale;
      round.position.set(x, DESK_TOP + (standing ? BULLET_LENGTH / 2 : radius), z);
      const mesh = new Mesh(template!.geometry, template!.material);
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(toOrigin);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      round.add(mesh);
      return { round, x, z, yaw, standing };
    });
  }, [scene]);
  return (
    <group name="magnum-bullets">
      {rounds.map(({ round, x, z, yaw, standing }, i) => (
        <group key={i}>
          <primitive object={round} />
          <ContactShadow
            at={[x, z]}
            yaw={yaw}
            along={standing ? 0.03 : 0.07}
            across={0.03}
            opacity={0.7}
            map={blob}
          />
        </group>
      ))}
    </group>
  );
}

/** A soft footprint under the revolver, which lies along its yawed barrel axis. */
function RevolverShadow() {
  const blob = useBlobTexture();
  const asset = assetManifest.revolver;
  return (
    <ContactShadow
      at={[asset.position[0], asset.position[2]]}
      yaw={asset.rotation[1] + Math.PI / 2}
      along={0.34}
      across={0.14}
      opacity={0.75}
      map={blob}
    />
  );
}

/**
 * Tip of the cigarette standing in the ashtray, in world space. Measured, not
 * eyeballed: the ashtray model's highest vertices (the standing butt) after
 * the manifest yaw and the same grounding DeskProp applies — x -0.446,
 * y 0.811, z -2.255 at the manifest position (-0.32, -2.26). Re-measure if the ashtray moves.
 */
const SMOKE_AT: [number, number, number] = [-0.266, 0.811, -2.255];

/**
 * The working detective's desk around the CASE 404 folder: lamp at the back
 * left with the ashtray at its front-right, the Colt Python revolver with three
 * loose .357 rounds on the left pad, an aluminium pen by the folder's right
 * edge, the black push-button telephone on the right pad, and the creeper
 * figure beside the plant.
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
      <MagnumBullets />
      <RevolverShadow />
      {!reducedMotion && <DeskSmoke at={SMOKE_AT} />}
    </group>
  );
}
