import { useState } from "react";
import type { Project } from "../data/projects";
import { cover } from "./projectMedia";
import styles from "./Site.module.css";
import { TerminalDialog } from "./TerminalDialog";
import { VideoPlayer } from "./VideoPlayer";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * One piece of evidence opened, full screen: the record zooms out of its card
 * and back into it on close. Its cover, dimmed, behind; the file's heading;
 * the metadata (facts, stack, links) in a panel on the left; the mission
 * report, the screenshots and the sections on the right. Arrows at the edges
 * (and the arrow keys) page through the files; Esc closes; a screenshot opens
 * full size.
 */
export function ProjectDialog({
  project,
  list,
  onSelect,
  onClose,
}: {
  project: Project | null;
  list: Project[];
  onSelect: (p: Project) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState<{ id: string; src: string; caption: string } | null>(null);
  const index = project ? list.findIndex((p) => p.id === project.id) : -1;
  const bg = project ? cover(project) : null;
  const links = project
    ? [
        ...(project.link ? [{ label: "Access site", url: project.link }] : []),
        ...(project.links ?? []),
      ]
    : [];

  return (
    <TerminalDialog
      id={project?.id ?? null}
      cardAttr="data-project-id"
      bg={bg?.kind === "image" ? bg.src : null}
      label={project?.title ?? "Project"}
      step="evidence"
      onStep={(dir) => {
        if (index >= 0) onSelect(list[(index + dir + list.length) % list.length]);
      }}
      onClose={onClose}
      overlay={
        project &&
        zoom &&
        zoom.id === project.id && (
          <button
            className={styles.lightbox}
            onClick={() => setZoom(null)}
            aria-label="Close image"
          >
            <img src={zoom.src} alt={zoom.caption} />
            <span>{zoom.caption}</span>
          </button>
        )
      }
    >
      {project && (
        <>
          <header className={styles.terminalHead} data-terminal-in>
            <div>
              <p>Top secret // decrypted</p>
              <p>
                Evidence #{pad(index + 1)} / {pad(list.length)}
              </p>
            </div>
            <span className={styles.terminalBadge}>{project.category}</span>
          </header>
          <h3 className={styles.terminalTitle} data-terminal-in>
            {project.title}
          </h3>

          <div className={styles.terminalGrid}>
            <aside className={styles.meta} data-terminal-in>
              <h4>Metadata</h4>
              {project.facts && (
                <dl>
                  {project.facts.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <h5>Stack</h5>
              <ul className={styles.metaChips}>
                {project.tools.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
              {links.map((link) => (
                <a
                  key={link.url}
                  className={styles.access}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label} <span aria-hidden>↗︎</span>
                </a>
              ))}
            </aside>

            <div className={styles.terminalMain}>
              <section data-terminal-in>
                <h4 className={styles.mission}>Mission report</h4>
                <p>{project.tagline ?? project.description}</p>
              </section>

              <Media project={project} onZoom={(shot) => setZoom({ id: project.id, ...shot })} />

              {(project.sections ?? [{ heading: "Overview", text: project.description }]).map(
                (s) => (
                  <section key={s.heading} data-terminal-in>
                    <h4 className={styles.mission}>{s.heading}</h4>
                    {s.text?.split(/\n\n+/).map((para) => (
                      <p key={para.slice(0, 32)}>{para}</p>
                    ))}
                    {s.items && (
                      <ul>
                        {s.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                ),
              )}
              {project.purpose && (
                <section data-terminal-in>
                  <h4 className={styles.mission}>Purpose</h4>
                  <p>{project.purpose}</p>
                </section>
              )}
            </div>
          </div>
        </>
      )}
    </TerminalDialog>
  );
}

/**
 * The first screenshot large, in a bracketed frame, the rest in a grid; a
 * single video to play; or a set of videos by their posters.
 */
function Media({
  project,
  onZoom,
}: {
  project: Project;
  onZoom: (shot: { src: string; caption: string }) => void;
}) {
  if (project.screenshots?.length) {
    const [first, ...rest] = project.screenshots;
    return (
      <>
        <figure className={styles.frame} data-terminal-in>
          <button onClick={() => onZoom(first)} aria-label={`Enlarge: ${first.caption}`}>
            <img src={first.src} alt={first.caption} />
          </button>
          <figcaption>{first.caption}</figcaption>
        </figure>
        {rest.length > 0 && (
          <ul className={styles.shots} data-terminal-in>
            {rest.map((shot) => (
              <li key={shot.src}>
                <figure>
                  <button onClick={() => onZoom(shot)} aria-label={`Enlarge: ${shot.caption}`}>
                    <img src={shot.src} alt={shot.caption} loading="lazy" />
                  </button>
                  <figcaption>{shot.caption}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }
  if (project.videos?.length)
    return (
      <ul className={styles.shots} data-terminal-in>
        {project.videos.map((v) => (
          <li key={v.src}>
            <figure>
              <VideoPlayer src={v.src} poster={v.poster} preload="none" />
              <figcaption>{v.title}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    );
  if (project.video)
    return (
      <figure className={styles.frame} data-terminal-in>
        <VideoPlayer src={project.video} silent={project.silent} />
      </figure>
    );
  return null;
}
