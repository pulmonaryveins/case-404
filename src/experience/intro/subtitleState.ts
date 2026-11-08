import { create } from "zustand";

/**
 * Whether subtitles show, remembered for the next visit. Storage can be
 * missing or blocked (private windows, previews): subtitles are then simply on.
 */
const KEY = "case404.subtitles";

function stored() {
  try {
    return window.localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

interface SubtitleState {
  enabled: boolean;
  toggle: () => void;
}

export const useSubtitles = create<SubtitleState>((set, get) => ({
  enabled: stored(),
  toggle: () => {
    const enabled = !get().enabled;
    try {
      window.localStorage.setItem(KEY, enabled ? "on" : "off");
    } catch {
      // Not remembered; it still applies for this visit.
    }
    set({ enabled });
  },
}));
