import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Box3,
  CanvasTexture,
  CatmullRomCurve3,
  type Group,
  ImageLoader,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  QuadraticBezierCurve3,
  Raycaster,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { assetManifest, type AssetId } from "../../assets/assetManifest";
import {
  boardPhotos,
  caseFile,
  connections,
  hiddenPieces,
  roleClusters,
  tags,
  type BoardPoster,
  type PosterShape,
  type RoleCluster,
  type StringEnd,
} from "../../data/evidenceBoard";
import { paintCaseBoard, paintEvidenceImage, paintStickyNote } from "../surfaces/paintCaseBoard";

/**
 * The painted board material, one per loaded model. Kept here, in the module,
 * and not on the cached model: the model's own texture is never changed, so
 * the board is always painted from the pristine atlas, and a reload or a hot
 * reload (which makes a fresh module, and so a fresh cache) repaints it.
 */
const paintedBoards = new WeakMap<Object3D, MeshStandardMaterial>();

/**
 * The red string, matched to the new detective board's (detective_board.glb
 * in assets-source): a deep red cord about 2.5 mm thick, matte (its atlas
 * gives roughness 0.84, no metal). Untextured: that string samples a flat
 * patch of solid red from its atlas, so a plain colour is the same thing.
 */
const STRING_RADIUS = 0.00125;
const STRING_COLOR = "#a50201";
const STRING_ROUGHNESS = 0.84;

/**
 * The push pins' size: 1.15 x the real pin, a 13 mm head. In the pin model
 * (its +Y is out of the board), the flange's back is 2.1 mm up the needle
 * (it sits on the paper there, the needle below it going in) and its neck,
 * where the strings tie, about 6 mm up.
 */
const PIN_SCALE = 1.15;
const PIN_FLANGE = 0.0021;
const PIN_NECK = 0.006;
/** The most a pin leans with the paper under it, off square to the board. */
const PIN_TILT = (30 * Math.PI) / 180;

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
/** The square poster model's side at scale 1 (m), and the portrait one's size. */
const SQUARE_SIDE = 0.36;
const PORTRAIT_SIZE = { w: 0.435, h: 0.62 };

/**
 * The role sticky notes: side (m), how far the free bottom edge curls off the
 * board (m), each note's tilt (in roleClusters order), and how far down from
 * its top edge its pin sits.
 */
const NOTE = { side: 0.125, curl: 0.012, rolls: [-0.05, 0.04, 0.06, -0.035], pinDrop: 0.02 };
/**
 * Strings run behind the sticky notes: where one crosses a note it dips down
 * to the map (a hair above it, under the paper) so it never runs over the
 * role's name. It eases down over `NOTE_EDGE` outside the note's edge, and
 * stays up for `NOTE_PIN` from its own pin, so it still leaves the pin.
 */
const NOTE_EDGE = 0.012;
const NOTE_PIN = 0.002;
const STRING_ON_MAP = 0.0012;

/**
 * The investigation board with its generic content replaced by CASE 404
 * evidence:
 * - colour atlas repainted once at load (same material, geometry, UVs);
 * - the board's baked photographs, loose strands and spare pins hidden;
 * - a role sticky note at each corner of the map (over the board's own cards,
 *   now hidden), the case file at its centre;
 * - twelve 3D posters (a landscape, a portrait and a square round each role
 *   card), hung from the board's own pins, with sample images painted per
 *   role;
 * - four loose evidence photos round the case file (`boardPhotos`);
 * - extra pins (clones of an existing one): one on the case file's top edge
 *   and one on each photo;
 * - a red string network (`connections`, and each card to its posters)
 *   merged into a single mesh: one extra draw call for every strand.
 */
