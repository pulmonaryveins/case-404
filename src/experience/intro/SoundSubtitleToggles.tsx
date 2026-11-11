import { useEffect, useState } from "react";
import { click, engineNow } from "../audio/computerAudio";
import { gramophone } from "../audio/gramophoneAudio";
import { useSubtitles } from "./subtitleState";
import styles from "./SoundSubtitleToggles.module.css";

/**
 * Music and subtitles on/off, bottom left, each a small switch that clicks.
 * The music button is the gramophone's own switch (the same as clicking the
 * record player), so the two never disagree; its state is read a few times a
 * second, since the record can also be started and stopped in the scene.
 */
const tick = () => {
  const e = engineNow();
  click(e, e.ctx.currentTime + 0.005, 0.22);
};

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={styles.svg} aria-hidden>
      <path d="M3 8h3l4-3.5v11L6 12H3z" fill="currentColor" />
      {on ? (
        <path
          d="M13 7.2a4 4 0 0 1 0 5.6M15.3 5a7 7 0 0 1 0 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M13.5 7.5l5 5m0-5l-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function CaptionIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={styles.svg} aria-hidden>
      <rect
        x="2"
        y="4.5"
        width="16"
        height="11"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M8.6 8.4a2 2 0 1 0 0 3.2M14.4 8.4a2 2 0 1 0 0 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {!on && <path d="M3 17L17 3" stroke="currentColor" strokeWidth="1.4" />}
    </svg>
  );
}

export function SoundSubtitleToggles({ hidden }: { hidden: boolean }) {
  const subtitles = useSubtitles((s) => s.enabled);
  const toggleSubtitles = useSubtitles((s) => s.toggle);
  const [music, setMusic] = useState(gramophone.on);

  useEffect(() => {
    const timer = window.setInterval(() => setMusic(gramophone.on), 250);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.toggles} data-hidden={hidden}>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={music}
        onClick={() => {
          tick();
          gramophone.toggle();
          setMusic(!music);
        }}
      >
        <SpeakerIcon on={music} />
        <span className={styles.label}>Music</span>
        <span className={styles.state}>{music ? "On" : "Off"}</span>
      </button>
      <button
        type="button"
        className={styles.toggle}
        aria-pressed={subtitles}
        onClick={() => {
          tick();
          toggleSubtitles();
        }}
      >
        <CaptionIcon on={subtitles} />
        <span className={styles.label}>Subtitles</span>
        <span className={styles.state}>{subtitles ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
