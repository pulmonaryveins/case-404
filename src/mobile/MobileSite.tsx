import { useState, type ReactNode } from "react";
import { certificates } from "../data/certificates";
import { contact } from "../data/contact";
import { designWork } from "../data/designWork";
import { education } from "../data/education";
import { experienceEntries } from "../data/experience";
import { profile, profileSkills } from "../data/profile";
import { projects } from "../data/projects";
import { downloadResume } from "../experience/resume/resumeFile";
import styles from "./MobileSite.module.css";

/**
 * The portfolio for phones and tablets: text only, direct, built from the same
 * data as the 3D site, which stays the full experience on desktop.
 */

/** Tools listed per project: the main stack, not the whole package file. */
const MAX_TOOLS = 5;

/** Projects still holding placeholder copy stay off the page. */
const finished = projects.filter((p) => !/placeholder/i.test(p.description));
/** Degrees only, as on the resume. */
const degrees = education.filter((e) => /bachelor|associate|master|doctor/i.test(e.credential));
const email = /placeholder|example\.com/i.test(contact.email) ? null : contact.email;

/** The data holds names in capitals, for the 3D site's typed labels. */
const titleCase = (text: string) =>
  text
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Ui/Ux", "UI/UX");

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.heading}>{title}</h2>
      {children}
    </section>
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
    <div className={styles.page}>
      <nav className={styles.nav} aria-label="Sections">
        <a href="#experience">Experience</a>
        <a href="#projects">Projects</a>
        <a href="#education">Education</a>
      </nav>

      <main>
        <header className={styles.intro}>
          <h1 className={styles.name}>{titleCase(profile.name.join(" "))}</h1>
          <p className={styles.role}>{profile.roles.map(titleCase).join(" and ")}</p>
          <p className={styles.meta}>{titleCase(profile.location)}</p>
          <p className={styles.about}>{profile.about}</p>
          <button type="button" className={styles.button} onClick={saveResume} disabled={saving}>
            {saving ? "Preparing…" : "Download resume"}
          </button>
          <p className={styles.note}>
            This site is a work in progress. The full 3D experience is available on desktop.
          </p>
        </header>

        <Section id="experience" title="Experience">
          {experienceEntries.map((job) => (
            <div key={job.id} className={styles.entry}>
              <h3 className={styles.entryTitle}>{job.role}</h3>
              <p className={styles.text}>{job.organization}</p>
              <p className={styles.meta}>{job.period}</p>
              {job.summary && <p className={styles.detail}>{job.summary}</p>}
            </div>
          ))}
        </Section>

        <Section id="projects" title="Projects">
          {finished.map((project) => {
            // Only the main link: a playlist's reels would fill the page.
            const links = [
              ...(project.link ? [{ label: "Visit project", url: project.link }] : []),
              ...(project.links ?? []),
            ].slice(0, 1);
            return (
              <div key={project.id} className={styles.entry}>
                <h3 className={styles.entryTitle}>{project.title}</h3>
                <p className={styles.meta}>{project.category}</p>
                <p className={styles.detail}>{project.tagline ?? project.description}</p>
                {project.tools.length > 0 && (
                  <p className={styles.meta}>{project.tools.slice(0, MAX_TOOLS).join(" · ")}</p>
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
            );
          })}
        </Section>

        <Section title="Graphic design">
          <p className={styles.text}>{designWork.map((piece) => piece.title).join(" · ")}</p>
        </Section>

        <Section id="education" title="Education">
          {degrees.map((school) => (
            <div key={school.id} className={styles.entry}>
              <h3 className={styles.entryTitle}>{school.credential}</h3>
              <p className={styles.text}>{school.institution}</p>
              <p className={styles.meta}>{school.period}</p>
            </div>
          ))}
        </Section>

        <Section title="Skills">
          {profileSkills.map((skill) => (
            <div key={skill.label} className={styles.entry}>
              <h3 className={styles.entryTitle}>{titleCase(skill.label)}</h3>
              <p className={styles.text}>{skill.value}</p>
            </div>
          ))}
        </Section>

        <Section title="Certifications">
          {certificates.map((cert) => (
            <div key={cert.id} className={styles.entry}>
              <h3 className={styles.entryTitle}>{cert.title}</h3>
              <p className={styles.meta}>
                {cert.issuer}, {cert.year}
              </p>
            </div>
          ))}
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
    </div>
  );
}
