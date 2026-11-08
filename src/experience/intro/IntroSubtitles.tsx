import { useEffect, useRef, useState } from "react";
import { useExperienceStore } from "../../store/useExperienceStore";
import { typewriterAudio } from "../audio/typewriterAudio";
import { useSubtitles } from "./subtitleState";
import styles from "./IntroSubtitles.module.css";

/**
 * The briefing, once the office is on screen: what the visitor is here to do
 * as the detective on Case 404, typed out a line at a time as on the office
 * typewriter, a key's strike for each character and the carriage returned at
 * each line's end, the bell on the last. Each line holds long enough to read,
 * then gives way to the next. Never names the subject (the case is to find out
 * who they are). Off: hidden and silent, not paused. Skip ends it, and so
 * does leaving the opening shot. Reduced motion: each line appears whole.
 *
 * Screen readers get each whole line once (a hidden live region), not every
 * character as it types.
 */
const LINES = [
  "Detective. Case 404 has landed on your desk.",
  "One subject. No name, no file. Identity not found.",
  "The answers are in this office: the board, the dossier, the archive, the wall.",
  "Scroll to work the case. Click anything that looks like evidence to look closer.",
  "Piece together who they are, and close the case.",
];
/** After the scene is ready: the loading screen's fade, then a beat. */
const START_MS = 1600;
/** Per character: a typist's pace, uneven, with a breath at punctuation. */
const charMs = (char: string) =>
  34 + Math.random() * 26 + (/[.:]/.test(char) ? 260 : char === "," ? 150 : 0);
/** Once typed, a line is held for a base time plus a little per character. */
const holdMs = (line: string) => 1600 + line.length * 28;
/** The gap between lines, while one fades out and the next in. */
const GAP_MS = 500;

export function IntroSubtitles({ start }: { start: boolean }) {
  const enabled = useSubtitles((s) => s.enabled);
  const [index, setIndex] = useState(-1);
  const [typed, setTyped] = useState(0);
  const [shown, setShown] = useState(false);
  const [finished, setFinished] = useState(false);
  const stop = useRef<() => void>(() => {});

  useEffect(() => {
    if (!start) return;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)));
    const audible = () => useSubtitles.getState().enabled;
    stop.current = () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
    typewriterAudio.prime();

    void (async () => {
      await wait(START_MS);
      const reduced = useExperienceStore.getState().reducedMotion;
      for (let i = 0; i < LINES.length && !cancelled; i++) {
        const line = LINES[i];
        setIndex(i);
        setTyped(reduced ? line.length : 0);
        setShown(true);
        if (!reduced) {
          for (let c = 0; c < line.length; c++) {
            await wait(charMs(line[c - 1] ?? ""));
            if (cancelled) return;
            setTyped(c + 1);
            if (audible()) typewriterAudio.key(line[c]);
          }
          if (audible()) typewriterAudio.lineEnd(i === LINES.length - 1);
        }
        await wait(holdMs(line));
        if (cancelled) return;
        setShown(false);
        await wait(GAP_MS);
      }
      if (!cancelled) setFinished(true);
    })();
    return () => stop.current();
  }, [start]);

  const skip = () => {
    stop.current();
    setShown(false);
    setFinished(true);
  };

  // It belongs to the opening shot: once the visitor moves on, it ends.
  useEffect(
    () =>
      useExperienceStore.subscribe((s) => {
        if (s.currentChapter !== "CASE_OPENED") {
          stop.current();
          setShown(false);
          setFinished(true);
        }
      }),
    [],
  );

  if (finished && !shown) return null;
  const line = index >= 0 ? LINES[index] : "";
  const done = typed >= line.length;
  return (
    <div className={styles.subtitles} data-visible={enabled && shown}>
      <p className="sr-only" aria-live="polite">
        {enabled && shown ? line : ""}
      </p>
      {enabled && (
        <div className={styles.card}>
          <div className={styles.meta}>
            <span className={styles.tag} aria-hidden>
              <span className={styles.dot} />
              Briefing
            </span>
            <span className={styles.count} aria-hidden>
              {String(index + 1).padStart(2, "0")} / {String(LINES.length).padStart(2, "0")}
            </span>
            <button type="button" className={styles.skip} onClick={skip}>
              Skip<span className="sr-only"> briefing</span>
            </button>
          </div>
          <p className={styles.line} aria-hidden>
            {/* The whole line holds the card's size; only the typed part shows. */}
            <span className={styles.typed}>{line.slice(0, typed)}</span>
            <span className={styles.caret} data-done={done} />
            <span className={styles.rest}>{line.slice(typed)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
