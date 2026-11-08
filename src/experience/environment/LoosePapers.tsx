import { useEffect, useMemo } from "react";
import { CanvasTexture, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { createPaperBump, paintPaperFinish } from "../surfaces/paperFinish";
import { DESK_TOP } from "./worldAnchors";

/**
 * Loose typed sheets lying flat on a desk: the case's evidence log and its
 * chain-of-custody form, as filed paperwork, never the subject's name. Letter
 * size; static, no per-frame work. `level` stacks overlapping sheets a hair
 * apart so they never fight for depth.
 */
export interface Sheet {
  /** Footprint centre x/z in the parent frame. */
  at: [number, number];
  yaw: number;
  kind: "log" | "custody";
  level: number;
}

const SIZE = [0.216, 0.279] as const;
const PX = [512, 662] as const;
/** Height of each stacked sheet above the one under it (m). */
const STEP = 0.0006;

const PAGES: Record<Sheet["kind"], { title: string; head: string; rows: string[] }> = {
  log: {
    title: "EVIDENCE LOG",
    head: "ITEM  DESCRIPTION            BAGGED",
    rows: [
      "01    Floppy disk, red label    YES",
      "02    Polaroid, unsigned        YES",
      "03    Fountain pen              YES",
      "04    Typewritten page          NO",
      "05    Brass shell casing        YES",
      "06    Matchbook, Hotel Arcos    YES",
    ],
  },
  custody: {
    title: "CHAIN OF CUSTODY",
    head: "DATE      RECEIVED BY      ITEM",
    rows: [
      "10/11     Desk sergeant     01-03",
      "10/12     Records room      04",
      "10/14     Lab, 2nd floor    05",
      "10/15     Returned          01-05",
      "10/16     Investigator      06",
    ],
  },
};

/** One typed page: paper finish, a stamped heading, typed rows and a signature line. */
function paintPage(kind: Sheet["kind"]) {
  const [w, h] = PX;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e6dcc4";
  ctx.fillRect(0, 0, w, h);
  paintPaperFinish(ctx, w, h);

  const page = PAGES[kind];
  ctx.fillStyle = "#26211b";
  ctx.font = 'bold 26px "Courier New", monospace';
  ctx.fillText(`CASE No. 404 - ${page.title}`, 34, 62);
  ctx.fillRect(34, 76, w - 68, 2);
  ctx.font = '15px "Courier New", monospace';
  ctx.fillText(page.head, 34, 116);
  ctx.fillStyle = "rgba(38,33,27,0.88)";
  page.rows.forEach((row, i) => ctx.fillText(row, 34, 150 + i * 30));
  ctx.fillText("Logged by: ____________________", 34, h - 92);

  // A rubber stamp, slightly turned, in faded red.
  ctx.save();
  ctx.translate(w - 128, h - 160);
  ctx.rotate(-0.18);
  ctx.strokeStyle = ctx.fillStyle = "rgba(146,38,32,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(-84, -26, 168, 52);
  ctx.font = 'bold 26px "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.fillText(kind === "log" ? "FILED" : "RECEIVED", 0, 9);
  ctx.restore();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function LoosePapers({ sheets }: { sheets: Sheet[] }) {
  const { geometry, materials, bump } = useMemo(() => {
    const geometry = new PlaneGeometry(SIZE[0], SIZE[1]);
    const bump = createPaperBump();
    const make = (kind: Sheet["kind"]) =>
      new MeshStandardMaterial({
        map: paintPage(kind),
        bumpMap: bump,
        bumpScale: 0.0015,
        roughness: 0.95,
      });
    return { geometry, bump, materials: { log: make("log"), custody: make("custody") } };
  }, []);
  useEffect(
    () => () => {
      geometry.dispose();
      bump.dispose();
      for (const m of Object.values(materials)) {
        m.map?.dispose();
        m.dispose();
      }
    },
    [geometry, bump, materials],
  );

  return (
    <group name="loose-papers">
      {sheets.map((s, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={materials[s.kind]}
          position={[s.at[0], DESK_TOP + STEP * s.level, s.at[1]]}
          // Flat, face up, its top edge toward the wall (-Z), then turned.
          rotation={[-Math.PI / 2, s.yaw, 0, "YXZ"]}
          receiveShadow
        />
      ))}
    </group>
  );
}
