import { CanvasErrorBoundary } from "../components/common/CanvasErrorBoundary";
import { ExperienceCanvas } from "./canvas/ExperienceCanvas";
import styles from "./Experience.module.css";

/**
 * Boundary between the React application and the R3F experience. The
 * canvas is fixed behind the page; the page itself scrolls (StoryController).
 */
export function Experience() {
  return (
    <div className={styles.stage}>
      <CanvasErrorBoundary>
        <ExperienceCanvas />
      </CanvasErrorBoundary>
    </div>
  );
}
