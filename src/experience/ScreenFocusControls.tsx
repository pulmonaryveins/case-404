import { useEffect } from "react";
import { useExperienceStore } from "../store/useExperienceStore";
import styles from "./ScreenFocusControls.module.css";

/**
 * Way back out of a close-up (terminal, photo, dossier page): a button,
 * Escape, and, for a photo or page, a click anywhere. The terminal keeps
 * clicks for itself, so it needs the button or Escape.
 */
export function ScreenFocusControls() {
  const focused = useExperienceStore((s) => s.screenFocused);
  const focusKind = useExperienceStore((s) => s.focusKind);
  const setFocused = useExperienceStore((s) => s.setScreenFocused);

  useEffect(() => {
    if (!focused || focusKind !== "photo") return;
    // Ignore the click that opened the close-up (it may still be bubbling).
    const since = performance.now();
    const onClick = (e: MouseEvent) => {
      if (performance.now() - since < 250) return;
      if ((e.target as Element | null)?.closest?.("button, a[href]")) return;
      setFocused(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [focused, focusKind, setFocused]);

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
      {focused && focusKind === "photo"
        ? "Click anywhere or Esc to zoom out"
        : "Back to desk (Esc)"}
    </button>
  );
}
