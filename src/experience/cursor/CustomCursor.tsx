import { useEffect, useRef, useState, type ReactNode } from "react";
import { useExperienceStore } from "../../store/useExperienceStore";
import { useCursor, type CursorKind } from "./cursorStore";
import styles from "./CustomCursor.module.css";

const svg = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

/** One small line icon per kind of interaction. */
const ICONS: Record<Exclude<CursorKind, "default">, ReactNode> = {
  // Magnifier: look closer.
  inspect: svg(
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5M10.5 8v5M8 10.5h5" />
    </>,
  ),
  // Power symbol: lamp switch.
  switch: svg(<path d="M12 3v8M7.1 6.3a7 7 0 1 0 9.8 0" />),
  // Arrow into a slot: insert a disk.
  insert: svg(<path d="M12 4v10M8 10l4 4 4-4M5 19h14" />),
  // Eject: triangle over a bar.
  eject: svg(<path d="M12 6l6 7H6l6-7zM6 18h12" />),
  // Generic: a filled dot ring, for page buttons.
  select: svg(<circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />),
};

const finePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * The site's cursor: a small dot with a trailing ring. Over anything that can
 * be clicked, the ring opens round an icon of what the click will do, with a
 * short label. Mouse/trackpad only; touch devices keep the system behaviour.
 */
export function CustomCursor() {
  const [enabled] = useState(finePointer);
  const kind = useCursor((s) => s.kind);
  const label = useCursor((s) => s.label);
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  // An HTML control (Back button etc.) under the pointer.
  const [overControl, setOverControl] = useState(false);

  // The scene moves under a still pointer when the story scrolls or a
  // close-up opens; drop a hover label that no longer matches anything.
  useEffect(
    () =>
      useExperienceStore.subscribe((s, prev) => {
        if (s.currentChapter !== prev.currentChapter || s.screenFocused !== prev.screenFocused)
          useCursor.getState().clear();
      }),
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-custom-cursor");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const at = { x: -100, y: -100 };
    const trail = { x: -100, y: -100 };
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      at.x = e.clientX;
      at.y = e.clientY;
      root.current?.setAttribute("data-hidden", "false");
      const control = (e.target as Element | null)?.closest?.(
        "button:not(:disabled), a[href], [role='button'], input, select, textarea",
      );
      setOverControl(!!control);
    };
    const onDown = () => root.current?.setAttribute("data-pressed", "true");
    const onUp = () => root.current?.setAttribute("data-pressed", "false");
    const onLeave = () => root.current?.setAttribute("data-hidden", "true");

    const tick = () => {
      // The ring trails the dot slightly; with reduced motion it simply follows.
      const k = reduced ? 1 : 0.22;
      trail.x += (at.x - trail.x) * k;
      trail.y += (at.y - trail.y) * k;
      if (dot.current) dot.current.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;
  const shown: CursorKind = kind !== "default" ? kind : overControl ? "select" : "default";
  const active = shown !== "default";

  return (
    <div ref={root} className={styles.cursor} data-active={active} aria-hidden>
      <div ref={ring} className={styles.ring}>
        <span className={styles.icon}>{active && ICONS[shown]}</span>
        {active && label && kind !== "default" && <span className={styles.label}>{label}</span>}
      </div>
      <div ref={dot} className={styles.dot} />
    </div>
  );
}
