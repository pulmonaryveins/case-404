import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Project } from "../data/projects";
import styles from "./Site.module.css";
import { VideoPlayer } from "./VideoPlayer";

export interface Shot {
  src: string;
  caption: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const wrap = (i: number, n: number) => (i + n) % n;

/** Chevron on a 24px grid, pointing left or right. */
const Chevron = ({ dir }: { dir: -1 | 1 }) => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d={dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
  </svg>
);

/**
 * Arrow keys page through a gallery without reaching the dialog, which would
 * otherwise turn them into "next project".
 */
function arrowKeys(e: KeyboardEvent, step: (dir: -1 | 1) => void) {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  e.preventDefault();
  e.stopPropagation();
  step(e.key === "ArrowRight" ? 1 : -1);
}

/** Keeps the active thumbnail in view as the gallery pages. */
function useActiveThumb(index: number) {
  const strip = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = strip.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);
  return strip;
}

/**
 * A project's screenshots: one at a time on a stage of fixed shape (wide web
 * shots and phone mockups line up instead of jumping in size), arrows and a
 * counter on it, the caption under it, and a strip of thumbnails to jump to
 * any of them. The stage opens the image full size.
 */
export function ScreenshotGallery({
  shots,
  onOpen,
}: {
  shots: Shot[];
  onOpen: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const strip = useActiveThumb(index);
  const shot = shots[index];
  const many = shots.length > 1;
  const step = (dir: -1 | 1) => setIndex((i) => wrap(i + dir, shots.length));

  return (
    <section
      className={styles.gallery}
      aria-label="Screenshots"
      data-terminal-in
      tabIndex={-1}
      onKeyDown={(e) => many && arrowKeys(e, step)}
    >
      <div className={styles.galleryStage}>
        <button
          className={styles.galleryOpen}
          onClick={() => onOpen(index)}
          aria-label={`View full size: ${shot.caption}`}
        >
          <img key={shot.src} src={shot.src} alt={shot.caption} />
        </button>
        {many && (
          <>
            <button
              className={styles.galleryArrow}
              data-dir="prev"
              onClick={() => step(-1)}
              aria-label="Previous screenshot"
            >
              <Chevron dir={-1} />
            </button>
            <button
              className={styles.galleryArrow}
              data-dir="next"
              onClick={() => step(1)}
              aria-label="Next screenshot"
            >
              <Chevron dir={1} />
            </button>
          </>
        )}
        <span className={styles.galleryZoom} aria-hidden>
          Full size ↗︎
        </span>
      </div>

      <p className={styles.galleryCaption}>
        {many && (
          <span className={styles.galleryCount}>
            {pad(index + 1)} / {pad(shots.length)}
          </span>
        )}
        {shot.caption}
      </p>

      {many && (
        <ul className={styles.galleryThumbs} ref={strip}>
          {shots.map((s, i) => (
            <li key={s.src}>
              <button
                onClick={() => setIndex(i)}
                aria-label={s.caption}
                aria-current={i === index || undefined}
              >
                <img src={s.src} alt="" loading="lazy" draggable={false} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type Clip = NonNullable<Project["videos"]>[number];

/**
 * A set of videos: the chosen one on a stage (portrait reels fit its height,
 * letterboxed, instead of towering over the page), its title and group under
 * it, and the rest as a playlist of posters grouped as on the record. Picking
 * one plays it.
 */
export function VideoGallery({ videos }: { videos: Clip[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(false);
  const clip = videos[index];
  const many = videos.length > 1;
  const step = (dir: -1 | 1) => {
    setIndex((i) => wrap(i + dir, videos.length));
    setPicked(true);
  };

  // Groups in the order they first appear, each with its clips' positions.
  const groups: { name: string; items: number[] }[] = [];
  videos.forEach((v, i) => {
    const g = groups.find((x) => x.name === v.group);
    if (g) g.items.push(i);
    else groups.push({ name: v.group, items: [i] });
  });

  return (
    <section className={styles.gallery} aria-label="Videos" data-terminal-in>
      <div className={styles.videoStage}>
        <VideoPlayer key={clip.src} src={clip.src} poster={clip.poster} autoPlay={picked} />
      </div>

      <p className={styles.galleryCaption}>
        {many && (
          <span className={styles.galleryCount}>
            {pad(index + 1)} / {pad(videos.length)}
          </span>
        )}
        {clip.group && <span className={styles.galleryGroup}>{clip.group}</span>}
        {clip.title}
        {clip.url && (
          <a className={styles.galleryLink} href={clip.url} target="_blank" rel="noreferrer">
            Watch on the page ↗︎
          </a>
        )}
        {many && (
          <span className={styles.galleryStep}>
            <button onClick={() => step(-1)} aria-label="Previous video">
              <Chevron dir={-1} />
            </button>
            <button onClick={() => step(1)} aria-label="Next video">
              <Chevron dir={1} />
            </button>
          </span>
        )}
      </p>

      {many &&
        groups.map((g) => (
          <div key={g.name} className={styles.playlist}>
            {groups.length > 1 && (
              <h5 className={styles.playlistHead}>
                {g.name} <span>{pad(g.items.length)}</span>
              </h5>
            )}
            <ul className={styles.galleryThumbs} data-videos>
              {g.items.map((i) => {
                const v = videos[i];
                return (
                  <li key={v.src}>
                    <button
                      onClick={() => {
                        setIndex(i);
                        setPicked(true);
                      }}
                      aria-current={i === index || undefined}
                      aria-label={`Play: ${v.title}`}
                    >
                      <img src={v.poster} alt="" loading="lazy" draggable={false} />
                      <span className={styles.thumbPlay} aria-hidden>
                        {i === index ? "Now playing" : "▶"}
                      </span>
                    </button>
                    <span className={styles.thumbTitle}>{v.title}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
    </section>
  );
}

/**
 * A screenshot full size, over everything: arrows and the arrow keys page
 * through the set, Esc or a click on the backdrop closes it (and only it, not
 * the record behind).
 */
export function Lightbox({
  shots,
  index,
  onIndex,
  onClose,
}: {
  shots: Shot[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const shot = shots[index];
  const many = shots.length > 1;
  const step = (dir: -1 | 1) => onIndex(wrap(index + dir, shots.length));

  useEffect(() => {
    box.current?.focus();
  }, []);

  return (
    <div
      ref={box}
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={`Screenshot: ${shot.caption}`}
      tabIndex={-1}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          // Keep the record open: only the image closes.
          e.preventDefault();
          e.stopPropagation();
          onClose();
        } else if (many) arrowKeys(e, step);
      }}
    >
      <img key={shot.src} src={shot.src} alt={shot.caption} onClick={onClose} />
      <p className={styles.lightboxCaption}>
        {many && (
          <span className={styles.galleryCount}>
            {pad(index + 1)} / {pad(shots.length)}
          </span>
        )}
        {shot.caption}
      </p>
      {many && (
        <>
          <button
            className={styles.lightboxArrow}
            data-dir="prev"
            onClick={() => step(-1)}
            aria-label="Previous screenshot"
          >
            <Chevron dir={-1} />
          </button>
          <button
            className={styles.lightboxArrow}
            data-dir="next"
            onClick={() => step(1)}
            aria-label="Next screenshot"
          >
            <Chevron dir={1} />
          </button>
        </>
      )}
      <button className={styles.lightboxClose} onClick={onClose} aria-label="Close image">
        Close <kbd>Esc</kbd>
      </button>
    </div>
  );
}
