import { CanvasErrorBoundary } from "../components/common/CanvasErrorBoundary";
import { ExperienceCanvas } from "./canvas/ExperienceCanvas";

/**
 * Boundary between the React application and the R3F experience.
 */
export function Experience() {
  return (
    <CanvasErrorBoundary>
      <ExperienceCanvas />
    </CanvasErrorBoundary>
  );
}
