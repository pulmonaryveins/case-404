import { useEffect } from "react";
import { useExperienceStore } from "../store/useExperienceStore";
import { useDesignInspect } from "./environment/designInspectState";
import styles from "./PosterFlipControl.module.css";

/**
 * In the close-up of a design print (DesignPosters): turn it over to read the
 * pencilled notes on its back, and back again. A button, or the F key.
 */
export function PosterFlipControl() {
  const inspected = useDesignInspect((s) => s.inspected);
  const flipped = useDesignInspect((s) => s.flipped);
  const flip = useDesignInspect((s) => s.flip);
  const focused = useExperienceStore((s) => s.screenFocused);
  const visible = focused && inspected !== null;

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") flip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, flip]);

  return (
    <button
      type="button"
      className={styles.flip}
      data-visible={visible}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={flip}
    >
      <span className={styles.icon} aria-hidden>
        ⟲
      </span>
      {flipped ? "Turn to the front" : "Turn over"}
      <kbd className={styles.key}>F</kbd>
    </button>
  );
}
