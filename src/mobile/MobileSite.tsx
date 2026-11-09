import { useState, type ReactNode } from "react";
import { certificates } from "../data/certificates";
import { contact } from "../data/contact";
import { designWork, designWorkUrl } from "../data/designWork";
import { education } from "../data/education";
import { experienceEntries } from "../data/experience";
import { profile, profileSkills } from "../data/profile";
import { projectClips, projects, type Project, type ProjectCategory } from "../data/projects";
import { downloadResume } from "../experience/resume/resumeFile";
import styles from "./MobileSite.module.css";

/**
 * The portfolio for phones and tablets, built as a filing drawer: the case
 * file's cover, then one colour-coded folder per kind of evidence. Each
 * folder's index tab pins to the top as it comes up and the folder slides over
 * the last. Built from the same data as the 3D office. Images and videos load
 * only as they are reached.
 */
const CATEGORIES: ProjectCategory[] = ["Development", "UI/UX", "Video Editing"];
/** Clips shown per project: a playlist can hold more than a phone needs. */
const MAX_CLIPS = 6;
/** Tools listed per project: the main stack, not the whole package file. */
const MAX_TOOLS = 6;

/** Projects still holding placeholder copy stay off the page. */
const finished = projects.filter((p) => !/placeholder/i.test(p.description));
/** Degrees only, as on the resume. */
const degrees = education.filter((e) => /bachelor|associate|master|doctor/i.test(e.credential));
const email = /placeholder|example\.com/i.test(contact.email) ? null : contact.email;

function Folder({
  id,
  tone,
  title,
  note,
  children,
}: {
  id: string;
  tone: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`${styles.folder} ${tone}`}>
      <div className={styles.tabBar}>
        <h2 className={styles.tab}>
          {title}
          {note && <span className={styles.tabNote}>{note}</span>}
        </h2>
      </div>
      <div className={styles.folderBody}>{children}</div>
    </section>
  );
}

/** One project's pictures or clips, swiped sideways; the next one shows at the edge. */
function Rail({ project }: { project: Project }) {
  const clips = projectClips(project).slice(0, MAX_CLIPS);
  const shots = project.screenshots ?? [];
  const count = clips.length || shots.length;
  if (!count) return null;
  return (
    <div
      className={styles.rail}
      data-single={count === 1}
      tabIndex={count > 1 ? 0 : undefined}
      role="group"
      aria-label={`${project.title} media`}
    >
      {clips.map((clip) => (
        <figure key={clip.src} className={styles.frame}>
          <video
            className={styles.media}
            // Without a poster, the frame a second in stands for the clip.
            src={clip.poster ? clip.src : `${clip.src}#t=1`}
            poster={clip.poster || undefined}
            preload={clip.poster ? "none" : "metadata"}
            controls
            playsInline
          />
          {clips.length > 1 && <figcaption className={styles.caption}>{clip.title}</figcaption>}
        </figure>
      ))}
      {clips.length === 0 &&
        shots.map((shot) => (
          <figure key={shot.src} className={styles.frame}>
            <img className={styles.media} src={shot.src} alt={shot.caption} loading="lazy" />
            <figcaption className={styles.caption}>{shot.caption}</figcaption>
          </figure>
        ))}
    </div>
  );
}

