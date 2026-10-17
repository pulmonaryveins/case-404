/**
 * The archive terminal's disk sounds, synthesised with Web Audio (no sound
 * files): put a disk in, take it out.
 *
 *  - Insert: the disk is picked up (a small plastic tap), scrapes into the
 *    slot, and seats with a latch (thunk and click). The drive's motor then
 *    spins up and its head chatters over the disk for as long as the terminal
 *    "reads" it, and a soft ready blip ends it.
 *  - Eject: the button's click, the spring's pop and a metallic ring, the
 *    disk scraping back out as the motor winds down, a burst of static as the
 *    screen changes back to the menu, and the disk touching down in its tray.
 *
 * Timings follow the disk's own travel (FloppyDisk's INSERT_SECONDS, passed
 * in), so the sound lands when the disk does. Nothing is created until the
 * first call, which a click makes (browsers only allow sound after a gesture).
 */
const LEVEL = 0.9;

export interface Engine {
  ctx: AudioContext;
  bus: GainNode;
  noise: AudioBuffer;
}
let engine: Engine | null = null;

/**
 * The engine, made on first use. With `needsGesture` off (the terminal booting
 * by itself as the camera arrives, with no click behind it) it returns null
 * unless sound is already running: a suspended context would hold the sound
 * back and play it all at once on the next click.
 */
export function get(needsGesture = true): Engine | null {
  if (!needsGesture && engine?.ctx.state !== "running") return null;
  if (!engine) {
    const ctx = new AudioContext();
    const bus = ctx.createGain();
    bus.gain.value = LEVEL;
    // A limiter, so layered peaks never clip.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 6;
    limiter.ratio.value = 10;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.15;
    bus.connect(limiter).connect(ctx.destination);
    // A little room: a short decaying-noise reverb mixed under the dry sound,
    // so clicks and thunks sit in the space instead of sounding pasted on.
    const len = Math.floor(ctx.sampleRate * 0.45);
    const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = impulse.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const room = ctx.createConvolver();
    room.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.22;
    bus.connect(room).connect(wet).connect(limiter);
    // A second of white noise, played from random offsets for every hiss.
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    engine = { ctx, bus, noise };
  }
  void engine.ctx.resume();
  return engine;
}

/** The engine for a sound that always follows a click. */
export function engineNow(): Engine {
  return get()!;
}

/** A gain envelope: up to `peak` fast, then away over `decay`. */
function envelope(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

/** A pitched blip gliding from `f0` to `f1`. */
export function tone(
  e: Engine,
  t: number,
  type: OscillatorType,
  f0: number,
  f1: number,
  decay: number,
  peak: number,
) {
  const o = e.ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + decay);
  const g = e.ctx.createGain();
  envelope(g, t, peak, 0.004, decay);
  o.connect(g).connect(e.bus);
  o.start(t);
  o.stop(t + decay + 0.05);
}

/** A burst of filtered noise, its filter gliding from `f0` to `f1`. */
export function hiss(
  e: Engine,
  t: number,
  dur: number,
  type: BiquadFilterType,
  f0: number,
  f1: number,
  q: number,
  peak: number,
  attack = 0.005,
) {
  const s = e.ctx.createBufferSource();
  s.buffer = e.noise;
  s.loop = true;
  const f = e.ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  f.Q.value = q;
  const g = e.ctx.createGain();
  envelope(g, t, peak, attack, Math.max(0.005, dur - attack));
  s.connect(f).connect(g).connect(e.bus);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.05);
}

/** A small hard click: a switch, a latch. */
export const click = (e: Engine, t: number, peak = 0.5) => {
  hiss(e, t, 0.022, "highpass", 2500, 2500, 0.7, peak);
  tone(e, t, "square", 2200, 900, 0.016, peak * 0.22);
  tone(e, t + 0.012, "sine", 420, 260, 0.03, peak * 0.3); // the plastic's body
  hiss(e, t + 0.03, 0.03, "bandpass", 3600, 2800, 3, peak * 0.2); // and its rebound
};

/** A low thump: something heavy seating. */
export const thunk = (e: Engine, t: number, peak = 0.8) => {
  tone(e, t, "sine", 150, 50, 0.16, peak);
  hiss(e, t, 0.07, "lowpass", 600, 300, 0.7, peak * 0.6);
};

