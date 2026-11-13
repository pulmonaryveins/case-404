import { type ReactNode, useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import styles from "./Site.module.css";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** expo.inOut and power3.inOut, as CSS easings. */
const EXPO_IN_OUT = "cubic-bezier(0.87, 0, 0.13, 1)";
const POWER3_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

/**
 * The transform that shrinks a full-screen panel (origin top left) onto an
 * item's card, so the record can grow out of the card and back into it. A
 * small box mid-screen when the card is out of view.
 */
function cardTransform(attr: string, id: string): string {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const r = document.querySelector(`[${attr}="${CSS.escape(id)}"]`)?.getBoundingClientRect();
  const off = !r || !r.width || r.right < 0 || r.left > w || r.bottom < 0 || r.top > h;
  const box = off
    ? { x: w * 0.42, y: h * 0.42, width: w * 0.16, height: h * 0.16 }
    : { x: r.left, y: r.top, width: r.width, height: r.height };
  return `translate(${box.x}px, ${box.y}px) scale(${box.width / w}, ${box.height / h})`;
}

/**
 * The zoom is a plain dark panel scaled with a transform: the GPU moves it
 * without repainting anything. (Clipping the whole record instead repainted
 * the blurred cover and every line of text on each frame.) The record's
 * content fades in once the panel has grown, and out before it shrinks.
 */
function zoomAnim(panel: HTMLElement, from: string, to: string, opts: KeyframeAnimationOptions) {
  return panel.animate([{ transform: from }, { transform: to }], opts);
}

/**
 * Puts focus back on the item's card without the keyboard focus ring (the
 * browser would otherwise restore it as if tabbed to, and the card would sit
 * lifted, outlined and lit after the record closes).
 */
function refocusCard(attr: string, id: string) {
  const card = document.querySelector<HTMLElement>(`[${attr}="${CSS.escape(id)}"]`);
  card?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
}

/**
 * The full-screen record both archives open into (projects and prints): it
 * grows out of the card that was clicked and back into it on close; pages
 * between items with a dark wipe in the direction of travel; and shows an
 * optional dimmed, blurred cover behind. The content is the caller's: mark
 * what should rise in with `data-terminal-in`. Esc closes, the arrow keys (and
 * the edge buttons) page.
 *
 * `id` is the open item (null when closed); `cardAttr` the data attribute
 * its card carries, with the same id, to zoom from and into.
 */
export function TerminalDialog({
  id,
  cardAttr,
  bg,
  label,
  step,
  onStep,
  onClose,
  overlay,
  children,
}: {
  id: string | null;
  cardAttr: string;
  bg?: string | null;
  /** The record's accessible name. */
  label: string;
  /** What paging moves between: "evidence", "print". */
  step: string;
  /** Asked to show the next (1) or previous (-1) item, once the wipe covers the screen. */
  onStep: (dir: 1 | -1) => void;
  onClose: () => void;
  /** Sits over the record (a full-size image, say). */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const closing = useRef(false);
  const dir = useRef<1 | -1>(1);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (id === null) {
      if (d.open) d.close();
      return;
    }
    const q = (sel: string) => d.querySelectorAll(sel);
    if (d.open) {
      // Paged to another item: the wipe pulls away and the new one slides in
      // from the side it was paged towards.
      d.scrollTo({ top: 0 });
      if (reduced()) return;
      const from = dir.current;
      gsap
        .timeline({ onComplete: () => void (busy.current = false) })
        .to(q("[data-wipe]"), {
          scaleX: 0,
          transformOrigin: from > 0 ? "right center" : "left center",
          duration: 0.55,
          ease: "expo.inOut",
        })
        .fromTo(
          q("[data-terminal-bg]"),
          { scale: 1.15, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 1.1, ease: "expo.out" },
          0.1,
        )
        .fromTo(
          q("[data-terminal-in]"),
          { x: from * 80, autoAlpha: 0 },
          { x: 0, autoAlpha: 1, duration: 0.8, stagger: 0.05, ease: "expo.out" },
          0.2,
        );
      return;
    }
    d.showModal();
    d.focus({ preventScroll: true });
    d.scrollTo({ top: 0 });
    if (reduced()) return;
    const panel = d.querySelector<HTMLElement>("[data-zoom]");
    if (panel)
      zoomAnim(panel, cardTransform(cardAttr, id), "none", { duration: 700, easing: EXPO_IN_OUT });
    gsap.fromTo(
      q("[data-terminal-bg]"),
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.7, ease: "power1.out", delay: 0.4 },
    );
    gsap.fromTo(
      q("[data-terminal-in]"),
      { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.05, ease: "power3.out", delay: 0.45 },
    );
    gsap.fromTo(
      q("[data-terminal-ui]"),
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.35, delay: 0.6 },
    );
  }, [id, cardAttr]);

  /**
   * Closes: the controls go, the record fades, the cover drifts closer, and
   * the whole thing folds back into its card, fading over the last stretch.
   * Focus returns to the card, without the keyboard ring.
   */
  const close = () => {
    const d = dialog.current;
    if (!d || id === null || closing.current) return;
    if (reduced()) {
      d.close();
      refocusCard(cardAttr, id);
      return;
    }
    closing.current = true;
    // Closed in the middle of paging: stop that, and fold the record as it is.
    if (busy.current) {
      gsap.killTweensOf(d.querySelectorAll("[data-wipe], [data-terminal-in], [data-terminal-bg]"));
      gsap.set(d.querySelectorAll("[data-wipe]"), { scaleX: 0 });
      gsap.set(d.querySelectorAll("[data-terminal-in]"), { autoAlpha: 1, x: 0 });
      busy.current = false;
    }
    // Bring the card into view first, at once (the page's smooth scrolling
    // would move it while the record is still folding towards it).
    document
      .querySelector(`[${cardAttr}="${CSS.escape(id)}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    const q = (sel: string) => d.querySelectorAll(sel);
    const target = cardTransform(cardAttr, id);
    const closedId = id;
    const panel = d.querySelector<HTMLElement>("[data-zoom]");
    // The record empties first, so the panel shrinks as one flat shape.
    gsap
      .timeline()
      .to(q("[data-terminal-ui]"), { autoAlpha: 0, duration: 0.18, ease: "power1.out" }, 0)
      .to(
        q("[data-terminal-in]"),
        { autoAlpha: 0, y: -10, duration: 0.24, stagger: 0.01, ease: "power2.out" },
        0,
      )
      .to(q("[data-terminal-bg]"), { autoAlpha: 0, duration: 0.3, ease: "power1.out" }, 0);
    // Then it folds back into its card and fades over the last stretch, so it
    // lands on the card instead of covering it with a dark box.
    const anims = panel
      ? [
          zoomAnim(panel, "none", target, {
            duration: 620,
            delay: 200,
            easing: POWER3_IN_OUT,
            fill: "forwards",
          }),
          panel.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 240,
            delay: 600,
            easing: "ease-out",
            fill: "forwards",
          }),
        ]
      : [];
    void Promise.all(anims.map((a) => a.finished))
      .catch(() => {})
      .then(() => {
        d.close();
        anims.forEach((a) => a.cancel());
        gsap.set(q("[data-terminal-ui], [data-terminal-in], [data-terminal-bg]"), {
          clearProps: "all",
        });
        closing.current = false;
        refocusCard(cardAttr, closedId);
      });
  };

  /** Pages: the record slides away, a dark wipe sweeps in the same direction, then the parent swaps the item. */
  const go = (to: 1 | -1) => {
    const d = dialog.current;
    if (id === null || !d || busy.current || closing.current) return;
    dir.current = to;
    if (reduced()) return onStep(to);
    busy.current = true;
    const q = (sel: string) => d.querySelectorAll(sel);
    gsap
      .timeline({ onComplete: () => onStep(to) })
      .to(
        q("[data-terminal-in]"),
        { x: -to * 80, autoAlpha: 0, duration: 0.35, stagger: 0.02, ease: "power2.in" },
        0,
      )
      .fromTo(
        q("[data-wipe]"),
        { scaleX: 0, transformOrigin: to > 0 ? "left center" : "right center" },
        { scaleX: 1, duration: 0.5, ease: "expo.inOut" },
        0.1,
      );
  };

  return (
    <dialog
      ref={dialog}
      className={styles.terminal}
      tabIndex={-1}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      aria-label={label}
    >
      {id !== null && (
        <>
          <div className={styles.terminalZoom} data-zoom aria-hidden />
          {bg && <img className={styles.terminalBg} src={bg} alt="" data-terminal-bg />}
          <div className={styles.terminalWipe} data-wipe aria-hidden />
          <button className={styles.terminalClose} onClick={close} data-terminal-ui>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
            <span>Close</span>
            <kbd aria-hidden>Esc</kbd>
          </button>
          <button
            className={`${styles.terminalArrow} ${styles.terminalPrev}`}
            onClick={() => go(-1)}
            aria-label={`Previous ${step}`}
            data-terminal-ui
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M14.5 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            className={`${styles.terminalArrow} ${styles.terminalNext}`}
            onClick={() => go(1)}
            aria-label={`Next ${step}`}
            data-terminal-ui
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M9.5 5l7 7-7 7" />
            </svg>
          </button>
          <article className={styles.terminalInner} key={id}>
            {children}
          </article>
          {overlay}
        </>
      )}
    </dialog>
  );
}
