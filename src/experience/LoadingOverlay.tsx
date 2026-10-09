import { useState } from "react";
import { useProgress } from "@react-three/drei";
import styles from "./Experience.module.css";

/**
 * Covers the canvas until the scene has actually drawn (`done`), then fades
 * out. useProgress is not monotonic (it hits 100% between batches), so the
 * bar only ever moves forward.
 */
export function LoadingOverlay({ done }: { done: boolean }) {
  const { progress } = useProgress();
  const [shown, setShown] = useState(0);
  if (progress > shown) setShown(progress);

  // Download progress fills 0-90%; the last 10% is the shader compile.
  const pct = done ? 100 : Math.min(99, Math.floor(shown * 0.9));

  return (
    <div className={styles.loader} data-done={done} aria-hidden={done} role="status">
      <span>CASE 404</span>
      <strong className={styles.percent}>{pct}%</strong>
      <div className={styles.bar}>
        <i style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}