/** The drive's motor: a low hum that spins up, runs and winds down over `dur`. */
function motor(e: Engine, t: number, dur: number, peak: number) {
  const o = e.ctx.createOscillator();
  // A soft, steady whir (a triangle through a low-pass, not a buzzing saw),
  // with a little airy spindle noise over it.
  o.type = "triangle";
  o.frequency.setValueAtTime(40, t);
  o.frequency.exponentialRampToValueAtTime(84, t + 0.5);
  o.frequency.setValueAtTime(84, t + Math.max(0.5, dur - 0.4));
  o.frequency.exponentialRampToValueAtTime(46, t + dur);
  const f = e.ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 320;
  f.Q.value = 0.5;
  hiss(e, t, dur, "lowpass", 700, 700, 0.5, peak * 0.35, 0.25);
  const g = e.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.15);
  g.gain.setValueAtTime(peak, t + Math.max(0.15, dur - 0.3));
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(f).connect(g).connect(e.bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** The head stepping over the disk: short irregular buzzes and ticks. */
function seeks(e: Engine, t: number, dur: number, peak: number) {
  let at = t;
  while (at < t + dur) {
    // The stepper moves in short runs of ticks, then pauses to read.
    const steps = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < steps; i++) {
      const len = 0.018 + Math.random() * 0.03;
      // A soft "tk": a short low knock and a muffled tick, not a buzz.
      tone(e, at, "sine", 190 + Math.random() * 60, 110, len, peak * 0.8);
      hiss(e, at, len, "lowpass", 1500 + Math.random() * 600, 700, 0.7, peak * 0.6, 0.003);
      at += 0.05 + Math.random() * 0.03;
    }
    at += 0.18 + Math.random() * 0.3;
  }
}

