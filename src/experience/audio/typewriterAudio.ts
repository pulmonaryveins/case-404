import { click, get, hiss, thunk, tone } from "./computerAudio";

/**
 * The typewriter printing the resume: type bars striking, the bell near the
 * end of a line, the carriage thrown back. Made from the terminal's sound
 * engine; silent unless sound is already running (it plays as the camera
 * arrives, with no click behind it, and must not queue up for the next one).
 */
export const typewriterAudio = {
  /** One line: a run of strikes, the bell, the return. */
  line(seconds: number) {
    const e = get(false);
    if (!e) return;
    const t = e.ctx.currentTime + 0.01;
    const strikes = Math.max(4, Math.round(seconds * 11));
    for (let i = 0; i < strikes; i++) {
      const at = t + (i / strikes) * seconds * 0.78 + Math.random() * 0.02;
      hiss(e, at, 0.022, "bandpass", 1700 + Math.random() * 700, 1200, 2, 0.16);
      thunk(e, at, 0.12 + Math.random() * 0.06);
    }
    const end = t + seconds * 0.8;
    tone(e, end, "sine", 2093, 2093, 0.07, 0.6); // the bell
    hiss(e, end + 0.04, 0.22, "lowpass", 900, 300, 0.8, 0.12); // the carriage sliding back
    click(e, end + 0.27, 0.4); // and stopping
  },
};
