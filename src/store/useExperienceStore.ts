import { create } from "zustand";
import type { ChapterId } from "../story/storyTypes";

/**
 * Application-level experience state only.
 *
 * High-frequency values (camera transforms, scroll progress, per-frame
 * animation state) must NOT live here — they belong in refs, GSAP, or
 * R3F/Three.js transforms so they don't trigger React-wide rerenders.
 */
interface ExperienceState {
  currentChapter: ChapterId;
  activeExperienceId: string | null;
  activeProjectId: string | null;
  activeProjectCategory: string | null;
  reducedMotion: boolean;
  isExperienceReady: boolean;
  /** The archive terminal has finished booting; its disks can be used. */
  archiveOnline: boolean;
  setCurrentChapter: (chapter: ChapterId) => void;
  setActiveExperienceId: (id: string | null) => void;
  setActiveProjectId: (id: string | null) => void;
  setActiveProjectCategory: (category: string | null) => void;
  setReducedMotion: (value: boolean) => void;
  setExperienceReady: (value: boolean) => void;
  setArchiveOnline: (value: boolean) => void;
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  currentChapter: "CASE_OPENED",
  activeExperienceId: null,
  activeProjectId: null,
  activeProjectCategory: null,
  reducedMotion: false,
  isExperienceReady: false,
  archiveOnline: false,
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),
  setActiveExperienceId: (id) => set({ activeExperienceId: id }),
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setActiveProjectCategory: (category) => set({ activeProjectCategory: category }),
  setReducedMotion: (value) => set({ reducedMotion: value }),
  setExperienceReady: (value) => set({ isExperienceReady: value }),
  setArchiveOnline: (value) => set({ archiveOnline: value }),
}));
