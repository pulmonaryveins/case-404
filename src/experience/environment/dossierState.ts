import { create } from "zustand";
import { dossierPages } from "../../data/dossier";
import { useExperienceStore } from "../../store/useExperienceStore";
import { storyRig } from "../../story/storyRig";

/** The dossier's prints and pages are close-up targets once it lies fully open. */
export const dossierReadable = () =>
  useExperienceStore.getState().currentChapter === "SUBJECT_PROFILE" && storyRig.dossierOpen > 0.95;

/**
 * Height above its resting place, as a fraction of the drop (1 at the start,
 * 0 at rest), of something thrown down on the desk: it falls with gravity
 * (to the half-way mark of `t`), lands, and bounces twice more, smaller.
 */
export function slamHeight(t: number) {
  if (t <= 0) return 1;
  if (t < 0.5) return 1 - (t / 0.5) ** 2;
  if (t < 0.75) return 0.12 * Math.sin((Math.PI * (t - 0.5)) / 0.25);
  if (t < 0.9) return 0.035 * Math.sin((Math.PI * (t - 0.75)) / 0.15);
  return 0;
}

/**
 * Runs `fn` when the page is idle, but within `within` ms regardless. A bare
 * requestIdleCallback can wait forever on a page that renders every frame,
 * which left the sheets unpainted when they were first turned to.
 */
export function whenIdle(fn: () => void, within = 1500) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(fn, { timeout: within });
  } else {
    window.setTimeout(fn, 200);
  }
}

interface DossierState {
  /** Index into `dossierPages` of the sheet on top. */
  page: number;
  /** Open flat and readable: the other sheets may be painted ahead. */
  readable: boolean;
  goTo: (page: number) => void;
  turn: (delta: 1 | -1) => void;
  setReadable: (readable: boolean) => void;
  reset: () => void;
}

const last = dossierPages.length - 1;

export const useDossier = create<DossierState>((set, get) => ({
  page: 0,
  readable: false,
  goTo: (page) => {
    const next = Math.max(0, Math.min(last, page));
    if (next !== get().page) set({ page: next });
  },
  turn: (delta) => get().goTo(get().page + delta),
  setReadable: (readable) => set({ readable }),
  reset: () => set({ page: 0 }),
}));
