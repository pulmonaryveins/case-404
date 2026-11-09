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
 * The portfolio for phones and tablets: the same case file as the 3D office,
 * as one plain scrolling page built from the same data, with a note that the
 * office itself is on desktop. Images and videos load only as they are reached.
 */
const CATEGORIES: ProjectCategory[] = ["Development", "UI/UX", "Video Editing"];

/** Projects still holding placeholder copy stay off the page. */
const finished = projects.filter((p) => !/placeholder/i.test(p.description));
const email = /placeholder|example\.com/i.test(contact.email) ? null : contact.email;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      {children}
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const clip = projectClips(project)[0];
  const shot = project.screenshots?.[0];
  const links = [
    ...(project.link ? [{ label: "Visit project", url: project.link }] : []),
    ...(project.links ?? []),
  ];
  return (
    <article className={styles.card}>
      {clip ? (
        <video
          className={styles.media}
          src={clip.src}
          poster={clip.poster || undefined}
          preload={clip.poster ? "none" : "metadata"}
          controls
          playsInline
        />
      ) : (
        shot && <img className={styles.media} src={shot.src} alt={shot.caption} loading="lazy" />
      )}
      <div className={styles.cardBody}>
        <h4 className={styles.cardTitle}>{project.title}</h4>
        <p className={styles.text}>{project.tagline ?? project.description}</p>
        {project.tools.length > 0 && <p className={styles.muted}>{project.tools.join(", ")}</p>}
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

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden />
          <span className={styles.caseNo}>Case 404</span>
        </div>
        <h1 className={styles.name}>{profile.name.join(" ")}</h1>
        <p className={styles.roles}>{profile.roles.join("  ·  ")}</p>
        <p className={styles.muted}>{profile.location}</p>
        <p className={styles.about}>{profile.about}</p>
        <button type="button" className={styles.button} onClick={saveResume} disabled={saving}>
          {saving ? "Preparing PDF…" : "Download resume"}
        </button>
      </header>

      <aside className={styles.notice}>
        <svg viewBox="0 0 24 24" className={styles.noticeIcon} aria-hidden>
          <path
            d="M3 5h18v11H3zM9 20h6M12 16v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p>
          <strong>The full 3D experience is available on desktop.</strong> Open this site on a
          computer to investigate the detective&apos;s office.
        </p>
      </aside>

      <Section title="Education">
        {education.map((school) => (
          <div key={school.id} className={styles.entry}>
            <h3 className={styles.entryTitle}>{school.institution}</h3>
            <p className={styles.text}>{school.credential}</p>
            <p className={styles.date}>{school.period}</p>
            {school.detail && <p className={styles.muted}>{school.detail}</p>}
          </div>
        ))}
      </Section>

      <Section title="Experience">
        {experienceEntries.map((job) => (
          <div key={job.id} className={styles.entry}>
            <h3 className={styles.entryTitle}>{job.role}</h3>
            <p className={styles.text}>{job.organization}</p>
            <p className={styles.date}>{job.period}</p>
            {job.summary && <p className={styles.muted}>{job.summary}</p>}
            {job.bullets && (
              <ul className={styles.list}>
                {job.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </Section>

      <Section title="Projects">
        {CATEGORIES.map((category) => {
          const items = finished.filter((p) => p.category === category);
          return (
            items.length > 0 && (
              <div key={category}>
                <h3 className={styles.group}>{category}</h3>
                <div className={styles.grid}>
                  {items.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </div>
            )
          );
        })}
      </Section>

      <Section title="Graphic design">
        <div className={styles.designGrid}>
          {designWork.map((piece) => (
            <img
              key={piece.file}
              className={styles.design}
              src={designWorkUrl(piece.file)}
              alt={piece.title}
              loading="lazy"
            />
          ))}
        </div>
      </Section>

      <Section title="Skills">
        {profileSkills.map((skill) => (
          <div key={skill.label} className={styles.entry}>
            <h3 className={styles.date}>{skill.label}</h3>
            <p className={styles.text}>{skill.value}</p>
          </div>
        ))}
      </Section>

      <Section title="Certifications">
        <div className={styles.grid}>
          {certificates.map((cert) => (
            <article key={cert.id} className={styles.card}>
              <img className={styles.media} src={cert.image} alt={cert.title} loading="lazy" />
              <div className={styles.cardBody}>
                <h4 className={styles.cardTitle}>{cert.title}</h4>
                <p className={styles.muted}>
                  {cert.issuer} · {cert.year}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {(email || contact.links.length > 0) && (
        <Section title="Contact">
          <p className={styles.links}>
            {email && <a href={`mailto:${email}`}>{email}</a>}
            {contact.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            ))}
          </p>
        </Section>
      )}
    </main>
  );
}