/** The fan and power supply: a rushing whoosh and a mains hum, rising or falling over `dur`. */
function fan(e: Engine, t: number, dur: number, peak: number, rising: boolean) {
  const [a, b] = rising ? [0.0001, peak] : [peak, 0.0001];
  hiss(e, t, dur, "lowpass", rising ? 200 : 900, rising ? 900 : 200, 0.8, peak, dur * 0.4);
  const o = e.ctx.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(100, t);
  const f = e.ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 260;
  const g = e.ctx.createGain();
  g.gain.setValueAtTime(a * 0.5, t);
  g.gain.linearRampToValueAtTime(b * 0.5, t + dur * 0.5);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  o.connect(f).connect(g).connect(e.bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Screen static, in three ragged bursts. */
function staticBurst(e: Engine, t: number, dur: number, peak: number) {
  const parts = 3;
  for (let i = 0; i < parts; i++) {
    const at = t + (dur / parts) * i;
    hiss(e, at, (dur / parts) * 0.95, "highpass", 900, 1400, 0.5, peak * (i === 1 ? 1 : 0.7), 0.02);
  }
  tone(e, t + dur * 0.32, "sawtooth", 110, 70, 0.14, peak * 0.5);
}

export const computerAudio = {
  /**
   * A disk going in. `seconds` is how long it takes to travel into the drive
   * and `readSeconds` how long the terminal then reads it; `delay` waits
   * (to follow another disk coming out).
   */
  insert(seconds: number, readSeconds: number, delay = 0) {
    const e = engineNow();
    const t = e.ctx.currentTime + delay + 0.02;
    click(e, t + 0.05, 0.22); // picked up from the tray
    hiss(e, t + seconds * 0.7, seconds * 0.3, "bandpass", 1600, 700, 1.3, 0.2, 0.05); // slides in
    thunk(e, t + seconds, 0.7); // seats
    click(e, t + seconds + 0.03, 0.5); // latches
    motor(e, t + seconds + 0.05, readSeconds + 0.2, 0.22);
    seeks(e, t + seconds + 0.25, Math.max(0.2, readSeconds - 0.35), 0.12);
    tone(e, t + seconds + readSeconds + 0.05, "sine", 1040, 1030, 0.09, 0.12); // ready
  },

  /**
   * A disk coming out. `seconds` is the disk's travel time, as for `insert`.
   * `screen` adds the burst of static as the screen changes back to the menu
   * (left out when another disk is going straight in, and the screen does not).
   */
  eject(seconds: number, { delay = 0, screen = true } = {}) {
    const e = engineNow();
    const t = e.ctx.currentTime + delay + 0.02;
    click(e, t, 0.55); // the button
    thunk(e, t + 0.01, 0.35);
    tone(e, t + 0.04, "triangle", 700, 300, 0.09, 0.3); // the spring's pop
    hiss(e, t + 0.04, 0.08, "bandpass", 2200, 1500, 4, 0.2); // and its ring
    hiss(e, t + 0.08, seconds * 0.3, "bandpass", 800, 1600, 1.3, 0.18, 0.03); // slides out
    tone(e, t, "sawtooth", 55, 28, 0.45, 0.07); // the motor winds down
    if (screen) staticBurst(e, t + 0.05, 0.7, 0.12); // the screen changing
    tone(e, t + seconds * 0.95, "sine", 300, 180, 0.05, 0.2); // down in its tray
  },

  /**
   * The terminal switching on, over `seconds` (its boot): the power switch, a
   * degauss thump with the tube's buzz, the fan and supply spinning up, the
   * drive checking itself, a POST beep and a rising chime as the menu lands.
   * `pressed` is false when it boots by itself on the camera's arrival (no
   * click behind it): the switch is left out, and it is silent unless sound
   * is already running.
   */
  powerOn(seconds: number, pressed = true) {
    const e = pressed ? engineNow() : get(false);
    if (!e) return;
    const t = e.ctx.currentTime + 0.02;
    if (pressed) {
      click(e, t, 0.6);
      thunk(e, t + 0.01, 0.5);
    }
    // Degauss: a deep swell with the tube's mains buzz, fading over a second.
    tone(e, t + 0.12, "sine", 48, 38, 0.9, 0.5);
    tone(e, t + 0.12, "sawtooth", 120, 100, 0.7, 0.07);
    hiss(e, t + 0.12, 0.5, "bandpass", 1800, 600, 1.5, 0.14, 0.01);
    fan(e, t + 0.1, Math.min(seconds, 1.6), 0.08, true);
    // The tube's high whine fades in, faint, and is gone before the menu.
    const whine = e.ctx.createOscillator();
    whine.frequency.value = 7800;
    const wg = e.ctx.createGain();
    wg.gain.setValueAtTime(0.0001, t + 0.3);
    wg.gain.exponentialRampToValueAtTime(0.012, t + 1.1);
    wg.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(1.6, seconds * 0.5));
    whine.connect(wg).connect(e.bus);
    whine.start(t + 0.3);
    whine.stop(t + Math.max(1.6, seconds * 0.5) + 0.05);
    // The self-test.
    tone(e, t + seconds * 0.22, "sine", 880, 880, 0.16, 0.1); // POST beep
    motor(e, t + seconds * 0.3, seconds * 0.4, 0.14);
    seeks(e, t + seconds * 0.34, seconds * 0.32, 0.09);
    // The chime: three notes up, as the menu appears.
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const at = t + seconds * 0.9 + i * 0.1;
      tone(e, at, "sine", f, f, 0.5 - i * 0.05, 0.12);
      tone(e, at, "triangle", f * 2, f * 2, 0.3, 0.03);
    });
  },

  /**
   * The terminal switching off, over `seconds` (the CRT's collapse): the
   * switch, the picture's whine falling away as it shrinks to a line, a crack
   * of static, the fan winding down, and a last tick as the dot goes out.
   */
  powerOff(seconds: number) {
    const e = engineNow();
    const t = e.ctx.currentTime + 0.02;
    click(e, t, 0.6);
    thunk(e, t + 0.01, 0.5);
    tone(e, t + 0.03, "sine", 1500, 90, seconds * 0.85, 0.12); // the picture falling
    tone(e, t + 0.03, "sawtooth", 60, 30, seconds, 0.12);
    hiss(e, t + 0.05, seconds * 0.5, "highpass", 3200, 700, 0.6, 0.16, 0.02); // static
    hiss(e, t + seconds * 0.8, 0.12, "bandpass", 5200, 2600, 3, 0.18); // the line snapping
    fan(e, t + 0.05, seconds + 0.7, 0.07, false);
    tone(e, t + seconds * 0.95, "sine", 2400, 1200, 0.06, 0.1); // the dot
    thunk(e, t + seconds * 0.95, 0.3);
  },
};
