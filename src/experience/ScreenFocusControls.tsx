import { useEffect } from "react";
import { useExperienceStore } from "../store/useExperienceStore";
import styles from "./ScreenFocusControls.module.css";

/** Way back out of a close-up (terminal, photo, dossier page): a button, and Escape. */
export function ScreenFocusControls() {
  const focused = useExperienceStore((s) => s.screenFocused);
  const setFocused = useExperienceStore((s) => s.setScreenFocused);

  // A close-up belongs to its chapter; never carry it into the next one.
  useEffect(
    () =>
      useExperienceStore.subscribe((s, prev) => {
        if (s.currentChapter !== prev.currentChapter && s.screenFocused) setFocused(false);
      }),
    [setFocused],
  );

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused, setFocused]);

  return (
    <button
      type="button"
      className={styles.back}
      data-visible={focused}
      tabIndex={focused ? 0 : -1}
      onClick={() => setFocused(false)}
    >
      Back to desk (Esc)
    </button>
  );
}
