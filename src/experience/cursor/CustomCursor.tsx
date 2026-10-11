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
  // Magnifier with a minus: back out of a close-up.
  zoomOut: svg(
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5M8 10.5h5" />
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
  const photoFocused = useExperienceStore((s) => s.screenFocused && s.focusKind === "photo");
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
    let lastTarget: EventTarget | null = null;
    let lastScene = 0;

    // The ring trails the dot. The loop runs only while it is catching up,
    // so a still pointer costs nothing (a permanent loop competes with the
    // WebGL frame on a laptop).
    const tick = () => {
      const k = reduced ? 1 : 0.28;
      trail.x += (at.x - trail.x) * k;
      trail.y += (at.y - trail.y) * k;
      if (ring.current) ring.current.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0)`;
      frame =
        Math.abs(at.x - trail.x) + Math.abs(at.y - trail.y) > 0.3 ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e: PointerEvent) => {
      at.x = e.clientX;
      at.y = e.clientY;
      // The dot follows the pointer immediately, not a frame later.
      if (dot.current) dot.current.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
      if (!frame) frame = requestAnimationFrame(tick);
      if (e.target !== lastTarget) {
        lastTarget = e.target;
        root.current?.setAttribute("data-hidden", "false");
        const control = (e.target as Element | null)?.closest?.(
          "button:not(:disabled), a[href], [role='button'], input, select, textarea",
        );
        setOverControl(!!control);
      }
    };
    const onDown = () => root.current?.setAttribute("data-pressed", "true");
    const onUp = () => root.current?.setAttribute("data-pressed", "false");
    const onLeave = () => root.current?.setAttribute("data-hidden", "true");

    // Every pointer move over the canvas makes the scene raycast against its
    // meshes to find hover targets, many times per frame. A laptop cannot
    // afford that; ~20 hover checks a second is plenty for labels. Clicks are
    // untouched. Registered after (so run after) the cursor's own capture
    // listener on window, which still sees every move.
    const throttleScene = (e: PointerEvent) => {
      if (!(e.target instanceof HTMLCanvasElement)) return;
      const now = performance.now();
      if (now - lastScene < 48) e.stopPropagation();
      else lastScene = now;
    };

    window.addEventListener("pointermove", onMove, { passive: true, capture: true });
    document.addEventListener("pointermove", throttleScene, { capture: true });
    window.addEventListener("pointerdown", onDown, { capture: true });
    window.addEventListener("pointerup", onUp, { capture: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove, { capture: true });
      document.removeEventListener("pointermove", throttleScene, { capture: true });
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("pointerup", onUp, { capture: true });
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;
  // In a photo close-up every click zooms back out; say so.
  const shown: CursorKind =
    kind !== "default" ? kind : overControl ? "select" : photoFocused ? "zoomOut" : "default";
  const active = shown !== "default";

  return (
    <div ref={root} className={styles.cursor} data-active={active} aria-hidden>
      <div ref={ring} className={styles.ring}>
        <span className={styles.shape} />
        <span className={styles.icon}>{active && ICONS[shown]}</span>
        {active &&
          (label || shown === "zoomOut") &&
          (kind !== "default" || shown === "zoomOut") && (
            <span className={styles.label}>{shown === "zoomOut" ? "Zoom out" : label}</span>
          )}
      </div>
      <div ref={dot} className={styles.dot} />
    </div>
  );
}
