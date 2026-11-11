import { type ReactNode, useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";
import styles from "./Site.module.css";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Inset = [number, number, number, number];
const OPEN: Inset = [0, 0, 0, 0];

/**
 * The inset (top, right, bottom, left, in % of the viewport) that frames an
 * item's card on screen, so the record can zoom out of the card and back into
 * it. A small box mid-screen when the card is out of view.
 */
function cardInset(attr: string, id: string): Inset {
  const r = document.querySelector(`[${attr}="${CSS.escape(id)}"]`)?.getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (!r || !r.width || r.right < 0 || r.left > w || r.bottom < 0 || r.top > h)
    return [42, 42, 42, 42];
  return [
    (r.top / h) * 100,
    ((w - r.right) / w) * 100,
    ((h - r.bottom) / h) * 100,
    (r.left / w) * 100,
  ];
}

/**
 * A tween of the dialog's clip from one inset to another. The numbers are
 * tweened and written out by hand: letting GSAP interpolate the clip-path
 * string itself misreads some percentage values.
 */
function clipTween(el: HTMLElement, from: Inset, to: Inset, vars: gsap.TweenVars) {
  const o = { p: 0 };
  const write = () =>
    (el.style.clipPath = `inset(${from
      .map((f, i) => `${(f + (to[i] - f) * o.p).toFixed(3)}%`)
      .join(" ")})`);
  write();
  return { target: o, vars: { ...vars, p: 1, onUpdate: write } };
}

/**
 * The full-screen record both archives open into (projects and prints): it
 * zooms out of the card that was clicked and back into it on close; pages
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
    const open = clipTween(d, cardInset(cardAttr, id), OPEN, {
      duration: 0.85,
      ease: "expo.inOut",
      onComplete: () => void gsap.set(d, { clearProps: "clipPath" }),
    });
    gsap.to(open.target, open.vars);
    gsap.fromTo(
      q("[data-terminal-bg]"),
      { scale: 1.3 },
      { scale: 1, duration: 1.6, ease: "expo.out" },
    );
    gsap.from(q("[data-terminal-in]"), {
      autoAlpha: 0,
      y: 24,
      duration: 0.7,
      stagger: 0.06,
      ease: "power3.out",
      delay: 0.5,
    });
    gsap.from(q("[data-terminal-ui]"), { autoAlpha: 0, duration: 0.4, delay: 0.7 });
  }, [id, cardAttr]);

  /**
   * Closes: the controls go, the record fades, the cover drifts closer, and
   * the whole thing folds back into its card, fading over the last stretch.
   */
  const close = () => {
    const d = dialog.current;
    if (!d || id === null || closing.current) return;
    if (reduced()) return d.close();
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
    const fold = clipTween(d, OPEN, cardInset(cardAttr, id), {
      duration: 0.85,
      ease: "power3.inOut",
    });
    gsap
      .timeline({
        onComplete: () => {
          d.close();
          gsap.set(d, { clearProps: "clipPath,opacity,visibility" });
          closing.current = false;
        },
      })
      .to(q("[data-terminal-ui]"), { autoAlpha: 0, duration: 0.2, ease: "power1.out" }, 0)
      .to(
        q("[data-terminal-in]"),
        { autoAlpha: 0, duration: 0.3, stagger: 0.015, ease: "power1.out" },
        0,
      )
      .to(q("[data-terminal-bg]"), { scale: 1.08, duration: 0.85, ease: "power3.inOut" }, 0)
      .to(fold.target, fold.vars, 0.1)
      .to(d, { opacity: 0, duration: 0.25, ease: "power1.in" }, 0.7);
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
