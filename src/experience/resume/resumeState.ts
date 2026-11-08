import { create } from "zustand";
import { useExperienceStore } from "../../store/useExperienceStore";

/**
 * The typewriter's resume: `printed` once it has fed all the way out (it then
 * stays printed), `focused` while the camera is in close on it, `open` while
 * it is shown full size (ResumeOverlay).
 */
export const useResume = create<{
  printed: boolean;
  focused: boolean;
  open: boolean;
  setPrinted: () => void;
  setFocused: (focused: boolean) => void;
  setOpen: (open: boolean) => void;
}>((set) => ({
  printed: false,
  focused: false,
  open: false,
  setPrinted: () => set({ printed: true }),
  setFocused: (focused) => set({ focused }),
  setOpen: (open) => set({ open }),
}));

// Leaving the close-up (a click, Esc, Back, the story moving on) leaves the resume.
useExperienceStore.subscribe((s, prev) => {
  if (prev.screenFocused && !s.screenFocused && useResume.getState().focused)
    useResume.getState().setFocused(false);
});
