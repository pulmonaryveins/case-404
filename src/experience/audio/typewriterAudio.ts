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

/** Struck metal: full level at once, ringing away at `f` over `decay`. */
function ring(e: Engine, t: number, f: number, decay: number, peak: number) {
  const o = e.ctx.createOscillator();
  o.frequency.value = f;
  const g = e.ctx.createGain();
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  o.connect(g).connect(e.bus);
  o.start(t);
  o.stop(t + decay + 0.01);
}

/** The carriage stepping on one space: the escapement's small, bright tick and rattle. */
function escapement(e: Engine, t: number, peak: number) {
  hiss(e, t, 0.008, "bandpass", 4200, 3400, 3, peak * 0.42, 0.0005);
  ring(e, t, rand(880, 1040), 0.02, peak * 0.12);
}

/**
 * A key, in the order the machine makes it: the key going down, the slug
 * cracking onto the platen, the type bar and frame ringing (inharmonic, and
 * pitched by `bar`: no two type bars are the same), the rubber platen's knock,
 * and the escapement a moment later.
 */
function strike(e: Engine, t: number, peak: number, bar = rand(0.93, 1.07)) {
  hiss(e, t, 0.012, "bandpass", 900, 700, 2, peak * 0.18, 0.001);
  const hit = t + 0.012;
  hiss(e, hit, 0.007, "highpass", 1500, 1500, 0.7, peak * 1.1, 0.0005);
  ring(e, hit, 1720 * bar, 0.045, peak * 0.26);
  ring(e, hit, 2870 * bar, 0.03, peak * 0.2);
  ring(e, hit, 4310 * bar, 0.018, peak * 0.13);
  tone(e, hit, "sine", 300, 120, 0.05, peak * 0.6);
  escapement(e, hit + rand(0.03, 0.045), peak);
}

/** The space bar: no type bar, only its soft knock and the escapement. */
function space(e: Engine, t: number, peak: number) {
  tone(e, t, "sine", 170, 90, 0.04, peak * 0.45);
  escapement(e, t + 0.016, peak * 0.85);
}

/** The shift key lifting the type basket: a heavy clunk just before a capital. */
function shift(e: Engine, t: number, peak: number) {
  tone(e, t, "sine", 190, 80, 0.07, peak * 0.5);
  hiss(e, t, 0.02, "bandpass", 700, 450, 1.5, peak * 0.3, 0.001);
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
  ring(e, stop, 1240, 0.09, 0.14 * level);
  ring(e, stop, 2210, 0.06, 0.09 * level);
}

/** How loud the briefing subtitles type, next to the printing machine. */
const SUBTITLE_LEVEL = 0.85;

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
    const peak = rand(0.6, 0.85) * SUBTITLE_LEVEL;
    if (char === " ") return space(e, t, peak);
    // Capitals need the shift held down, so the basket lifts first.
    const capital = /[A-Z]/.test(char);
    if (capital) shift(e, t, peak);
    // Each character keeps its own type bar's pitch, with a little play in it.
    const bar = 0.93 + (char.charCodeAt(0) % 13) * 0.0115 + rand(-0.006, 0.006);
    strike(e, t + (capital ? 0.03 : 0), peak, bar);
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
