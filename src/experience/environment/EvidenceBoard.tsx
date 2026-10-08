import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  CanvasTexture,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  QuadraticBezierCurve3,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { assetManifest } from "../../assets/assetManifest";
import { connections, hiddenPieces, movedPieces } from "../../data/evidenceBoard";
import { paintCaseBoard } from "../surfaces/paintCaseBoard";

const STRING_RADIUS = 0.0015;

/**
 * Evidence string red. The board's own strands share the single atlas
 * material with the cork and the papers, so a clone of it maps this tube's
 * 0..1 UVs across the whole 4096 atlas and the string renders as muddy grey.
 * The strings get their own untextured matte material instead.
 */
const STRING_COLOR = "#9b2823";

/**
 * The investigation board with its generic content replaced by CASE 404
 * evidence:
 * - colour atlas repainted once at load (same material, geometry, UVs);
 * - the four original strands hidden;
 * - stray papers and pins hidden, leaving four role clusters;
 * - one master pin (a clone of an existing pin) on the case file's top edge;
 * - a red string network (master pin → note cards, plus pin-to-pin links
 *   inside each cluster) merged into a single mesh: one extra draw call for
 *   every strand on the board.
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
    // Preserve the source atlas for dossier photo prints, regardless of mount order.
    texture.userData.originalImage = original.image;
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

  // Where a strand ties off: just under a pin's head, on the viewer side.
  const heads = new Map<string, Vector3>();
  const head = (name: string) => {
    let p = heads.get(name);
    if (!p) {
      const box = new Box3().setFromObject(board.getObjectByName(name)!);
      const c = box.getCenter(new Vector3());
      p = new Vector3(c.x + (box.max.x - c.x) * 0.6, c.y, c.z);
      heads.set(name, p);
    }
    return p;
  };

  /**
   * A strand hangs between two pins: slack proportional to the span, always
   * downward, plus a nudge off the cork so it doesn't z-fight the papers.
   * Nothing bends it sideways or lifts it — the network is routed to avoid
   * the case file (see `connections`), so no strand needs steering, and a
   * string that arcs upward reads as floating rather than pinned.
   */
  const strand = (a: Vector3, b: Vector3) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    // Enough slack to read as hanging string, little enough that the long
    // spokes don't droop into the case file's typed fields on the way past.
    mid.y -= a.distanceTo(b) * 0.035;
    mid.x += STRING_RADIUS * 6;
    return new TubeGeometry(new QuadraticBezierCurve3(a, mid, b), 12, STRING_RADIUS, 5, false);
  };

  const tubes = [
    ...connections.spokes.map(({ pin: name }) => strand(hubHead, head(name))),
    ...connections.links.map(({ from, to }) => strand(head(from), head(to))),
  ];
  const strings = new Mesh(
    mergeGeometries(tubes),
    new MeshStandardMaterial({ color: STRING_COLOR, roughness: 0.92, metalness: 0 }),
  );
  strings.name = "case404-strings";
  strings.castShadow = true;
  strings.receiveShadow = true;
  board.add(strings);

  return board;
}
