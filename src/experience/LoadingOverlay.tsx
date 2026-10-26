import { useEffect, useRef } from "react";
import { loadProgress, overallProgress, type LoadState } from "./loading/loadProgress";
import styles from "./LoadingOverlay.module.css";

/** The stages the visitor sees, in order. Each is done when `done(state)` is true. */
const ROWS: {
  label: string;
  done: (s: LoadState) => boolean;
  detail: (s: LoadState) => string;
}[] = [
  {
    label: "Retrieving the evidence",
    done: (s) => s.files >= s.fileTotal,
    detail: (s) =>
      `${s.files}/${s.fileTotal} files · ${(s.bytes / 1e6).toFixed(1)}/${(s.total / 1e6).toFixed(1)} MB`,
  },
  {
    label: "Setting up the office",
    done: (s) => s.stage === "gpu" || s.stage === "ready",
    detail: () => "",
  },
  {
    label: "Switching on the lamps",
    done: (s) => s.stage === "ready",
    detail: (s) => (s.gpuTotal ? `${Math.round((s.gpuDone / s.gpuTotal) * 100)}%` : ""),
  },
];

/** Fraction of the remaining distance covered each frame, so the number glides rather than steps. */
const GLIDE = 0.1;

/**
 * Covers the canvas until the scene has actually drawn (`done`), then fades out.
 *
 * The percentage is the measured load (see loading/loadProgress): bytes received
 * over bytes expected, then the room being assembled, then the GPU being
 * prepared in its counted steps. This component only draws it: it reads the store
 * once a frame, glides the shown number toward the real one (never back, never
 * past it), and writes it straight to the DOM, so a download that streams
 * thousands of chunks does not re-render React.
 */
export function LoadingOverlay({ done }: { done: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const percentText = useRef<HTMLSpanElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const details = useRef<(HTMLSpanElement | null)[]>([]);
  const doneRef = useRef(done);
  useEffect(() => {
    doneRef.current = done;
  }, [done]);

  useEffect(() => {
    let shown = 0;
    let lastPercent = -1;
    let frame = 0;
    const tick = () => {
      const state = loadProgress.getState();
      const finished = doneRef.current;
      const target = finished ? 1 : Math.min(0.99, overallProgress(state));
      shown = finished
        ? shown + (1 - shown) * 0.35
        : Math.max(shown, Math.min(target, shown + (target - shown) * GLIDE + 0.0004));
      const full = finished && shown > 0.995;
      const percent = full ? 100 : Math.min(99, Math.floor(shown * 100));
      const el = root.current;
      if (el) {
        el.style.setProperty("--progress", String(full ? 1 : shown));
        if (percent !== lastPercent) {
          lastPercent = percent;
          if (percentText.current) percentText.current.textContent = String(percent);
          el.setAttribute("aria-valuenow", String(percent));
        }
        let active = -1;
        ROWS.forEach((row, i) => {
          const rowDone = finished || row.done(state);
          if (!rowDone && active < 0) active = i;
          const li = rows.current[i];
          if (li) li.dataset.state = rowDone ? "done" : i === active ? "active" : "pending";
          const detail = details.current[i];
          if (detail) detail.textContent = rowDone && i > 0 ? "" : row.detail(state);
        });
      }
      if (!full) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={root}
      className={styles.loader}
      data-done={done}
      aria-hidden={done}
      role="progressbar"
      aria-label="Loading the office"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
    >
      <div className={styles.glow} aria-hidden />
      <div className={styles.panel}>
        <p className={styles.heading}>
          <span className={styles.name}>Case 404</span>
          <span className={styles.file}>File 404-A</span>
        </p>

        <p className={styles.percent}>
          <span ref={percentText}>0</span>
          <span className={styles.sign}>%</span>
        </p>

        <div className={styles.track} aria-hidden>
          <span className={styles.fill} />
          <span className={styles.knob} />
        </div>

        <ul className={styles.steps}>
          {ROWS.map((row, i) => (
            <li
              key={row.label}
              ref={(el) => {
                rows.current[i] = el;
              }}
              data-state="pending"
            >
              <span className={styles.mark} aria-hidden />
              <span className={styles.label}>{row.label}</span>
              <span
                className={styles.detail}
                ref={(el) => {
                  details.current[i] = el;
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
