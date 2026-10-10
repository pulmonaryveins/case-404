import { useState } from "react";
import { CanvasErrorBoundary } from "../components/common/CanvasErrorBoundary";
import { ExperienceCanvas } from "./canvas/ExperienceCanvas";
import { ArchivePicker } from "./ArchivePicker";
import { LoadingOverlay } from "./LoadingOverlay";
import styles from "./Experience.module.css";

/**
 * Boundary between the React application and the R3F experience. The
 * canvas is fixed behind the page; the page itself scrolls (StoryController).
 */
export function Experience() {
  const [ready, setReady] = useState(false);
  return (
    <div className={styles.stage}>
      <CanvasErrorBoundary>
        <ExperienceCanvas
          onReady={() => {
            performance.mark("scene-ready");
            setReady(true);
          }}
        />
      </CanvasErrorBoundary>
      <ArchivePicker />
      <LoadingOverlay done={ready} />
    </div>
  );
}
