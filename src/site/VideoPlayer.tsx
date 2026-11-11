import { type CSSProperties, useEffect, useRef, useState } from "react";
import styles from "./Site.module.css";

const fmt = (s: number) =>
  Number.isFinite(s)
    ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
    : "0:00";

/** Line icons on a 24px grid. */
const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d={d} />
  </svg>
);
const PLAY = "M7 4.5v15l12-7.5z";
const PAUSE = "M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z";
const SOUND = "M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11";
const MUTE = "M4 9h4l5-4v14l-5-4H4zM16.5 9.5l5 5M21.5 9.5l-5 5";
const FULL = "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5";

/**
 * The site's video player: the clip with a big play button over it until it
 * starts, then a bar (play, time, a scrub track, sound, full screen) that
 * shows on hover or while paused. Click the picture or press Space or K to
 * play and pause, the arrows to skip 5 seconds, M to mute, F for full screen.
 * Starting one player pauses any other on the page.
 */
export function VideoPlayer({
  src,
  poster,
  silent = false,
  preload = "metadata",
}: {
  src: string;
  poster?: string;
  /** The clip has no sound track: no sound button. */
  silent?: boolean;
  preload?: "none" | "metadata";
}) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(silent);

  useEffect(() => {
    if (video.current) video.current.muted = muted;
  }, [muted]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };
  const seek = (t: number) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration || 0, t));
    setTime(v.currentTime);
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void box.current?.requestFullscreen();
  };

  return (
    <div
      ref={box}
      className={styles.player}
      data-playing={playing || undefined}
      data-started={started || undefined}
      tabIndex={0}
      onKeyDown={(e) => {
        const k = e.key.toLowerCase();
        if (k === "arrowleft" || k === "arrowright") {
          e.stopPropagation();
          e.preventDefault();
          seek(time + (k === "arrowright" ? 5 : -5));
        } else if ((k === " " && e.target === e.currentTarget) || k === "k") {
          e.preventDefault();
          toggle();
        } else if (k === "m" && !silent) setMuted((m) => !m);
        else if (k === "f") fullscreen();
      }}
    >
      <video
        ref={video}
        src={src}
        poster={poster}
        preload={preload}
        playsInline
        onClick={toggle}
        onPlay={(e) => {
          setPlaying(true);
          setStarted(true);
          document.querySelectorAll("video").forEach((v) => v !== e.currentTarget && v.pause());
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
      <button
        className={styles.playerBig}
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        tabIndex={-1}
      >
        <Icon d={PLAY} />
      </button>
      <div className={styles.playerBar}>
        <button onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          <Icon d={playing ? PAUSE : PLAY} />
        </button>
        <span className={styles.playerTime}>
          {fmt(time)} / {fmt(duration)}
        </span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={time}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          style={{ "--p": `${duration ? (time / duration) * 100 : 0}%` } as CSSProperties}
        />
        {!silent && (
          <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"}>
            <Icon d={muted ? MUTE : SOUND} />
          </button>
        )}
        <button onClick={fullscreen} aria-label="Full screen">
          <Icon d={FULL} />
        </button>
      </div>
    </div>
  );
}
