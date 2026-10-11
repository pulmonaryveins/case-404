import { useEffect } from "react";
import { chapters } from "../../story/chapters";
import { useExperienceStore } from "../../store/useExperienceStore";
import type { ChapterId } from "../../story/storyTypes";
import { lampOn, type LampId } from "./lampState";

/** The chapter at which each desk lamp's turn comes (it stays on after). */
const TURN: Record<Exclude<LampId, "wall">, ChapterId> = {
  main: "SUBJECT_PROFILE",
  archive: "DIGITAL_ARCHIVE",
};

const orderOf = (id: ChapterId) => chapters.find((c) => c.id === id)?.order ?? 0;

/**
 * Sets which lamps are lit for the chapter the story is in: the wall light
 * over the board is on from the start; the main desk lamp comes on when the
 * camera reaches the desk and the dossier (SUBJECT_PROFILE); the archive lamp
 * when it reaches the computer desk (DIGITAL_ARCHIVE). Once a lamp's turn has
 * come it stays on; scrolling back before its chapter puts it out again.
 */
export function LampStory() {
  useEffect(() => {
    const apply = (chapter: ChapterId) => {
      const at = orderOf(chapter);
      for (const id of Object.keys(TURN) as (keyof typeof TURN)[]) {
        lampOn[id] = at >= orderOf(TURN[id]);
      }
    };
    apply(useExperienceStore.getState().currentChapter);
    return useExperienceStore.subscribe((s, prev) => {
      if (s.currentChapter !== prev.currentChapter) apply(s.currentChapter);
    });
  }, []);
  return null;
}
