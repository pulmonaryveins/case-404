import { useState } from "react";
import { CanvasErrorBoundary } from "../components/common/CanvasErrorBoundary";
import { ExperienceCanvas } from "./canvas/ExperienceCanvas";
import { LoadingOverlay } from "./LoadingOverlay";
import { ScreenFocusControls } from "./ScreenFocusControls";
import { SceneNav } from "./SceneNav";
import { CustomCursor } from "./cursor/CustomCursor";
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
      <ScreenFocusControls />
      {/* No scroll rail until the scene is on screen. */}
      <SceneNav hidden={!ready} />
      <CustomCursor />
      <LoadingOverlay done={ready} />
    </div>
  );
}
