import { useEffect, useMemo, useRef, useState } from "react";
import { profile } from "../../data/profile";
import { useExperienceStore } from "../../store/useExperienceStore";
import { storyNav } from "../../story/storyNav";
import { paintResume } from "../surfaces/paintResume";
import { downloadResume } from "./resumeFile";
import { useResume } from "./resumeState";
import styles from "./ResumeOverlay.module.css";

/** The stamped download button: shows it is working while the PDF is made. */
function DownloadButton({ focusOnMount = false }: { focusOnMount?: boolean }) {
  const [saving, setSaving] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focusOnMount) button.current?.focus();
  }, [focusOnMount]);
  const save = async () => {
    setSaving(true);
    try {
      await downloadResume();
    } finally {
      setSaving(false);
    }
  };
  return (
    <button ref={button} className={styles.stamp} onClick={save} disabled={saving}>
      {saving ? "Preparing…" : "Download PDF"}
    </button>
  );
}

/**
 * The typed resume's controls. While the camera is in close on the printed
 * page: a bar to download it or read it full size. Full size: the page over
 * the scene, scrolling, with the download stamp; Esc, Close or a click on the
 * backdrop puts it back (the close-up stays). The story is held while open.
 */
export function ResumeOverlay() {
  const open = useResume((s) => s.open);
  const focused = useResume((s) => s.focused);
  const inClose = useExperienceStore((s) => s.screenFocused);
  const close = () => useResume.getState().setOpen(false);

  // Painted once, the first time it is opened, at screen-reading resolution.
  const preview = useMemo(
    () => (open ? paintResume(1760).toDataURL("image/jpeg", 0.92) : null),
    [open],
  );

  useEffect(() => {
    if (!open) return;
    storyNav.lenis?.stop();
    // Ahead of the close-up's own Esc (which would zoom out as well).
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (!useExperienceStore.getState().screenFocused) storyNav.lenis?.start();
    };
  }, [open]);

  if (open && preview)
    return (
      <div
        className={styles.backdrop}
        role="dialog"
        aria-modal="true"
        aria-label="Resume"
        onClick={(e) => e.target === e.currentTarget && close()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* data-lenis-prevent: the page scrolls natively, not the story behind it. */}
        <div className={styles.sheet} data-lenis-prevent>
          <img
            className={styles.page}
            src={preview}
            alt={`Resume of ${profile.name.join(" ")}: ${profile.roles.join(", ")}, ${profile.location}.`}
          />
        </div>
        <div className={styles.actions}>
          <DownloadButton focusOnMount />
          <button className={styles.close} onClick={close}>
            Close (Esc)
          </button>
        </div>
      </div>
    );

  if (focused && inClose)
    return (
      <div className={styles.bar}>
        <DownloadButton />
        <button className={styles.close} onClick={() => useResume.getState().setOpen(true)}>
          Read full page
        </button>
      </div>
    );
  return null;
}
