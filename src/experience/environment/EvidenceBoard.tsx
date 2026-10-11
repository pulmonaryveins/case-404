import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  CanvasTexture,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  QuadraticBezierCurve3,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { assetManifest, type AssetId } from "../../assets/assetManifest";
import {
  caseFile,
  connections,
  hiddenPieces,
  roleClusters,
  type BoardPoster,
  type PosterShape,
} from "../../data/evidenceBoard";
import { paintCaseBoard, paintCaseFileImage, paintEvidenceImage } from "../surfaces/paintCaseBoard";

/**
 * The painted board material, one per loaded model. Kept here, in the module,
 * and not on the cached model: the model's own texture is never changed, so
 * the board is always painted from the pristine atlas, and a reload or a hot
 * reload (which makes a fresh module, and so a fresh cache) repaints it.
 */
const paintedBoards = new WeakMap<Object3D, MeshStandardMaterial>();

const STRING_RADIUS = 0.0015;

/**
 * Evidence string red. The board's own strands share the single atlas
 * material with the cork and the papers, so a clone of it maps this tube's
 * 0..1 UVs across the whole 4096 atlas and the string renders as muddy grey.
 * The strings get their own untextured matte material instead.
 */
const STRING_COLOR = "#9b2823";

/**
 * The poster models (the ones on the graphic-design wall), as hung on the
 * board: the scale that brings them to board size (about 0.33 x 0.21 m
 * landscape, 0.20 x 0.29 portrait, 0.23 x 0.23 square, so a cluster fills a
 * corner with a little air between its posters), their half-height and how
 * far their (curled) paper bulges toward the viewer, both after scaling, and
 * the canvas size of the sample image painted on each.
 */
const POSTER: Record<
  PosterShape,
  { id: AssetId; scale: number; half: number; bulge: number; px: [number, number] }
> = {
  landscape: {
    id: "posterLandscape",
    scale: 0.58,
    half: 0.18 * 0.58,
    bulge: 0.024 * 0.58,
    px: [640, 408],
  },
  portrait: { id: "posterPortrait", scale: 0.46, half: 0.31 * 0.46, bulge: 0, px: [432, 608] },
  square: {
    id: "posterSquare",
    scale: 0.64,
    half: 0.18 * 0.64,
    bulge: 0.057 * 0.64,
    px: [480, 480],
  },
};
/** Gap of the first poster off the map, and the extra lift of each later one in its cluster. */
const POSTER_OFF = 0.014;
const POSTER_STEP = 0.012;
/** How far down from a poster's top edge its pin sits (m). */
const PIN_DROP = 0.022;

/**
 * The investigation board with its generic content replaced by CASE 404
 * evidence:
 * - colour atlas repainted once at load (same material, geometry, UVs);
 * - the board's baked photographs, loose strands and spare pins hidden;
 * - a role card at each corner of the map, the case file at its centre;
 * - twelve 3D posters (a landscape, a portrait and a square round each role
 *   card), hung from the board's own pins, with sample images painted per
 *   role;
 * - four extra pins (clones of an existing one): a hub above and a hub below
 *   the case file, and one on its top edge and one on its bottom edge;
 * - a red string network (hubs → case file and role cards → each card's
 *   posters) merged into a single mesh: one extra draw call for every strand.
 */
export function EvidenceBoard() {
  const asset = assetManifest.investigationBoard;
  const { scene } = useGLTF(asset.url);
  const { board, faceX } = useMemo(() => buildBoard(scene), [scene]);

  return (
    <group position={asset.position} rotation={asset.rotation} scale={asset.scale}>
      <primitive object={board} />
      <CasePosterModel faceX={faceX} />
      {roleClusters.map((cluster) =>
        cluster.posters.map((poster, i) => (
          <BoardPosterModel key={poster.pin} poster={poster} order={i} faceX={faceX} />
        )),
      )}
    </group>
  );
}

/**
 * One poster on the board: the wall poster's model with a painted image for
 * its picture, in the board GLB's own frame (face toward +X; s = right = -z,
 * t = up = +y): a quarter turn from the poster's own (+Z) front, then its tilt
 * about its own normal.
 */
