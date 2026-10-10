import { archiveProjects } from "../data/projects";
import { useExperienceStore } from "../store/useExperienceStore";
import styles from "./ArchivePicker.module.css";

const GROUPS = ["Development", "UI/UX", "Video Editing"] as const;

/**
 * Readable, keyboard-reachable twin of the floppy rack: the disk labels are
 * small in the 3D view, so the same choices sit here as buttons. Both drive
 * `activeProjectId`; the scene just reacts to the store.
 */
export function ArchivePicker() {
  const chapter = useExperienceStore((s) => s.currentChapter);
  const activeId = useExperienceStore((s) => s.activeProjectId);
  const online = useExperienceStore((s) => s.archiveOnline);
  const setActive = useExperienceStore((s) => s.setActiveProjectId);
  const visible = chapter === "DIGITAL_ARCHIVE";

  return (
    <nav className={styles.picker} data-visible={visible} aria-label="Project archive">
      {GROUPS.map((group) => (
        <div key={group} className={styles.group}>
          <span className={styles.heading}>{group === "UI/UX" ? "UI / UX" : group}</span>
          {archiveProjects
            .filter((p) => p.category === group)
            .map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.disk}
                aria-pressed={activeId === p.id}
                tabIndex={visible && online ? 0 : -1}
                disabled={!online}
                onClick={() => setActive(activeId === p.id ? null : p.id)}
              >
                {p.title}
              </button>
            ))}
        </div>
      ))}
    </nav>
  );
}
