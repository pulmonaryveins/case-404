import type Lenis from "lenis";
import { gsap } from "../lib/gsap";
import { useExperienceStore } from "../store/useExperienceStore";
import type { ChapterId } from "./storyTypes";

/**
 * Scene checkpoints: where on the story timeline each scene has settled (the
 * camera has arrived and the shot holds), so jumping to one lands on a still,
 * readable view rather than mid-move. Times are StoryController timeline
 * seconds; `reduced` is the scroll progress for the reduced-motion jumps.
 */
export const CHECKPOINTS: { id: ChapterId; label: string; time: number; reduced: number }[] = [
  { id: "CASE_OPENED", label: "Case Opened", time: 0, reduced: 0 },
  { id: "EVIDENCE_BOARD", label: "Evidence Board", time: 0.45, reduced: 0.3 },
  { id: "SUBJECT_PROFILE", label: "Subject Identity", time: 0.98, reduced: 0.5 },
  { id: "DIGITAL_ARCHIVE", label: "Digital Archive", time: 1.55, reduced: 0.7 },
  { id: "GRAPHIC_DESIGN", label: "Graphic Design", time: 2.2, reduced: 0.84 },
  { id: "MERCH", label: "Merch Locker", time: 3.05, reduced: 0.95 },
];

/** Length of StoryController's timeline, in timeline seconds. */
export const STORY_END = 3.6;

/**
 * The smooth-scroll instance, registered by LenisProvider. Kept on
 * globalThis, not in this module: a hot reload of this file during
 * development would otherwise start it over empty, and every jump would fall
 * back to a plain scroll that Lenis fights.
 */
const registry = globalThis as typeof globalThis & { __case404Lenis?: Lenis | null };

export const storyNav = {
  get lenis() {
    return registry.__case404Lenis ?? null;
  },
  set lenis(value: Lenis | null) {
    registry.__case404Lenis = value;
  },
};

/** The scroll stage StoryController renders, found in the page (never stale). */
const stageElement = () => document.querySelector<HTMLElement>("[data-story-stage]");

/** Page scroll (px) at story progress `p` (0..1 over the stage). */
export function scrollForProgress(p: number) {
  const stage = stageElement();
  if (!stage) return 0;
  const top = stage.getBoundingClientRect().top + window.scrollY;
  return top + p * Math.max(0, stage.offsetHeight - window.innerHeight);
}

/** Story progress (0..1) of a checkpoint. */
export function checkpointProgress(
  c: (typeof CHECKPOINTS)[number],
  reduced = useExperienceStore.getState().reducedMotion,
) {
  return reduced ? c.reduced : Math.min(1, c.time / STORY_END);
}

/** The glide in progress, so a new jump (or the reader scrolling) can stop it. */
let glide: gsap.core.Tween | null = null;

function stopGlide() {
  glide?.kill();
  glide = null;
  window.removeEventListener("wheel", stopGlide);
  window.removeEventListener("touchstart", stopGlide);
  window.removeEventListener("keydown", stopGlide);
}

/**
 * Scrolls the story to a checkpoint. Leaves any close-up first (the page is
 * locked while one is open).
 *
 * The glide is a GSAP tween of the scroll position, eased in and out, so it
 * starts gently, travels, and settles: the camera flies the real path through
 * the scenes in between, so the time grows with the distance (about 2 s to
 * the next scene, up to 5 s across the whole story). Scrolling, touching or a
 * key press during it hands control straight back to the reader.
 */
export function goToCheckpoint(c: (typeof CHECKPOINTS)[number]) {
  const store = useExperienceStore.getState();
  if (store.screenFocused) store.setScreenFocused(false);
  stopGlide();
  const lenis = storyNav.lenis;
  const to = scrollForProgress(checkpointProgress(c));
  const set = (y: number) => {
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo({ top: y });
  };
  if (store.reducedMotion) {
    set(to);
    return;
  }
  const from = lenis ? lenis.scroll : window.scrollY;
  const span = Math.max(1, scrollForProgress(1) - scrollForProgress(0));
  const share = Math.abs(to - from) / span;
  if (share < 0.001) return;
  const state = { y: from };
  glide = gsap.to(state, {
    y: to,
    duration: Math.min(5, 1.6 + share * 4.5),
    ease: "power2.inOut",
    onUpdate: () => set(state.y),
    onComplete: stopGlide,
  });
  // Let the click that started it finish before listening for the reader.
  requestAnimationFrame(() => {
    if (!glide) return;
    window.addEventListener("wheel", stopGlide, { passive: true });
    window.addEventListener("touchstart", stopGlide, { passive: true });
    window.addEventListener("keydown", stopGlide);
  });
}
