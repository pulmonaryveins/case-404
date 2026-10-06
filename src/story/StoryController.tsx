import { useEffect } from "react";
import { useExperienceStore } from "../store/useExperienceStore";

/**
 * Future owner of: scroll progression, chapter activation, camera state
 * transitions, scene state, and content reveals.
 *
 * Phase 0: marks the experience ready. No ScrollTrigger timeline yet.
 */
export function StoryController() {
  const setExperienceReady = useExperienceStore((state) => state.setExperienceReady);

  useEffect(() => {
    setExperienceReady(true);
  }, [setExperienceReady]);

  return null;
}
