import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  CanvasTexture,
  LineCurve3,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { assetManifest } from "../../assets/assetManifest";
import { connections, hiddenPieces, movedPieces } from "../../data/evidenceBoard";
import { paintCaseBoard } from "../surfaces/paintCaseBoard";

const STRING_RADIUS = 0.0016;

/**
 * The investigation board with its generic content replaced by CASE 404
 * evidence:
 * - colour atlas repainted once at load (same material, geometry, UVs);
 * - the four original strands hidden;
 * - stray papers and pins hidden, leaving four role clusters;
 * - one master pin (a clone of an existing pin) on the case file's top edge;
 * - one straight red string from it to every other pin on the board, merged into a
 *   single mesh (one extra draw call for all strings).
 */
export function EvidenceBoard() {
  const asset = assetManifest.investigationBoard;
  const { scene } = useGLTF(asset.url);
  const board = useMemo(() => buildBoard(scene), [scene]);

  useLayoutEffect(() => {
    let material: MeshStandardMaterial | undefined;
    scene.traverse((o) => {
      if (!material && o instanceof Mesh) material = o.material as MeshStandardMaterial;
    });
    const original = material?.map;
    if (!material || !original || original.userData.case404) return;

    const texture = new CanvasTexture(paintCaseBoard(original.image as ImageBitmap));
    texture.flipY = original.flipY;
    texture.colorSpace = original.colorSpace;
    texture.anisotropy = 8;
    texture.userData.case404 = true;
    material.map = texture;
    material.needsUpdate = true;
  }, [scene]);

  return (
    <group position={asset.position} rotation={asset.rotation} scale={asset.scale}>
      <primitive object={board} />
    </group>
  );
}

/** Works in the board GLB's own scene space (board face toward +X). */
function buildBoard(source: Object3D) {
  const board = source.clone(true);
  board.updateMatrixWorld(true);

  board.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (o.name.startsWith("BezierCurve") || hiddenPieces.includes(o.name)) o.visible = false;
  });

  // Board face: s = right = -z, t = up = +y, both in the board root's frame.
  for (const { nodes, from, to, lift } of movedPieces) {
    for (const name of nodes) {
      const node = board.getObjectByName(name)!;
      const p = board.worldToLocal(node.getWorldPosition(new Vector3()));
      p.y += to[1] - from[1];
      p.z -= to[0] - from[0];
      p.x += lift;
      node.position.copy(node.parent!.worldToLocal(board.localToWorld(p)));
      node.updateMatrixWorld(true);
    }
  }
  board.updateMatrixWorld(true);

  const { cloneOf, s, t, scale } = connections.masterPin;
  const pin = board.getObjectByName(cloneOf) as Mesh;
  const pinBox = new Box3().setFromObject(pin);
  const pinCenter = pinBox.getCenter(new Vector3());
  const master = new Mesh(pin.geometry, pin.material);
  pin.matrixWorld.decompose(master.position, master.quaternion, master.scale);
  // Move the clone so its centre sits at the hub, scaled about that centre.
  const hub = new Vector3(pinCenter.x, t, -s);
  master.position.sub(pinCenter).multiplyScalar(scale).add(hub);
  master.scale.multiplyScalar(scale);
  master.castShadow = true;
  board.add(master);

  const hubHead = new Vector3(pinCenter.x + (pinBox.max.x - pinCenter.x) * scale * 0.6, t, -s);
  const tubes = connections.targets.map(({ pin: name }) => {
    const box = new Box3().setFromObject(board.getObjectByName(name)!);
    const c = box.getCenter(new Vector3());
    const end = new Vector3(c.x + (box.max.x - c.x) * 0.6, c.y, c.z);
    const curve = new LineCurve3(hubHead, end);
    return new TubeGeometry(curve, 1, STRING_RADIUS, 5, false);
  });
  const strings = new Mesh(
    mergeGeometries(tubes),
    new MeshStandardMaterial({ color: "#8e1c18", roughness: 0.7 }),
  );
  strings.name = "case404-strings";
  board.add(strings);

  return board;
}
