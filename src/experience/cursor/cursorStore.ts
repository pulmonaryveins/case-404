import { create } from "zustand";

/** What the pointer is over, so the cursor can show what a click will do. */
export type CursorKind = "default" | "inspect" | "switch" | "insert" | "eject" | "select";

interface CursorState {
  kind: CursorKind;
  label: string | null;
  set: (kind: CursorKind, label?: string | null) => void;
  clear: () => void;
}

/**
 * Scene objects report hover here instead of touching document.body's cursor;
 * CustomCursor renders it. A tiny store of its own: it changes on every
 * hover, and nothing else in the app should re-render for that.
 */
export const useCursor = create<CursorState>((set) => ({
  kind: "default",
  label: null,
  set: (kind, label = null) => set({ kind, label }),
  clear: () => set({ kind: "default", label: null }),
}));

/** Pointer handlers for a hoverable scene object; `enabled` is read at event time. */
export function hoverCursor(kind: CursorKind, label: string, enabled: () => boolean = () => true) {
  return {
    onPointerOver: (e: { stopPropagation: () => void }) => {
      if (!enabled()) return;
      e.stopPropagation();
      useCursor.getState().set(kind, label);
    },
    onPointerOut: () => useCursor.getState().clear(),
  };
}
