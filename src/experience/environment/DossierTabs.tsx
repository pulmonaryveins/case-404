import { useEffect, useMemo } from "react";
import { CanvasTexture, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { dossierPages } from "../../data/dossier";
import { useExperienceStore } from "../../store/useExperienceStore";
import { hoverCursor } from "../cursor/cursorStore";
import { dossierReadable, useDossier } from "./dossierState";

/**
 * File-divider tabs sticking out of the right edge of the dossier's stack of
 * sheets, one per sheet, top to bottom in order, each with its section's name
 * written down it. Click one to drop that sheet on top; the left and right
 * arrow keys step through the sheets. The sheet on top has its tab drawn
 * longer, and in red with cream lettering, so it is plain which is open.
 *
 * In the folder's own units (the stack is 2.02 x 2.75). Every tab's inner end
 * stays tucked under the top sheet's edge, at the same place: the open one is
 * longer, it does not slide, which would pull its end out from under the
 * sheet and leave a gap showing the stack. They live a hair under the top
 * sheet's height and slide out from under it as the folder finishes opening
 * (the parent group's x, see Dossier).
 */
const TAB = { out: 0.32, len: 0.6, tuck: 0.06, pitch: 0.606, extra: 0.08 };
/** Canvas pixels per folder unit. */
const PX = 780;
/** A hair of height per tab, so where two meet, the lower one never z-fights. */
const LIFT = 0.0006;

const WIDTH = [TAB.out, TAB.out + TAB.extra] as const;
const TAB_PLANES = WIDTH.map((w) => new PlaneGeometry(w, TAB.len));

/** One tab's face: paper (or red for the open one) with a darker rim, the name down it. */
function paintTab(label: string, active: boolean) {
  const w = Math.round(WIDTH[active ? 1 : 0] * PX);
  const h = Math.round(TAB.len * PX);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // The tab: square where it tucks under the sheet, rounded at its far end.
  const r = Math.min(w * 0.2, 64);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, active ? "#962f26" : "#d6caa4");
  g.addColorStop(1, active ? "#b44a3a" : "#e0d5b0");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = active ? "rgba(60,15,10,0.6)" : "rgba(90,70,40,0.45)";
  ctx.stroke();
  // Paper fibres.
  let seed = 31 + label.length;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,246,0.3)" : "rgba(110,92,58,0.1)";
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 6, 1);
  }

  // The name, down the tab as a divider's is (top to bottom), centred on the
  // part that shows beyond the sheet.
  ctx.save();
  ctx.translate((TAB.tuck * PX + w) / 2, h / 2);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 62;
  ctx.font = `bold ${size}px "Courier New", monospace`;
  while (ctx.measureText(label).width > h * 0.84 && size > 20) {
    size -= 2;
    ctx.font = `bold ${size}px "Courier New", monospace`;
  }
  ctx.fillStyle = active ? "#f6ecd2" : "#4b4437";
  ctx.fillText(label, 0, 0);
  ctx.restore();

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function DossierTabs({
  x,
  y,
  zTop,
}: {
  /** The stack's right edge, the tabs' height, and the stack's far (top) edge. */
  x: number;
  y: number;
  zTop: number;
}) {
  const page = useDossier((s) => s.page);

  // Both faces of every tab, painted once.
  const materials = useMemo(
    () =>
      dossierPages.map(({ label }) =>
        [false, true].map(
          (active) =>
            new MeshStandardMaterial({
              map: paintTab(label, active),
              roughness: 1,
              alphaTest: 0.5,
            }),
        ),
      ),
    [],
  );
  useEffect(
    () => () =>
      materials.flat().forEach((m) => {
        m.map?.dispose();
        m.dispose();
      }),
    [materials],
  );

  // The arrow keys step through the sheets while the dossier lies open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (!dossierReadable() || useExperienceStore.getState().screenFocused) return;
      e.preventDefault();
      useDossier.getState().turn(e.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enabled = () => dossierReadable() && !useExperienceStore.getState().screenFocused;
  return (
    <group name="dossier-tabs">
      {dossierPages.map((p, i) => {
        const state = i === page ? 1 : 0;
        return (
          <mesh
            key={p.id}
            geometry={TAB_PLANES[state]}
            material={materials[i][state]}
            position={[
              // The inner end stays put under the sheet; the open tab only reaches further out.
              x - TAB.tuck + WIDTH[state] / 2,
              y + i * LIFT,
              zTop + 0.05 + TAB.len / 2 + i * TAB.pitch,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
            onClick={(e) => {
              if (!enabled()) return;
              e.stopPropagation();
              useDossier.getState().goTo(i);
            }}
            {...hoverCursor("switch", `Turn to ${p.tab}`, enabled)}
          />
        );
      })}
    </group>
  );
}
