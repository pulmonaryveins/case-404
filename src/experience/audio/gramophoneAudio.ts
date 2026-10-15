/**
 * The gramophone's sound (Web Audio), started and stopped by clicking the
 * gramophone (see Gramophone.tsx).
 *
 *  - The record: the music file streamed through a horn's narrow band (low and
 *    high end cut), with a faint surface crackle under it.
 *  - Turning on: the needle drops (a low thump), the motor buzzes and the
 *    crackle swells, and the record spins up, the music rising to pitch.
 *  - Turning off: the needle lifts (a short scratch), a buzz, and the record
 *    winds down, the music sagging in pitch as it fades, then stops.
 *  - Where it is: it falls off with the camera's distance from the gramophone
 *    and pans with where it stands in view (`place`, every frame).
 *
 * Nothing is created until the first click (browsers only allow sound after
 * a gesture). One gramophone, so the engine is module state.
 */
const MUSIC_URL = "/audio/cool-vibes.mp3";
/**
 * Overall level (before the limiter that keeps the peaks clean), and the
 * crackle's share of it.
 */
// 1.7 measured about -23 dB RMS on the music (quiet): the track is dynamic and
// the horn filter takes some of its body, so it is lifted to 2.4.
const VOLUME = 2.4;
const CRACKLE = 0.1;
/**
 * Distance: full level within `NEAR` metres of the camera, then falling, but
 * never below `FLOOR`: the story's camera ends up 4-7 m from the gramophone,
 * and an unbounded falloff left it too quiet to hear (and silent by the
 * poster wall). Pan is kept gentle, so it stays in both ears.
 */
const DISTANCE = { near: 2.6, floor: 0.6 };
const PAN = 0.55;
/** Spin-up and wind-down: playback rate at the start / end, and how long (s). */
const SPIN_UP = { from: 0.55, seconds: 0.9 };
const WIND_DOWN = { to: 0.3, seconds: 1.3 };

interface Engine {
  ctx: AudioContext;
  media: HTMLAudioElement;
  music: GainNode;
  crackle: GainNode;
  /** Everything from the gramophone passes through here: horn, then distance, then pan. */
  horn: BiquadFilterNode;
  distance: GainNode;
  pan: StereoPannerNode;
}

let engine: Engine | null = null;
/** Whether it is playing (or spinning up), as the click left it. */
let on = false;
/** The record's playback rate, eased toward the target in `place`. */
let rate = 1;
let rateTarget = 1;
/** How much the rate changes per second while easing. */
let rateStep = 1;
let pauseAt = 0;

/** Sparse clicks and a low hiss, three seconds, looped under the music. */
function crackleBuffer(ctx: AudioContext) {
  const length = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 404;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let hiss = 0;
  for (let i = 0; i < length; i++) {
    hiss = hiss * 0.92 + (r() - 0.5) * 0.08;
    data[i] = hiss * 0.25;
    if (r() < 0.0007) {
      const amp = (0.3 + r() * 0.7) * (r() < 0.5 ? -1 : 1);
      for (let k = 0; k < 24 && i + k < length; k++) data[i + k] += amp * Math.exp(-k / 4);
    }
  }
  return buffer;
}

function build(): Engine {
  const ctx = new AudioContext();
  const media = new Audio(MUSIC_URL);
  media.loop = true;
  media.preload = "auto";
  media.preservesPitch = false;
  const source = ctx.createMediaElementSource(media);

  const music = ctx.createGain();
  music.gain.value = 0;
  const crackle = ctx.createGain();
  crackle.gain.value = 0;
  // The horn: a narrow, mid-heavy band, as acoustic gramophones sound.
  const low = ctx.createBiquadFilter();
  low.type = "highpass";
  low.frequency.value = 140;
  const horn = ctx.createBiquadFilter();
  horn.type = "lowpass";
  horn.frequency.value = 5200;
  horn.Q.value = 0.9;
  const distance = ctx.createGain();
  const pan = ctx.createStereoPanner();
  const master = ctx.createGain();
  master.gain.value = VOLUME;
  // A limiter: the master gain is above 1, so it catches the loud peaks
  // instead of letting them clip.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 8;
  limiter.ratio.value = 12;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.2;

  source.connect(music).connect(low);
  crackle.connect(low);
  low
    .connect(horn)
    .connect(distance)
    .connect(pan)
    .connect(master)
    .connect(limiter)
    .connect(ctx.destination);

  const noise = ctx.createBufferSource();
  noise.buffer = crackleBuffer(ctx);
  noise.loop = true;
  noise.connect(crackle);
  noise.start();

  // It plays on in the background: the player chose to start it, and a
  // window covered by another counts as hidden (so pausing there stopped it
  // while the page was still on screen behind). Coming back just makes sure
  // the sound is still running.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && on) keepAlive();
  });

  return { ctx, media, music, crackle, horn, distance, pan };
}

/**
 * If the player wants it playing, make sure it is: the context running and
 * the record not paused. Browsers can pause either on their own (a tab
 * switch, a media key, another page taking the audio).
 */
