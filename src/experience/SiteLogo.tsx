import { useExperienceStore } from "../store/useExperienceStore";
import { CHECKPOINTS, goToCheckpoint } from "../story/storyNav";
import styles from "./SiteLogo.module.css";

/**
 * The site's mark, top left: the detective silhouette (public/logo-mark.png)
 * and the case number. Clicking it glides back to the opening shot. It gives
 * the corner up to the close-up's way back out (ScreenFocusControls).
 */
export function SiteLogo({ hidden }: { hidden: boolean }) {
  const focused = useExperienceStore((s) => s.screenFocused);
  const away = hidden || focused;
  return (
    <button
      type="button"
      className={styles.logo}
      data-hidden={away}
      tabIndex={away ? -1 : 0}
      aria-hidden={away}
      aria-label="Case 404: back to the start"
      onClick={() => goToCheckpoint(CHECKPOINTS[0])}
    >
      <span className={styles.mark} aria-hidden />
      <span className={styles.word} aria-hidden>
        <span className={styles.title}>Case 404</span>
        <span className={styles.sub}>Identity not found</span>
      </span>
    </button>
  );
}