function ProjectFile({ project }: { project: Project }) {
  const type = project.facts?.find(([label]) => label === "Type")?.[1];
  const links = [
    ...(project.link ? [{ label: "Visit project", url: project.link }] : []),
    ...(project.links ?? []),
  ];
  return (
    <article className={styles.sheet}>
      <Rail project={project} />
      <div className={styles.sheetText}>
        {type && <p className={styles.typed}>{type}</p>}
        <h4 className={styles.projectTitle}>{project.title}</h4>
        <p className={styles.body}>{project.tagline ?? project.description}</p>
        {project.tools.length > 0 && (
          <p className={styles.tools}>{project.tools.slice(0, MAX_TOOLS).join(" / ")}</p>
        )}
        {links.length > 0 && (
          <p className={styles.links}>
            {links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}

export function MobileSite() {
  const [saving, setSaving] = useState(false);
  const saveResume = () => {
    setSaving(true);
    // A frame first, so the button can say so before the page is painted.
    requestAnimationFrame(() => void downloadResume().finally(() => setSaving(false)));
  };
  const resumeLabel = saving ? "Preparing PDF…" : "Download resume";
  const names = profile.name.join(" ").split(" ");

  return (
    <main className={styles.page}>
      <header className={styles.cover}>
        <p className={styles.brand}>
          <span className={styles.logo} aria-hidden />
          Case 404
        </p>
        <h1 className={styles.name}>
          {names.map((word) => (
            <span key={word}>{word} </span>
          ))}
        </h1>
        <div className={styles.print}>
          <img src="/images/profile/subject-field.jpg" alt="Vince, behind a camera" />
          <span className={styles.clip} aria-hidden />
          <span className={styles.stamp} aria-hidden>
            Identified
          </span>
        </div>
        <p className={styles.roles}>
          {profile.roles.join(" / ")}
          <br />
          {profile.location}
        </p>
        <p className={styles.about}>{profile.about}</p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#work">
            See the work
          </a>
          <button type="button" className={styles.secondary} onClick={saveResume} disabled={saving}>
            {resumeLabel}
          </button>
        </div>
        <p className={styles.desktopNote}>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M3 5h18v11H3zM9 20h6M12 16v4" />
          </svg>
          The full 3D experience is available on desktop.
        </p>
      </header>

      <Folder id="work" tone={styles.green} title="Work" note={`${finished.length} files`}>
        {CATEGORIES.map((category) => {
          const items = finished.filter((p) => p.category === category);
          return (
            items.length > 0 && (
              <div key={category} className={styles.group}>
                <h3 className={styles.groupTitle}>{category}</h3>
                {items.map((project) => (
                  <ProjectFile key={project.id} project={project} />
                ))}
              </div>
            )
          );
        })}
      </Folder>

      <Folder
        id="design"
        tone={styles.oxblood}
        title="Graphic design"
        note={`${designWork.length} prints`}
      >
        <div className={styles.prints}>
          {designWork.map((piece) => (
            <figure key={piece.file} className={styles.poster}>
              <img src={designWorkUrl(piece.file)} alt={piece.title} loading="lazy" />
              <figcaption>{piece.title}</figcaption>
            </figure>
          ))}
        </div>
      </Folder>

      <Folder id="record" tone={styles.salmon} title="Record">
        <article className={`${styles.sheet} ${styles.sheetText}`}>
          <h3 className={styles.sheetHeading}>Education</h3>
          {degrees.map((school) => (
            <div key={school.id} className={styles.entry}>
              <p className={styles.typed}>{school.period}</p>
              <h4 className={styles.entryTitle}>{school.credential}</h4>
              <p className={styles.body}>{school.institution}</p>
            </div>
          ))}
          <h3 className={styles.sheetHeading}>Experience</h3>
          {experienceEntries.map((job) => (
            <div key={job.id} className={styles.entry}>
              <p className={styles.typed}>{job.period}</p>
              <h4 className={styles.entryTitle}>{job.role}</h4>
              <p className={styles.body}>{job.organization}</p>
            </div>
          ))}
          <h3 className={styles.sheetHeading}>Skills</h3>
          {profileSkills.map((skill) => (
            <div key={skill.label} className={styles.entry}>
              <p className={styles.typed}>{skill.label}</p>
              <p className={styles.body}>{skill.value}</p>
            </div>
          ))}
        </article>
        <h3 className={styles.groupTitle}>Certifications</h3>
        <div className={styles.rail} tabIndex={0} role="group" aria-label="Certifications">
          {certificates.map((cert) => (
            <figure key={cert.id} className={`${styles.frame} ${styles.certificate}`}>
              <img src={cert.image} alt={cert.title} loading="lazy" />
              <figcaption>
                {cert.title}
                <br />
                {cert.issuer}, {cert.year}
              </figcaption>
            </figure>
          ))}
        </div>
      </Folder>

      <Folder id="resume" tone={styles.buff} title="Resume">
        <p className={styles.closing}>Everything in this file, on one page.</p>
        <button type="button" className={styles.primary} onClick={saveResume} disabled={saving}>
          {resumeLabel}
        </button>
        {(email || contact.links.length > 0) && (
          <p className={styles.links}>
            {email && <a href={`mailto:${email}`}>{email}</a>}
            {contact.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </p>
        )}
      </Folder>
    </main>
  );
}