function PosterModel({
  shape,
  canvas,
  s,
  t,
  roll,
  lift,
  scale,
}: {
  shape: PosterShape;
  canvas: HTMLCanvasElement;
  s: number;
  t: number;
  roll: number;
  /** Distance of the poster's back from the board's face. */
  lift: number;
  scale: number;
}) {
  const spec = POSTER[shape];
  const { scene } = useGLTF(assetManifest[spec.id].url);

  const { object, texture, materials } = useMemo(() => {
    const texture = new CanvasTexture(canvas);
    // The poster models' UVs run bottom-up (v grows with height), unlike the
    // top-down glTF convention their own textures were baked for, so the
    // painted image is flipped on upload to stand upright.
    texture.flipY = true;
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    const materials: MeshStandardMaterial[] = [];
    const copy = scene.clone(true);
    copy.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const m = (o.material as MeshStandardMaterial).clone();
      m.map = texture;
      m.roughness = 0.9;
      m.metalness = 0;
      o.material = m;
      o.castShadow = true;
      o.receiveShadow = true;
      materials.push(m);
    });
    return { object: copy, texture, materials };
  }, [scene, canvas]);

  useEffect(
    () => () => {
      texture.dispose();
      materials.forEach((m) => m.dispose());
    },
    [texture, materials],
  );

  return (
    <group position={[lift, t, -s]} rotation={[0, Math.PI / 2, 0]}>
      <group rotation={[0, 0, roll]} scale={scale}>
        <primitive object={object} />
      </group>
    </group>
  );
}

/** One of the role clusters' posters, with the sample image for its role. */
function BoardPosterModel({
  poster,
  order,
  faceX,
}: {
  poster: BoardPoster;
  order: number;
  faceX: number;
}) {
  const spec = POSTER[poster.shape];
  const canvas = useMemo(() => {
    const seed = 300 + order * 17 + Math.round(poster.s * 100);
    return paintEvidenceImage(poster.kind, spec.px[0], spec.px[1], seed);
  }, [poster, order, spec]);
  return (
    <PosterModel
      shape={poster.shape}
      canvas={canvas}
      s={poster.s}
      t={poster.t}
      roll={poster.roll}
      lift={faceX + POSTER_OFF + order * POSTER_STEP}
      scale={spec.scale}
    />
  );
}

/** The CASE 404 file: a square poster at the centre of the board. */
function CasePosterModel({ faceX }: { faceX: number }) {
  const { s, t, roll, scale } = caseFile.poster;
  const canvas = useMemo(() => paintCaseFileImage(768), []);
  return (
    <PosterModel
      shape="square"
      canvas={canvas}
      s={s}
      t={t}
      roll={roll}
      lift={faceX + POSTER_OFF}
      scale={scale}
    />
  );
}

