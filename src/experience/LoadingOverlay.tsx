import { useState } from "react";
import { useProgress } from "@react-three/drei";
import styles from "./LoadingOverlay.module.css";

/** What the office is doing, by how far the load has got. */
const STEPS: [number, string][] = [
  [0, "Unlocking the office"],
  [15, "Dusting the desk for prints"],
  [35, "Pinning evidence to the board"],
  [55, "Developing the photographs"],
  [75, "Booting the archive terminal"],
  [90, "Switching on the lamps"],
];

/**
 * Covers the canvas until the scene has actually drawn (`done`), then fades
 * out: the CASE 404 file under a desk lamp, with a red string running between
 * two pins as the evidence comes in. When the scene is ready, the file's cover
 * swings open on its spine and the lamplight swells as the screen fades
 * (LoadingOverlay.module.css). useProgress is not monotonic (it hits 100%
 * between batches), so the string only ever moves forward.
 */
export function LoadingOverlay({ done }: { done: boolean }) {
  const { progress } = useProgress();
  const [shown, setShown] = useState(0);
  if (progress > shown) setShown(progress);

  // Download progress fills 0-90%; the last 10% is the shader compile.
  const pct = done ? 100 : Math.min(99, Math.floor(shown * 0.9));
  const step = done ? "Case opened" : STEPS.filter(([from]) => pct >= from).at(-1)![1];

  return (
    <div className={styles.loader} data-done={done} aria-hidden={done} role="status">
      <div className={styles.glow} aria-hidden />
      <div className={styles.grain} aria-hidden />

      <article className={styles.file}>
        <span className={styles.tab}>404</span>
        <header className={styles.header}>
          <span className={styles.kicker}>Missing Persons Bureau</span>
          <h1 className={styles.title}>
            Case File <b>№ 404</b>
          </h1>
        </header>

        <dl className={styles.fields}>
          <div>
            <dt>Subject</dt>
            <dd>Unknown</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{done ? "Open" : "Under review"}</dd>
          </div>
        </dl>

        <div className={styles.string} aria-hidden>
          <i className={styles.pin} />
          <span className={styles.line}>
            <span style={{ transform: `scaleX(${pct / 100})` }} />
          </span>
          <i className={styles.pin} data-lit={pct >= 100} />
        </div>

        <p className={styles.status}>
          <span className={styles.step}>
            {step}
            <span className={styles.caret} aria-hidden>
              …
            </span>
          </span>
          <span className={styles.percent}>{String(pct).padStart(3, "0")}%</span>
        </p>
      </article>
    </div>
  );
}
