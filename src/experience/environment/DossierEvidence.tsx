import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  CanvasTexture,
  FrontSide,
  type Group,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
} from "three";
import { assetManifest } from "../../assets/assetManifest";
import { certificates } from "../../data/certificates";
import { dossierPages, type DossierPageId } from "../../data/dossier";
import { education } from "../../data/education";
import { experienceEntries } from "../../data/experience";
import { storyRig } from "../../story/storyRig";
import { boardIslands, type BoardPieceId } from "../surfaces/boardIslands";
import { paintApartmentPhoto, paintSilhouettePhoto } from "../surfaces/paintDossierPhotos";
import { createPaperBump, paintPaperFinish } from "../surfaces/paperFinish";
import { PaperContactShadow } from "./PaperContactShadow";
import { useFocusable } from "../camera/focus";
import { dossierReadable, slamHeight, useDossier, whenIdle } from "./dossierState";
import { shadowsChanged } from "../canvas/shadowUpdates";

/** Unwrap the board's photo UV island into an upright print. */
function boardPhoto(
  source: CanvasImageSource & { width: number; height: number },
  id: BoardPieceId,
) {
  const { uv, right, down } = boardIslands[id];
  const [x0, y0, x1, y1] = uv.map((n, i) => n * (i % 2 ? source.height : source.width));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(right[0] ? x1 - x0 : y1 - y0);
  canvas.height = Math.round(down[0] ? x1 - x0 : y1 - y0);
  const ox = right[0] === 1 || down[0] === 1 ? x0 : x1;
  const oy = right[1] === 1 || down[1] === 1 ? y0 : y1;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(
    right[0],
    down[0],
    right[1],
    down[1],
    -(right[0] * ox + right[1] * oy),
    -(down[0] * ox + down[1] * oy),
  );
  ctx.drawImage(source, 0, 0);
  return canvas;
}

/** Deterministic print grain plus a warm sepia tone over one canvas region. */
function toneAndGrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
) {
  const pixels = ctx.getImageData(x, y, w, h);
  for (let i = 0; i < pixels.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const gray =
      pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722;
    const v = gray + (seed / 2147483647 - 0.5) * 22;
    pixels.data[i] = Math.max(0, Math.min(255, v * 1.02));
    pixels.data[i + 1] = Math.max(0, Math.min(255, v * 0.94));
    pixels.data[i + 2] = Math.max(0, Math.min(255, v * 0.8));
  }
  ctx.putImageData(pixels, x, y);
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/* ------------------------------------------------------------------ */
/* What each sheet shows on the left                                    */
/* ------------------------------------------------------------------ */

type CardPhoto = "apartment" | "figure" | "portrait";

interface RecordCard {
  title: string;
  photo: CardPhoto;
  heading: string;
  lines: [string, string][];
  ref: string;
}

interface Spread {
  /** Two street photographs from the board's own archive, with captions. */
  prints: [{ photo: BoardPieceId; caption: string }, { photo: BoardPieceId; caption: string }];
  card: RecordCard;
}

const upper = (s: string) => s.toUpperCase();

/**
 * Each sheet's three items: two prints and a record card. The prints are the
 * board's street photographs (never its mugshots: those are other people),
 * eight in all, two to a sheet; the cards summarise the sheet's records.
 */
const SPREADS: Record<DossierPageId, Spread> = {
  case: {
    prints: [
      { photo: "Plane061__0", caption: "01 / STREET SCENE" },
      { photo: "Plane067__0", caption: "02 / STREET ARCHIVE" },
    ],
    card: {
      title: "RESIDENCE RECORD",
      photo: "apartment",
      heading: "RESIDENCE / UNCONFIRMED",
      lines: [
        ["ADDRESS", "WITHHELD"],
        ["TENANT", "UNKNOWN"],
        ["LAST SEEN", "NOT RECORDED"],
      ],
      ref: "R-01",
    },
  },
  education: {
    prints: [
      { photo: "Plane066__0", caption: "03 / CAMPUS STREET" },
      { photo: "Plane071__0", caption: "04 / LECTURE QUARTER" },
    ],
    card: {
      title: "ENROLMENT RECORD",
      photo: "figure",
      heading: "ENROLMENT / CONFIRMED",
      lines: [
        // Short forms, so the card never has to cut a word: no campus, "BS" for the degree.
        ["SCHOOL", upper((education[0]?.institution ?? "ON FILE").split(" · ")[0])],
        [
          "PROGRAM",
          upper((education[0]?.credential ?? "ON FILE").replace("Bachelor of Science in", "BS")),
        ],
        ["PERIOD", upper(education[0]?.period ?? "ON FILE")],
      ],
      ref: "E-02",
    },
  },
  experience: {
    prints: [
      { photo: "Plane069__0", caption: "05 / OFFICE ROW" },
      { photo: "Plane070__0", caption: "06 / STOREFRONT" },
    ],
    card: {
      title: "EMPLOYMENT RECORD",
      photo: "portrait",
      heading: "EMPLOYMENT / VERIFIED",
      lines: [
        ["POSTS", String(experienceEntries.length)],
        ["LATEST", upper(experienceEntries[0]?.organization ?? "ON FILE")],
        ["ROLE", upper(experienceEntries[0]?.role ?? "ON FILE")],
      ],
      ref: "X-03",
    },
  },
  achievements: {
    prints: [
      { photo: "Plane063__0", caption: "07 / CITY HALL" },
      { photo: "Plane072__0", caption: "08 / THE AVENUE" },
    ],
    card: {
      title: "COMMENDATION RECORD",
      photo: "figure",
      heading: "COMMENDATIONS / ON FILE",
      lines: [
        ["COUNT", String(certificates.length)],
        ["LATEST", upper(certificates[0]?.title ?? "ON FILE")],
        ["ISSUER", upper(certificates[0]?.issuer ?? "ON FILE")],
      ],
      ref: "A-04",
    },
  },
};

/** Trims `s` with an ellipsis until it fits `maxW` in the current font. */
function fit(ctx: CanvasRenderingContext2D, s: string, maxW: number) {
  if (ctx.measureText(s).width <= maxW) return s;
  let out = s;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxW) out = out.slice(0, -1);
  // Back to the last whole word, if there is one.
  const space = out.lastIndexOf(" ");
  if (space > out.length * 0.5) out = out.slice(0, space);
  return `${out.trimEnd()}…`;
}

