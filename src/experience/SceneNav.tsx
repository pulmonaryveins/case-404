import { useEffect, useRef, type ReactNode } from "react";
import { useExperienceStore } from "../store/useExperienceStore";
import type { ChapterId } from "../story/storyTypes";
import {
  CHECKPOINTS,
  checkpointProgress,
  goToCheckpoint,
  scrollForProgress,
} from "../story/storyNav";
import styles from "./SceneNav.module.css";

const svg = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
);

/** One small line icon per scene. */
const ICONS: Record<string, ReactNode> = {
  // Case file folder.
  CASE_OPENED: svg(
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  ),
  // Pinned board with string.
  EVIDENCE_BOARD: svg(
    <>
      <rect x="3" y="4" width="18" height="15" rx="1.5" />
      <path d="M7 9l5 4 5-5" />
      <circle cx="7" cy="9" r="1" fill="currentColor" />
      <circle cx="17" cy="8" r="1" fill="currentColor" />
    </>,
  ),
  // ID card.
  SUBJECT_PROFILE: svg(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="2.2" />
      <path d="M5.8 16.2c.7-1.5 1.9-2.2 3.2-2.2s2.5.7 3.2 2.2M15 10h3M15 13.5h3" />
    </>,
  ),
  // Floppy disk.
  DIGITAL_ARCHIVE: svg(
    <>
      <path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M8 4v5h7V4M8 20v-6h8v6" />
    </>,
  ),
  // Enamel pin: the merch locker.
  MERCH: svg(
    <>
      <circle cx="12" cy="11" r="6.5" />
      <path d="M12 7.5l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" />
      <path d="M12 17.5V21" />
    </>,
  ),
  // Palette.
  GRAPHIC_DESIGN: svg(
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.6-1.1-2.7 0-.9.7-1.6 1.7-1.6H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" />
      <circle cx="10" cy="7" r="1" fill="currentColor" />
      <circle cx="14.5" cy="7" r="1" fill="currentColor" />
    </>,
  ),
};

/**
 * The page's scrollbar, replaced: a rail on the right with the story's
 * progress, a knob that rides it showing where you are (and lights up while
 * you scroll), and an icon marker per scene. Hover the rail to see every
 * scene's name; click one (or Tab to it and press Enter) to travel straight
 * there. Scroll position is written to CSS variables and text directly, so
 * scrolling never re-renders React.
 */
export function SceneNav() {
  const chapter = useExperienceStore((s) => s.currentChapter);
  const focused = useExperienceStore((s) => s.screenFocused);
  const reduced = useExperienceStore((s) => s.reducedMotion);
  const rail = useRef<HTMLElement>(null);
  const percent = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    let idle = 0;
    const update = () => {
      frame = 0;
      const el = rail.current;
      if (!el) return;
      const start = scrollForProgress(0);
      const end = scrollForProgress(1);
      const p = Math.min(
        1,
        Math.max(0, end > start ? (window.scrollY - start) / (end - start) : 0),
      );
      el.style.setProperty("--progress", String(p));
      el.dataset.start = String(p < 0.005);
      if (percent.current) percent.current.textContent = `${Math.round(p * 100)}%`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      // Lit while moving; settles shortly after the scroll stops.
      rail.current?.setAttribute("data-scrolling", "true");
      window.clearTimeout(idle);
      idle = window.setTimeout(() => rail.current?.setAttribute("data-scrolling", "false"), 700);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <nav
      ref={rail}
      className={styles.rail}
      aria-label="Scenes"
      data-hidden={focused}
      data-scrolling="false"
      data-start="true"
    >
      {/* How far through the story, above the rail. */}
      <span ref={percent} className={styles.percent} aria-hidden>
        0%
      </span>
      <div className={styles.track} aria-hidden>
        <div className={styles.fill} />
      </div>

      {/* Where you are now, riding the rail. */}
      <div className={styles.knob} aria-hidden>
        <span className={styles.knobDot} />
      </div>

      <ol className={styles.list}>
        {CHECKPOINTS.map((c) => {
          const active = c.id === chapter;
          return (
            <li
              key={c.id}
              className={styles.item}
              style={{ top: `${checkpointProgress(c, reduced) * 100}%` }}
            >
              <button
                type="button"
                className={styles.marker}
                data-active={active}
                aria-current={active ? "step" : undefined}
                aria-label={`Go to ${c.label}`}
                tabIndex={focused ? -1 : 0}
                onClick={() => goToCheckpoint(c)}
              >
                <span className={styles.label}>{c.label}</span>
                <span className={styles.icon}>{ICONS[c.id as ChapterId]}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* First-visit hint, until the story starts moving. */}
      <span className={styles.hint} aria-hidden>
        Scroll
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M12 5v14M7 14l5 5 5-5" />
        </svg>
      </span>
    </nav>
  );
}
