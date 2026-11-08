import { create } from "zustand";

/** Which design print is in the close-up (DesignPosters). */
interface DesignInspectState {
  inspected: string | null;
  inspect: (file: string) => void;
  clear: () => void;
}

export const useDesignInspect = create<DesignInspectState>((set) => ({
  inspected: null,
  inspect: (file) => set({ inspected: file }),
  clear: () => set({ inspected: null }),
}));
