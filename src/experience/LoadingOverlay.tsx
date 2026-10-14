import { useState } from "react";
import { useProgress } from "@react-three/drei";
import styles from "./LoadingOverlay.module.css";

/** What the office is doing, by how far the load has got. */
const STEPS: [number, string][] = [
  [0, "Unlocking the office"],
  [15, "Dusting for prints"],
  [35, "Pinning the evidence"],
  [55, "Developing the photographs"],
  [75, "Booting the archive terminal"],
  [90, "Switching on the lamps"],
];

/**
 * Covers the canvas until the scene has actually drawn (`done`), then fades
 * out. Kept as plain as the rest of the interface: the file's name, and a
 * progress line drawn like the scene rail on the right (thin track, tungsten
 * fill, a small knob riding it), with what is loading and how far it is.
 * useProgress is not monotonic (it hits 100% between batches), so the line
 * only ever moves forward.
 */
export function LoadingOverlay({ done }: { done: boolean }) {
  const { progress } = useProgress();
  const [shown, setShown] = useState(0);
  if (progress > shown) setShown(progress);

  // Download progress fills 0-90%; the last 10% is the shader compile.
  const pct = done ? 100 : Math.min(99, Math.floor(shown * 0.9));
  const step = done ? "Case opened" : STEPS.filter(([from]) => pct >= from).at(-1)![1];

  return (
    <div
      className={styles.loader}
      data-done={done}
      aria-hidden={done}
      role="status"
      style={{ "--progress": pct / 100 } as React.CSSProperties}
    >
      <div className={styles.panel}>
        <span className={styles.name}>Case 404</span>
        <div className={styles.track} aria-hidden>
          <span className={styles.fill} />
          <span className={styles.knob} />
        </div>
        <p className={styles.status}>
          <span>{step}</span>
          <span className={styles.percent}>{pct}%</span>
        </p>
      </div>
    </div>
  );
}
