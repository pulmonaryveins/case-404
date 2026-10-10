import { useExperienceStore } from "../../store/useExperienceStore";
import { storyRig } from "../../story/storyRig";

/** The dossier's prints and pages are close-up targets once it lies fully open. */
export const dossierReadable = () =>
  useExperienceStore.getState().currentChapter === "SUBJECT_PROFILE" &&
  storyRig.dossierOpen > 0.95;