/** A record card: typed header, a taped photograph and a few typed fields. */
function paintRecordCard(card: RecordCard, seed: number) {
  const w = 784;
  const h = 1054;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  // The photograph is toned pixel by pixel (getImageData): keep it on the CPU.
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#e7dfc7";
  ctx.fillRect(0, 0, w, h);
  paintPaperFinish(ctx, w, h);
  ctx.fillStyle = "#641b18";
  ctx.font = 'bold 30px "Courier New", monospace';
  ctx.fillText(`CASE 404 / ${card.title}`, 44, 72);
  ctx.fillStyle = "#1f1b17";
  ctx.fillRect(44, 88, w - 88, 3);

  const px = 44;
  const py = 120;
  const pw = w - 88;
  const ph = 640;
  ctx.fillStyle = "#d8d4c6";
  ctx.fillRect(px - 14, py - 14, pw + 28, ph + 28);
  if (card.photo === "apartment") paintApartmentPhoto(ctx, px, py, pw, ph);
  else {
    // The anonymous figure is square: centred on its own dusk sky.
    ctx.fillStyle = "#5a4e3f";
    ctx.fillRect(px, py, pw, ph);
    paintSilhouettePhoto(ctx, px + (pw - ph) / 2, py, ph, card.photo === "figure" ? 0 : 1);
  }
  toneAndGrain(ctx, px, py, pw, ph, seed);
  ctx.fillStyle = "rgba(235,228,205,0.55)"; // tape
  ctx.fillRect(px - 20, py - 18, 120, 36);
  ctx.fillRect(px + pw - 100, py - 18, 120, 36);

  ctx.fillStyle = "#10110f";
  ctx.font = 'bold 34px "Courier New", monospace';
  ctx.fillText(fit(ctx, card.heading, w - 88), 44, 828);
  ctx.font = 'bold 29px "Courier New", monospace';
  ctx.fillStyle = "#26241e";
  card.lines.forEach(([label, value], i) => {
    const key = `${label}:`.padEnd(11, " ");
    ctx.fillText(fit(ctx, `${key}${value}`, w - 88), 44, 876 + i * 34);
  });
  ctx.fillStyle = "#1f1b17";
  ctx.fillRect(44, 976, w - 88, 2);
  ctx.font = 'bold 26px "Courier New", monospace';
  ctx.fillStyle = "#26241e";
  ctx.fillText(`FILE REF. CASE 404 / ${card.ref}`, 44, 1010);
  return canvas;
}