export function EvidenceBoard() {
  const asset = assetManifest.investigationBoard;
  const { scene } = useGLTF(asset.url);
  const { scene: pin } = useGLTF(assetManifest.redPin.url);
  const { board, faceX, pins } = useMemo(() => buildBoard(scene, pin), [scene, pin]);

  // Once the posters, photos and notes are mounted: pins onto their paper,
  // then the strings between them.
  const group = useRef<Group>(null);
  useLayoutEffect(() => {
    if (!group.current) return;
    const strings = seatPins(board, group.current, pins, faceX);
    return () => {
      board.remove(strings);
      strings.geometry.dispose();
      (strings.material as MeshStandardMaterial).dispose();
    };
  }, [board, faceX, pins]);

  return (
    <group ref={group} position={asset.position} rotation={asset.rotation} scale={asset.scale}>
      <primitive object={board} />
      <CasePosterModel faceX={faceX} />
      {boardPhotos.map((photo) => (
        <BoardPhotoModel key={photo.id} photo={photo} faceX={faceX} />
      ))}
      {roleClusters.map((cluster, i) => (
        <StickyNote key={cluster.role} cluster={cluster} order={i} faceX={faceX} />
      ))}
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
  canvas: HTMLCanvasElement | HTMLImageElement;
  s: number;
  t: number;
  roll: number;
  /** Distance of the poster's back from the board's face. */
  lift: number;
  /** Uniform, or [width, height, depth] for a print of other proportions. */
  scale: number | [number, number, number];
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

/** One of the role clusters' posters: its image if it has one, else the painted sample. */
function BoardPosterModel(props: { poster: BoardPoster; order: number; faceX: number }) {
  return props.poster.image ? <ImagePrintModel {...props} /> : <SamplePosterModel {...props} />;
}

/**
 * An image printed on a poster of any shape: fitted whole inside it,
 * centred, on the print's off-white paper (the role photos are cropped to
 * their poster's shape beforehand, so they fill it with an even border).
 */
function ImagePrintModel({
  poster,
  order,
  faceX,
}: {
  poster: BoardPoster;
  order: number;
  faceX: number;
}) {
  const spec = POSTER[poster.shape];
  const image = useLoader(ImageLoader, poster.image!);
  const canvas = useMemo(() => {
    const [w, h] = spec.px;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#e6e0d2";
    ctx.fillRect(0, 0, w, h);
    const margin = Math.min(w, h) * 0.05;
    const k = Math.min((w - margin * 2) / image.width, (h - margin * 2) / image.height);
    const dw = image.width * k;
    const dh = image.height * k;
    ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
    return c;
  }, [image, spec]);
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

/** A role cluster's poster with the painted sample image for its role. */
function SamplePosterModel({
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

/**
 * One of the loose evidence prints round the case file, on the square poster
 * model, or the portrait one stretched a touch to the print's proportions.
 */
function BoardPhotoModel({ photo, faceX }: { photo: (typeof boardPhotos)[number]; faceX: number }) {
  const image = useLoader(ImageLoader, photo.image);
  const portrait = photo.aspect > 1.05;
  const k = photo.size / (portrait ? PORTRAIT_SIZE.w : SQUARE_SIDE);
  const ky = portrait ? (photo.size * photo.aspect) / PORTRAIT_SIZE.h : k;
  return (
    <PosterModel
      shape={portrait ? "portrait" : "square"}
      canvas={image}
      s={photo.s}
      t={photo.t}
      roll={photo.roll}
      lift={faceX + POSTER_OFF}
      scale={[k, ky, k]}
    />
  );
}

/**
 * A role's sticky note, stuck to the map by its glue band along the top: a
 * thin square whose free lower part curls a little off the board.
 */
function StickyNote({
  cluster,
  order,
  faceX,
}: {
  cluster: RoleCluster;
  order: number;
  faceX: number;
}) {
  const { geometry, material } = useMemo(() => {
    const lines = tags.find((tag) => tag.piece === cluster.card.piece)?.lines ?? [cluster.role];
    const texture = new CanvasTexture(paintStickyNote(lines, 11 + order));
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    const geometry = new PlaneGeometry(NOTE.side, NOTE.side, 1, 10);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      // 0 down to below the glue band, rising to 1 at the free bottom edge.
      const free = Math.max(0, (NOTE.side * 0.34 - pos.getY(i)) / (NOTE.side * 0.84));
      pos.setZ(i, NOTE.curl * free * free);
    }
    geometry.computeVertexNormals();
    const material = new MeshStandardMaterial({ map: texture, roughness: 0.82, metalness: 0 });
    return { geometry, material };
  }, [cluster, order]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <group
      position={[faceX + 0.003, cluster.card.t, -cluster.card.s]}
      rotation={[0, Math.PI / 2, 0]}
    >
      <mesh
        geometry={geometry}
        material={material}
        rotation={[0, 0, NOTE.rolls[order] ?? 0]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

/** The CASE 404 file: a square poster at the centre of the board. */
function CasePosterModel({ faceX }: { faceX: number }) {
  const { s, t, roll, scale } = caseFile.poster;
  const image = useLoader(ImageLoader, caseFile.image);
  return (
    <PosterModel
      shape="square"
      canvas={image}
      s={s}
      t={t}
      roll={roll}
      lift={faceX + POSTER_OFF}
      scale={scale}
    />
  );
}

/** Works in the board GLB's own scene space (board face toward +X). */
function buildBoard(source: Object3D, redPin: Object3D) {
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

  // The board's own role cards give way to the sticky notes (StickyNote);
  // each card's pin moves to the top of its note, under the glue band.
  roleClusters.forEach(({ card }, i) => {
    board.getObjectByName(card.piece)!.visible = false;
    const roll = NOTE.rolls[i] ?? 0;
    const up = NOTE.side / 2 - NOTE.pinDrop;
    const s = card.s - up * Math.sin(roll);
    const t = card.t + up * Math.cos(roll);
    moveCentreTo(board.getObjectByName(card.pin)!, s, t, faceX + 0.014);
  });

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

  // Every pin is the new board's red push pin (redPin), all one size. The
  // board's own pins that are in use (each role note's and each poster's,
  // moved above) only mark the spots; the case file and photos get a spot at
  // their top edge. The pins' depth is settled once everything is mounted
  // (seatPins), on whatever paper is under each.
  const pins = new Map<string, Object3D>();
  const place = (key: string, at: Vector3) => {
    const pin = redPin.clone(true);
    // Head (+Y) out of the board (+X), needle in.
    pin.rotation.set(0, 0, -Math.PI / 2);
    pin.scale.setScalar(PIN_SCALE);
    pin.position.copy(at);
    pin.userData.casePin = true;
    pin.traverse((o) => {
      if (o instanceof Mesh) o.castShadow = o.receiveShadow = true;
    });
    board.add(pin);
    pins.set(key, pin);
  };
  board.traverse((o) => {
    if (o instanceof Mesh && o.visible && o.name.startsWith("Cylinder")) {
      place(o.name, new Box3().setFromObject(o, true).getCenter(new Vector3()));
      o.visible = false;
    }
  });
  const atTopOf = (s: number, t: number, roll: number, side: number, drop: number) => {
    const up = side / 2 - drop;
    return new Vector3(faceX + 0.02, t + up * Math.cos(roll), -(s - up * Math.sin(roll)));
  };
  const { poster } = caseFile;
  place("file", atTopOf(poster.s, poster.t, poster.roll, SQUARE_SIDE * poster.scale, 0.02));
  for (const photo of boardPhotos) {
    // In the photo's top margin, clear of its title or date stamp.
    const height = photo.size * photo.aspect;
    place(`photo:${photo.id}`, atTopOf(photo.s, photo.t, photo.roll, height, 0.011));
  }

  return { board, faceX, pins };
}

/**
 * Sets each pin's depth so its flange sits on the paper under it (a ray from
 * in front of the pin, straight into the board; the posters, notes and photos
 * curl, so their depth at a pin is only known once they are mounted), then
 * strings the pins together. Returns the strings' mesh, added to the board.
 */
function seatPins(board: Object3D, around: Object3D, pins: Map<string, Object3D>, faceX: number) {
  around.updateMatrixWorld(true);
  const out = new Vector3(1, 0, 0).transformDirection(board.matrixWorld);
  const raycaster = new Raycaster();
  const shown = (o: Object3D | null): boolean => !o || (o.visible && shown(o.parent));
  const isPin = (o: Object3D | null): boolean => !!o && (o.userData.casePin || isPin(o.parent));
  for (const pin of pins.values()) {
    const world = board.localToWorld(pin.position.clone());
    raycaster.set(world.clone().addScaledVector(out, 0.2), out.clone().negate());
    const hit = raycaster
      .intersectObject(around, true)
      .find((h) => h.object.name !== "case404-strings" && !isPin(h.object) && shown(h.object));
    if (!hit) continue;
    // Square to the paper where it is hit, as a pin pushed into curled paper
    // leans with it (at most PIN_TILT off square to the board).
    const toBoard = board.matrixWorld.clone().invert();
    const n = hit.face
      ? hit.face.normal
          .clone()
          .transformDirection(hit.object.matrixWorld)
          .transformDirection(toBoard)
      : new Vector3(1, 0, 0);
    if (n.x < 0) n.negate();
    const tilt = Math.acos(Math.min(1, n.x));
    if (tilt > PIN_TILT) {
      const side = n.clone().setX(0).normalize();
      n.set(Math.cos(PIN_TILT), 0, 0).addScaledVector(side, Math.sin(PIN_TILT));
    }
    pin.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), n);
    pin.position
      .copy(board.worldToLocal(hit.point.clone()))
      .addScaledVector(n, -PIN_FLANGE * PIN_SCALE);
  }

  // Where a strand ties off: round the pin's neck, just behind its cap.
  const tie = (key: string) => {
    const pin = pins.get(key)!;
    const axis = new Vector3(0, 1, 0).applyQuaternion(pin.quaternion);
    return pin.position.clone().addScaledVector(axis, PIN_NECK * PIN_SCALE);
  };

  /**
   * A strand hangs between two pins: slack (a fraction of the span) always
   * downward, as loose string sags, and held off the board so it lies over
   * the posters it crosses instead of through them. A taut straight line
   * between far-apart pins reads as stretched, so the strings from a card to
   * its posters sag more than the long spokes from the case file.
   */
  /** How far under a note (0 clear of it, 1 on it) a point of the board face lies. */
  const underNote = (point: Vector3) => {
    const s = -point.z;
    const t = point.y;
    let cover = 0;
    roleClusters.forEach(({ card }, i) => {
      const roll = NOTE.rolls[i] ?? 0;
      const ds = s - card.s;
      const dt = t - card.t;
      // Into the note's own frame (it is turned by its roll).
      const lx = ds * Math.cos(roll) + dt * Math.sin(roll);
      const ly = -ds * Math.sin(roll) + dt * Math.cos(roll);
      const half = NOTE.side / 2;
      const d = Math.hypot(Math.max(Math.abs(lx) - half, 0), Math.max(Math.abs(ly) - half, 0));
      cover = Math.max(cover, 1 - MathUtils.smoothstep(d, 0, NOTE_EDGE));
    });
    return cover;
  };

  const strand = (a: Vector3, b: Vector3, slack: number) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y -= a.distanceTo(b) * slack;
    mid.x = Math.max(a.x, b.x) + 0.012;
    const curve = new QuadraticBezierCurve3(a, mid, b);
    const length = curve.getLength();
    // Sampled, with the dip behind any note it crosses (never near its own ends).
    const steps = 48;
    const points: Vector3[] = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const p = curve.getPoint(u);
      const fromEnd = Math.min(u, 1 - u) * length;
      const dip = underNote(p) * MathUtils.smoothstep(fromEnd, NOTE_PIN, NOTE_PIN + 0.006);
      p.x = MathUtils.lerp(p.x, faceX + STRING_ON_MAP, dip);
      points.push(p);
    }
    return new TubeGeometry(new CatmullRomCurve3(points), 64, STRING_RADIUS, 5, false);
  };

  const end = (e: StringEnd) => {
    if (e === "file") return tie("file");
    if ("photo" in e) return tie(`photo:${e.photo}`);
    return tie(roleClusters.find((c) => c.role === e.card)!.card.pin);
  };
  const tubes = [
    // The network round the case file.
    ...connections.strands.map(([a, b]) => strand(end(a), end(b), 0.05)),
    // Each card to its three posters.
    ...roleClusters.flatMap(({ card, posters }) =>
      posters.map((poster) => strand(tie(card.pin), tie(poster.pin), 0.16)),
    ),
  ];
  const strings = new Mesh(
    mergeGeometries(tubes),
    new MeshStandardMaterial({ color: STRING_COLOR, roughness: STRING_ROUGHNESS, metalness: 0 }),
  );
  tubes.forEach((t) => t.dispose());
  strings.name = "case404-strings";
  strings.castShadow = true;
  strings.receiveShadow = true;
  board.add(strings);
  return strings;
}
