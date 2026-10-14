import { create } from "zustand";

/**
 * Which design print is in the close-up (DesignPosters), and whether it has
 * been turned over to read its back (PosterFlipControl turns it).
 */
interface DesignInspectState {
  inspected: string | null;
  flipped: boolean;
  inspect: (file: string) => void;
  flip: () => void;
  clear: () => void;
}

export const useDesignInspect = create<DesignInspectState>((set) => ({
  inspected: null,
  flipped: false,
  inspect: (file) => set({ inspected: file, flipped: false }),
  flip: () => set((s) => ({ flipped: !s.flipped })),
  clear: () => set({ inspected: null, flipped: false }),
}));