/** One print as painted paper: the photograph toned and grained, with its caption. */
function paintPrint(photo: HTMLCanvasElement, caption: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 768;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#f2ead7";
  ctx.fillRect(0, 0, 640, 768);
  paintPaperFinish(ctx, 640, 768);
  const crop = Math.min(photo.width, photo.height) * 0.86;
  ctx.drawImage(
    photo,
    (photo.width - crop) / 2,
    (photo.height - crop) / 2,
    crop,
    crop,
    34,
    34,
    572,
    572,
  );
  toneAndGrain(ctx, 34, 34, 572, 572, 404);
  ctx.strokeStyle = "#b8af9b";
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, 572, 572);
  ctx.fillStyle = "#10110f";
  ctx.font = 'bold 34px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.fillText(caption, 320, 676);
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.fillStyle = "#26241e";
  ctx.fillText("CASE 404 / BOARD ARCHIVE", 320, 721);
  return canvas;
}

/**
 * Every print and card is painted once (about 130 ms each, mostly the grain
 * pass) and kept: changing sheet only has to make textures from them. They are
 * painted ahead in idle time once the dossier is open (DossierEvidence).
 */
const printCanvases = new Map<string, HTMLCanvasElement>();
const cardCanvases = new Map<string, HTMLCanvasElement>();
function printCanvas(photo: HTMLCanvasElement, caption: string) {
  let canvas = printCanvases.get(caption);
  if (!canvas) printCanvases.set(caption, (canvas = paintPrint(photo, caption)));
  return canvas;
}
function cardCanvas(card: RecordCard, seed: number) {
  let canvas = cardCanvases.get(card.ref);
  if (!canvas) cardCanvases.set(card.ref, (canvas = paintRecordCard(card, seed)));
  return canvas;
}

/* ------------------------------------------------------------------ */
/* Pieces                                                               */
/* ------------------------------------------------------------------ */

function Polaroid({
  photo,
  caption,
  position,
  angle,
}: {
  photo: HTMLCanvasElement;
  caption: string;
  position: [number, number, number];
  angle: number;
}) {
  const bump = useMemo(() => createPaperBump(), []);
  useEffect(() => () => bump.dispose(), [bump]);
  const print = useMemo(() => toTexture(printCanvas(photo, caption)), [photo, caption]);
  useEffect(() => () => print.dispose(), [print]);
  const focus = useFocusable(dossierReadable, { label: "Inspect photo" });
  return (
    <group position={position} rotation={[0, 0, angle]}>
      <PaperContactShadow width={0.97} height={1.164} />
      {/* Front-only mounting paper: a solid box exposed a blank reverse
          through the cover while opening. These prints live inside it. */}
      <mesh receiveShadow>
        <planeGeometry args={[0.97, 1.164]} />
        <meshStandardMaterial color="#e8deca" roughness={0.9} side={FrontSide} />
      </mesh>
      <mesh position={[0, 0, 0.005]} receiveShadow castShadow {...focus}>
        <planeGeometry args={[0.965, 1.159]} />
        <meshPhysicalMaterial
          map={print}
          bumpMap={bump}
          bumpScale={0.0015}
          roughness={0.95}
          specularIntensity={0.12}
          side={FrontSide}
        />
      </mesh>
    </group>
  );
}

function Card({ card, seed }: { card: RecordCard; seed: number }) {
  const bump = useMemo(() => createPaperBump(), []);
  useEffect(() => () => bump.dispose(), [bump]);
  const map = useMemo(() => toTexture(cardCanvas(card, seed)), [card, seed]);
  useEffect(() => () => map.dispose(), [map]);
  const focus = useFocusable(dossierReadable, { label: "Inspect record" });
  return (
    <group position={[0.52, -0.02, 0.041]} rotation={[0, 0, -0.055]}>
      <PaperContactShadow width={0.98} height={1.317} />
      <mesh receiveShadow>
        <planeGeometry args={[0.98, 1.317]} />
        <meshStandardMaterial color="#e7dfc7" roughness={1} side={FrontSide} />
      </mesh>
      <mesh position={[0, 0, 0.003]} receiveShadow castShadow {...focus}>
        <planeGeometry args={[0.976, 1.3115]} />
        <meshPhysicalMaterial
          map={map}
          bumpMap={bump}
          bumpScale={0.002}
          roughness={1}
          specularIntensity={0.12}
          side={FrontSide}
        />
      </mesh>
    </group>
  );
}