function keepAlive() {
  const e = engine;
  if (!e || !on) return;
  if (e.ctx.state !== "running") void e.ctx.resume();
  if (e.media.paused) void e.media.play().catch(() => undefined);
}

/** Stops the record outright: paused, back to normal speed. */
function halt(media: HTMLAudioElement) {
  media.pause();
  rate = rateTarget = 1;
  media.playbackRate = 1;
  pauseAt = 0;
}

/** A short envelope on a node's gain: up fast, then away over `seconds`. */
function burst(ctx: AudioContext, node: GainNode, peak: number, seconds: number) {
  const t = ctx.currentTime;
  node.gain.setValueAtTime(0, t);
  node.gain.linearRampToValueAtTime(peak, t + 0.02);
  node.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
}

/** The motor's buzz: a low sawtooth hum, band-limited, a fraction of a second. */
function buzz(e: Engine, seconds: number) {
  const { ctx } = e;
  const hum = ctx.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 55;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 190;
  band.Q.value = 1.2;
  const gain = ctx.createGain();
  hum.connect(band).connect(gain).connect(e.horn);
  burst(ctx, gain, 0.35, seconds);
  hum.start();
  hum.stop(ctx.currentTime + seconds + 0.05);
}

/** The needle meeting the record: a soft low thump. */
function thump(e: Engine) {
  const { ctx } = e;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(95, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.14);
  const gain = ctx.createGain();
  osc.connect(gain).connect(e.horn);
  burst(ctx, gain, 0.6, 0.18);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

/** The needle lifting: a short scratch of filtered noise. */
function scratch(e: Engine) {
  const { ctx } = e;
  const length = Math.floor(ctx.sampleRate * 0.16);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1900;
  band.Q.value = 0.8;
  const gain = ctx.createGain();
  noise.connect(band).connect(gain).connect(e.horn);
  burst(ctx, gain, 0.5, 0.16);
  noise.start();
}

export const gramophone = {
  get on() {
    return on;
  },
  /** How fast the record turns, 0 (still) to 1 (full speed), for the spin. */
  get speed() {
    if (!engine) return 0;
    return on || engine.ctx.currentTime < pauseAt ? rate : 0;
  },

  toggle() {
    engine ??= build();
    const e = engine;
    void e.ctx.resume();
    const t = e.ctx.currentTime;
    on = !on;
    if (on) {
      thump(e);
      buzz(e, 0.7);
      rate = SPIN_UP.from;
      rateTarget = 1;
      rateStep = (1 - SPIN_UP.from) / SPIN_UP.seconds;
      e.media.playbackRate = rate;
      void e.media.play().catch(() => undefined);
      e.music.gain.cancelScheduledValues(t);
      e.music.gain.setValueAtTime(e.music.gain.value, t);
      e.music.gain.linearRampToValueAtTime(1, t + SPIN_UP.seconds);
      e.crackle.gain.setTargetAtTime(CRACKLE, t, 0.15);
      pauseAt = Infinity;
    } else {
      scratch(e);
      buzz(e, 0.5);
      rateTarget = WIND_DOWN.to;
      rateStep = Math.abs(rate - WIND_DOWN.to) / WIND_DOWN.seconds;
      e.music.gain.cancelScheduledValues(t);
      e.music.gain.setValueAtTime(e.music.gain.value, t);
      e.music.gain.linearRampToValueAtTime(0, t + WIND_DOWN.seconds);
      e.crackle.gain.setTargetAtTime(0, t, 0.3);
      pauseAt = t + WIND_DOWN.seconds + 0.1;
      // The frame loop stops the record when it has wound down; this does it
      // too, for a tab whose frames are not running.
      window.setTimeout(
        () => {
          if (!on) halt(e.media);
        },
        (WIND_DOWN.seconds + 0.15) * 1000,
      );
    }
  },

  /** What the engine is doing, for checking it: level, state and whether the record turns. */
  get status() {
    if (!engine) return null;
    return {
      on,
      paused: engine.media.paused,
      currentTime: engine.media.currentTime,
      rate: engine.media.playbackRate,
      context: engine.ctx.state,
      distanceGain: engine.distance.gain.value,
    };
  },

  /**
   * Every frame: ease the record's speed, stop it once wound down, and set
   * how loud and where it sounds from the camera (`distance` in m, `side`
   * -1 left to 1 right of the view).
   */
  place(dt: number, distance: number, side: number) {
    const e = engine;
    if (!e) return;
    if (rate !== rateTarget) {
      const step = dt * rateStep;
      rate =
        rate < rateTarget ? Math.min(rateTarget, rate + step) : Math.max(rateTarget, rate - step);
      e.media.playbackRate = rate;
    }
    if (!on && e.ctx.currentTime >= pauseAt && !e.media.paused) halt(e.media);
    // Stopped: nothing to place, so nothing is scheduled.
    if (!on && e.media.paused) return;
    keepAlive();
    const t = e.ctx.currentTime;
    const level = Math.max(DISTANCE.floor, Math.min(1, DISTANCE.near / Math.max(distance, 0.1)));
    e.distance.gain.setTargetAtTime(level, t, 0.1);
    e.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, side)) * PAN, t, 0.1);
  },
};