/** Works in the board GLB's own scene space (board face toward +X). */
function buildBoard(source: Object3D) {
  const board = source.clone(true);
  board.updateMatrixWorld(true);

  // Paint the atlas into a material of this board's own (the model's stays
  // untouched). The source is the original atlas, kept by an earlier version
  // that painted the model in place if there is one.
  let atlas: MeshStandardMaterial | undefined;
  board.traverse((o) => {
    if (!atlas && o instanceof Mesh) atlas = o.material as MeshStandardMaterial;
  });
  if (atlas?.map) {
    let painted = paintedBoards.get(source);
    if (!painted) {
      const base = atlas.map;
      const image = (base.userData.originalImage ?? base.image) as ImageBitmap;
      const texture = new CanvasTexture(paintCaseBoard(image));
      texture.flipY = base.flipY;
      texture.colorSpace = base.colorSpace;
      texture.anisotropy = 8;
      painted = atlas.clone();
      painted.map = texture;
      paintedBoards.set(source, painted);
    }
    const original = atlas;
    board.traverse((o) => {
      if (o instanceof Mesh && o.material === original) o.material = painted;
    });
  }

  board.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.castShadow = true;
    o.receiveShadow = true;
    if (o.name.startsWith("BezierCurve") || hiddenPieces.includes(o.name)) o.visible = false;
  });

  // The map's surface: where the papers lay and the posters now hang from.
  const faceX = new Box3().setFromObject(board.getObjectByName("Plane058__0")!).max.x;

  /** Moves a node so its bounding-box centre lands at board-face (s, t) and depth x. */
  const moveCentreTo = (node: Object3D, s: number, t: number, x: number, reference?: Object3D) => {
    const box = new Box3().setFromObject(reference ?? node);
    const c = box.getCenter(new Vector3());
    const p = board.worldToLocal(node.getWorldPosition(new Vector3()));
    p.x += x - c.x;
    p.y += t - c.y;
    p.z += -s - c.z;
    node.position.copy(node.parent!.worldToLocal(board.localToWorld(p)));
    node.updateMatrixWorld(true);
  };

  // Role cards, one at each corner of the map, each with its own pin carried
  // along with it.
  for (const { card } of roleClusters) {
    const paper = board.getObjectByName(card.piece)!;
    const pin = board.getObjectByName(card.pin)!;
    const before = new Box3().setFromObject(paper).getCenter(new Vector3());
    const x = faceX + 0.012;
    moveCentreTo(paper, card.s, card.t, x);
    const after = new Box3().setFromObject(paper).getCenter(new Vector3());
    // The pin keeps its place on the paper: shift it by the paper's own move.
    const pp = board.worldToLocal(pin.getWorldPosition(new Vector3())).add(after).sub(before);
    pin.position.copy(pin.parent!.worldToLocal(board.localToWorld(pp)));
    pin.updateMatrixWorld(true);
  }

  // Each poster's pin: at the top of the poster, just in front of it.
  roleClusters.forEach(({ posters }) => {
    posters.forEach((poster, order) => {
      const spec = POSTER[poster.shape];
      const up = spec.half - PIN_DROP;
      const s = poster.s - up * Math.sin(poster.roll);
      const t = poster.t + up * Math.cos(poster.roll);
      const x = faceX + POSTER_OFF + order * POSTER_STEP + spec.bulge + 0.012;
      moveCentreTo(board.getObjectByName(poster.pin)!, s, t, x);
    });
  });
  board.updateMatrixWorld(true);

  // The extra pins are clones of one existing pin, scaled up a little, set at
  // a board-face (s, t) and depth x. Each returns where its strings tie off.
  const pinSource = board.getObjectByName(connections.cloneOf) as Mesh;
  const sourceBox = new Box3().setFromObject(pinSource);
  const sourceCentre = sourceBox.getCenter(new Vector3());
  const addPin = (s: number, t: number, x: number) => {
    const k = connections.scale;
    const pin = new Mesh(pinSource.geometry, pinSource.material);
    pinSource.matrixWorld.decompose(pin.position, pin.quaternion, pin.scale);
    // Move the clone so its centre sits at the spot, scaled about that centre.
    pin.position
      .sub(sourceCentre)
      .multiplyScalar(k)
      .add(new Vector3(x, t, -s));
    pin.scale.multiplyScalar(k);
    pin.castShadow = true;
    board.add(pin);
    return new Vector3(x + (sourceBox.max.x - sourceCentre.x) * k * 0.6, t, -s);
  };
  // The hubs stand on the map; the case file's two pins on its poster's top and
  // bottom edges, in front of its (curled) paper.
  const mapX = faceX + 0.012;
  const caseScale = caseFile.poster.scale;
  const caseX =
    faceX + POSTER_OFF + POSTER.square.bulge * (caseScale / POSTER.square.scale) + 0.012;
  const caseHalf = POSTER.square.half * (caseScale / POSTER.square.scale) - 0.02;
  const hubTop = addPin(connections.hubs.top.s, connections.hubs.top.t, mapX);
  const hubBottom = addPin(connections.hubs.bottom.s, connections.hubs.bottom.t, mapX);
  const fileTop = addPin(caseFile.poster.s, caseFile.poster.t + caseHalf, caseX);
  const fileBottom = addPin(caseFile.poster.s, caseFile.poster.t - caseHalf, caseX);

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
   * A strand hangs between two pins: slack (a fraction of the span) always
   * downward, as loose string sags, and held off the board so it lies over
   * the posters it crosses instead of through them. A taut straight line
   * between far-apart pins reads as stretched, so the strings from a card to
   * its posters sag more than the long spokes from the case file.
   */
  const strand = (a: Vector3, b: Vector3, slack: number) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y -= a.distanceTo(b) * slack;
    mid.x = Math.max(a.x, b.x) + 0.012;
    return new TubeGeometry(new QuadraticBezierCurve3(a, mid, b), 16, STRING_RADIUS, 5, false);
  };

  // roleClusters runs upper left, lower left, upper right, lower right.
  const upper = [roleClusters[0], roleClusters[2]];
  const lower = [roleClusters[1], roleClusters[3]];
  const tubes = [
    // The top hub: down to the case file's top edge, out to the two upper cards.
    strand(hubTop, fileTop, 0.02),
    ...upper.map(({ card }) => strand(hubTop, head(card.pin), 0.06)),
    // The bottom hub: up to the case file's bottom edge, out to the two lower cards.
    strand(hubBottom, fileBottom, 0.02),
    ...lower.map(({ card }) => strand(hubBottom, head(card.pin), 0.06)),
    // Each card to its three posters.
    ...roleClusters.flatMap(({ card, posters }) =>
      posters.map((poster) => strand(head(card.pin), head(poster.pin), 0.16)),
    ),
  ];
  const strings = new Mesh(
    mergeGeometries(tubes),
    new MeshStandardMaterial({ color: STRING_COLOR, roughness: 0.92, metalness: 0 }),
  );
  strings.name = "case404-strings";
  strings.castShadow = true;
  strings.receiveShadow = true;
  board.add(strings);

  return { board, faceX };
}
