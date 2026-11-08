import { get, hiss, tone, type Engine } from "./computerAudio";

/**
 * The typewriter printing the resume, one typed line per line of paper fed:
 * keys struck in word-sized bursts (each a sharp type bar on the platen, the
 * body's knock and the escapement's tick as the carriage steps), the space
 * bar's duller knock between words, the bell on the longer lines, then the
 * return: the lever's line-feed ratchet, the carriage sliding back and
 * banging to a stop, as the paper moves. Made from the terminal's sound
 * engine; silent unless sound is already running (it plays as the camera
 * arrives, with no click behind it, and must not queue up for the next one).
 */

/** Share of a line's time spent typing; the rest is the return (ResumePrint feeds the paper then). */
export const TYPING_SHARE = 0.68;
/** Chance a line runs long enough to ring the bell near the margin. */
const BELL_CHANCE = 0.35;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** A key: the type bar's slug striking the platen, the frame's knock, the escapement. */
function strike(e: Engine, t: number, peak: number) {
  hiss(e, t, 0.018, "bandpass", rand(2600, 3600), 1800, 1.4, peak, 0.001);
  tone(e, t, "triangle", rand(1150, 1400), 700, 0.012, peak * 0.22);
  tone(e, t + 0.002, "sine", rand(170, 210), 90, 0.05, peak * 0.55);
  hiss(e, t + rand(0.028, 0.04), 0.01, "highpass", 5200, 5200, 0.8, peak * 0.28, 0.001);
}

/** The space bar: no type bar, just the escapement and a soft knock. */
function space(e: Engine, t: number, peak: number) {
  tone(e, t, "sine", 150, 80, 0.04, peak * 0.4);
  hiss(e, t + 0.012, 0.01, "highpass", 5000, 5000, 0.8, peak * 0.3, 0.001);
}

/** The margin bell: a small struck bell, two inharmonic partials ringing out. */
function bell(e: Engine, t: number) {
  tone(e, t, "sine", 2180, 2170, 0.9, 0.22);
  tone(e, t, "sine", 5480, 5460, 0.35, 0.06);
}

/**
 * The return over `dur`: the lever's ratchet turning the platen a line (a few
 * fast ticks), the carriage sliding back and banging on its stop.
 */
function carriageReturn(e: Engine, t: number, dur: number, level = 1) {
  for (let i = 0; i < 3; i++)
    hiss(e, t + i * 0.022, 0.012, "bandpass", 3000, 2400, 2.5, 0.22 * level, 0.001);
  hiss(e, t + 0.05, dur * 0.7, "bandpass", 1400, 650, 1.2, 0.09 * level, 0.02);
  const stop = t + 0.05 + dur * 0.7;
  tone(e, stop, "sine", 140, 60, 0.12, 0.55 * level);
  hiss(e, stop, 0.05, "bandpass", 1800, 900, 1.5, 0.3 * level, 0.001);
}

/** How loud the briefing subtitles type, next to the printing machine. */
const SUBTITLE_LEVEL = 0.55;

export const typewriterAudio = {
  /** One line over `seconds`: typing, sometimes the bell, then the return. */
  line(seconds: number) {
    const e = get(false);
    if (!e) return;
    const t0 = e.ctx.currentTime + 0.01;
    const typing = seconds * TYPING_SHARE;
    // Keys in bursts of a word, a space between, a slight hesitation now and then.
    let t = t0;
    let left = Math.floor(rand(3, 7));
    // ~14 keys a second: a quick typist, not a machine gun.
    const gap = typing / 6;
    while (t < t0 + typing - gap * 0.5) {
      if (left === 0) {
        space(e, t, rand(0.5, 0.7));
        left = Math.floor(rand(2, 7));
        t += gap * rand(0.9, 1.4);
        continue;
      }
      strike(e, t, rand(0.55, 0.85));
      left--;
      t += gap * rand(0.6, 1.1);
    }
    const end = t0 + typing;
    if (Math.random() < BELL_CHANCE) bell(e, end - gap * 2);
    carriageReturn(e, end, seconds - typing);
  },

  /**
   * Readies the sound engine for the briefing. Browsers only let a page make
   * sound after the visitor interacts: this tries at once (allowed for some
   * returning visitors) and again on the first click, key or tap; until then
   * the keys type silently rather than queueing up.
   */
  prime() {
    get();
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const once = () => {
      get();
      for (const name of events) window.removeEventListener(name, once);
    };
    for (const name of events) window.addEventListener(name, once);
  },

  /** One character of the briefing subtitles: a key struck, or the space bar. */
  key(char: string) {
    const e = get(false);
    if (!e) return;
    const t = e.ctx.currentTime + 0.005;
    if (char === " ") space(e, t, rand(0.5, 0.65) * SUBTITLE_LEVEL);
    else strike(e, t, rand(0.55, 0.8) * SUBTITLE_LEVEL);
  },

  /** A briefing line finished: the return, and on the last line the bell first. */
  lineEnd(lastLine = false) {
    const e = get(false);
    if (!e) return;
    const t = e.ctx.currentTime + 0.01;
    if (lastLine) bell(e, t);
    carriageReturn(e, t + (lastLine ? 0.35 : 0), 0.3, SUBTITLE_LEVEL);
  },
};