/**
 * Seconds for a piece to fall, land and settle (it lands half-way), and the
 * gap between one piece and the next: the paper has hit the stack by the time
 * the first one comes down, then each lands in turn.
 */
const DROP_SECONDS = 0.6;
const DROP_STAGGER = 0.13;
/** Height it drops from, in the cover's units (up off the page), and its tilt while up. */
const DROP_FROM = 0.9;
const DROP_TURN = 0.45;

/**
 * Slams its piece down onto the cover when a new sheet's items come in: from
 * well above, spinning slightly as it falls, with a bounce as it lands. The
 * first sheet's pieces are simply there when the folder opens.
 */
function Drop({
  order,
  animate,
  children,
}: {
  order: number;
  animate: boolean;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const t = useRef(animate ? (-order * DROP_STAGGER) / DROP_SECONDS : 1);
  useFrame((_, dt) => {
    if (!group.current || t.current >= 1) return;
    shadowsChanged();
    t.current = Math.min(1, t.current + dt / DROP_SECONDS);
    const h = slamHeight(Math.max(0, t.current));
    group.current.position.z = DROP_FROM * h;
    group.current.rotation.z = DROP_TURN * h * (order % 2 ? 1 : -1);
    group.current.visible = t.current >= 0;
  });
  return (
    <group ref={group} visible={!animate}>
      {children}
    </group>
  );
}

/** The old items go at once; the new ones are dealt in after the paper has dropped. */
const SWAP_DELAY_MS = 120;

/** The current sheet's three items, inheriting the cover pose from Dossier's attachment. */
export function DossierEvidence() {
  const { scene } = useGLTF(assetManifest.investigationBoard.url);
  const photos = useMemo(() => {
    let atlas: CanvasImageSource & { width: number; height: number };
    scene.traverse((node) => {
      if (!(node instanceof Mesh) || atlas) return;
      const map = (node.material as MeshStandardMaterial).map;
      if (map) atlas = map.userData.originalImage ?? map.image;
    });
    const out = new Map<BoardPieceId, HTMLCanvasElement>();
    for (const spread of Object.values(SPREADS))
      for (const { photo } of spread.prints) out.set(photo, boardPhoto(atlas!, photo));
    return out;
  }, [scene]);

  // Once the dossier lies open, paint the other sheets' prints and cards one
  // by one in idle time, so changing sheet never has to.
  useEffect(() => {
    let cancelled = false;
    const paintAhead = () => {
      const jobs: (() => void)[] = [];
      dossierPages.forEach((page, i) => {
        const spread = SPREADS[page.id];
        for (const { photo, caption } of spread.prints)
          jobs.push(() => printCanvas(photos.get(photo)!, caption));
        jobs.push(() => cardCanvas(spread.card, 77 + i * 13));
      });
      const next = () => {
        const job = jobs.shift();
        if (cancelled || !job) return;
        job();
        whenIdle(next, 700);
      };
      whenIdle(next, 700);
    };
    const unsubscribe = useDossier.subscribe((state, prev) => {
      if (state.readable && !prev.readable) paintAhead();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [photos]);

  // Which sheet's items are on the cover, and whether they arrived by a change.
  const [shown, setShown] = useState({ page: useDossier.getState().page, animate: false });
  useEffect(() => {
    let timer = 0;
    const unsubscribe = useDossier.subscribe((state, prev) => {
      if (state.page === prev.page) return;
      window.clearTimeout(timer);
      const open = storyRig.dossierOpen > 0.5;
      if (!open) setShown({ page: state.page, animate: false });
      else
        timer = window.setTimeout(
          () => setShown({ page: state.page, animate: true }),
          SWAP_DELAY_MS,
        );
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const id = dossierPages[shown.page].id;
  const spread = SPREADS[id];
  return (
    <group
      key={id}
      name="dossier-left-evidence"
      position={[-1.12, 0.025, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <Drop order={0} animate={shown.animate}>
        <Polaroid
          photo={photos.get(spread.prints[0].photo)!}
          caption={spread.prints[0].caption}
          position={[-0.43, 0.68, 0.012]}
          angle={-0.065}
        />
      </Drop>
      <Drop order={1} animate={shown.animate}>
        <Polaroid
          photo={photos.get(spread.prints[1].photo)!}
          caption={spread.prints[1].caption}
          position={[-0.38, -0.61, 0.017]}
          angle={0.055}
        />
      </Drop>
      <Drop order={2} animate={shown.animate}>
        <Card card={spread.card} seed={77 + shown.page * 13} />
      </Drop>
    </group>
  );
}
