import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
} from "three";
import { assetManifest } from "../../assets/assetManifest";

/**
 * A collector's model of the Bismarck: the hull held in two brass cradles on
 * a walnut plinth, with a brass name plate on the plinth's front. In its own
 * frame: the plinth's length along z, its front (the plate) toward +x. Stands
 * in the middle of the achievements shelf, between the certificates (see
 * AchievementShelf), so it is narrow enough for the shelf's 12.5 cm depth.
 */
const PLINTH = { length: 0.46, depth: 0.1, height: 0.02 };
/** A thinner moulded step on top of the plinth. */
const STEP = { length: 0.44, depth: 0.086, height: 0.008 };
/** Cradles, from the plinth's centre along its length. */
const CRADLES = [-0.13, 0.13];
/** Brass post height, plinth top to the cradle's lowest point. */
const POST = 0.018;
/** The cradle's ring: radius to its tube's centre, and the tube's radius. */
const RING = { r: 0.034, tube: 0.003 };

const BRASS = new MeshStandardMaterial({ color: "#a8823f", metalness: 0.6, roughness: 0.38 });
const WALNUT = new MeshStandardMaterial({ color: "#3b2418", metalness: 0, roughness: 0.55 });
const PLINTH_GEO = new BoxGeometry(PLINTH.depth, PLINTH.height, PLINTH.length);
const STEP_GEO = new BoxGeometry(STEP.depth, STEP.height, STEP.length);
const POST_GEO = new CylinderGeometry(0.005, 0.007, POST, 12);
/** Half a ring: the lower half, in the hull's cross-section. */
const RING_GEO = new TorusGeometry(RING.r, RING.tube, 8, 24, Math.PI);

function paintPlate() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 96);
  g.addColorStop(0, "#c9a35a");
  g.addColorStop(0.5, "#a8823f");
  g.addColorStop(1, "#7d5f2a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 96);
  ctx.strokeStyle = "#5c431b";
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 84);
  ctx.fillStyle = "#2a1d0c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = 'bold 40px Georgia, "Times New Roman", serif';
  ctx.fillText("BISMARCK", 256, 40);
  ctx.font = 'italic 20px Georgia, "Times New Roman", serif';
  ctx.fillText("Kriegsmarine · 1940", 256, 72);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function ShipDisplay({
  at,
  yaw,
}: {
  /** The plinth's footprint centre, on the surface it stands on. */
  at: [number, number, number];
  yaw: number;
}) {
  const asset = assetManifest.kmsBismarck;
  const { scene } = useGLTF(asset.url);

  const { ship, offset } = useMemo(() => {
    const ship = scene.clone(true);
    ship.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    // Centre the hull over the plinth with its keel at the origin.
    const box = new Box3().setFromObject(ship);
    const s = asset.scale;
    const offset = new Vector3(
      -((box.min.x + box.max.x) / 2) * s,
      -box.min.y * s,
      -((box.min.z + box.max.z) / 2) * s,
    );
    return { ship, offset };
  }, [scene, asset.scale]);

  const plate = useMemo(() => {
    const map = paintPlate();
    return new MeshStandardMaterial({ map, metalness: 0.5, roughness: 0.4 });
  }, []);
  useEffect(
    () => () => {
      plate.map?.dispose();
      plate.dispose();
    },
    [plate],
  );

  const top = PLINTH.height + STEP.height;
  // The ring's lowest inside point, where the keel rests.
  const keel = top + POST + RING.tube;

  return (
    <group name="ship-display" position={at} rotation={[0, yaw, 0]}>
      <group>
        <mesh
          geometry={PLINTH_GEO}
          material={WALNUT}
          position={[0, PLINTH.height / 2, 0]}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={STEP_GEO}
          material={WALNUT}
          position={[0, PLINTH.height + STEP.height / 2, 0]}
          castShadow
          receiveShadow
        />
        {/* Name plate on the plinth's front edge. */}
        <mesh
          position={[PLINTH.depth / 2 + 0.0006, PLINTH.height / 2, 0]}
          rotation={[0, Math.PI / 2, 0]}
          material={plate}
        >
          <planeGeometry args={[0.11, 0.015]} />
        </mesh>
        {CRADLES.map((z) => (
          <group key={z} position={[0, 0, z]}>
            <mesh
              geometry={POST_GEO}
              material={BRASS}
              position={[0, top + POST / 2, 0]}
              castShadow
            />
            {/* Lower half ring across the hull: in the plinth's x-y plane. */}
            <mesh
              geometry={RING_GEO}
              material={BRASS}
              position={[0, top + POST + RING.r, 0]}
              rotation={[0, 0, Math.PI]}
              castShadow
            />
          </group>
        ))}
        {/* The model's length is its z, as the plinth's. */}
        <group position={[0, keel, 0]}>
          <primitive object={ship} position={offset} scale={asset.scale} />
        </group>
      </group>
    </group>
  );
}
