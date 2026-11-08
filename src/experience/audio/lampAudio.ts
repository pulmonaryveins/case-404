import { engineNow, hiss, thunk, tone, type Engine } from "./computerAudio";

/**
 * The lamps' switch sounds, synthesised on the same engine as the terminal's
 * (computerAudio): always after a click, so sound is allowed.
 *
 *  - Desk lamp: a pull chain. A light rattle of its beads, then the switch's
 *    two-step metal click-clack; switching on, the bulb's filament gives a
 *    faint tink and a short mains hum that settles away.
 *  - Wall lights: a wall toggle, one firm clack with a little body to it, and
 *    the same faint hum switching on.
 */

/** A small metal tick: a bead of the chain, a contact. */
function tick(e: Engine, t: number, f: number, peak: number) {
  hiss(e, t, 0.012, "bandpass", f, f * 0.8, 6, peak, 0.001);
  tone(e, t, "sine", f * 0.9, f * 0.7, 0.02, peak * 0.25);
}

/** The bulb taking: a faint high tink and a short hum, fading in a moment. */
function filament(e: Engine, t: number) {
  tone(e, t, "sine", 4200, 4100, 0.12, 0.025);
  const o = e.ctx.createOscillator();
  o.type = "triangle";
  o.frequency.value = 120;
  const g = e.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.03, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(g).connect(e.bus);
  o.start(t);
  o.stop(t + 0.65);
}

export const lampAudio = {
  /** The desk lamp's pull chain, switching it `on` or off. */
  desk(on: boolean) {
    const e = engineNow();
    const t = e.ctx.currentTime + 0.01;
    // The beads rattle as the chain is pulled.
    for (let i = 0; i < 4; i++) {
      tick(e, t + i * 0.018 + Math.random() * 0.008, 5200 + Math.random() * 1800, 0.06);
    }
    // The switch: down, then the snap (higher switching on, lower off).
    const pitch = on ? 1 : 0.85;
    tick(e, t + 0.08, 2600 * pitch, 0.35);
    tone(e, t + 0.08, "sine", 520 * pitch, 300 * pitch, 0.04, 0.12);
    tick(e, t + 0.115, 3400 * pitch, 0.28);
    // The chain swings back and taps the shade.
    tick(e, t + 0.2, 4600, 0.04);
    tick(e, t + 0.27, 4300, 0.025);
    if (on) filament(e, t + 0.12);
  },

  /** The wall lights' toggle switch, switching them `on` or off. */
  wall(on: boolean) {
    const e = engineNow();
    const t = e.ctx.currentTime + 0.01;
    hiss(e, t, 0.02, "highpass", 1800, 1800, 0.7, 0.32);
    tone(e, t, "square", on ? 1500 : 1250, 700, 0.014, 0.06);
    thunk(e, t + 0.004, 0.22);
    hiss(e, t + 0.006, 0.05, "bandpass", 900, 600, 2, 0.08); // the plate and the wall
    if (on) filament(e, t + 0.05);
  },
};
