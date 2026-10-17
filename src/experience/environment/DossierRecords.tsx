import { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { profile, profileSkills } from "../../data/profile";
import { education } from "../../data/education";
import { experienceEntries } from "../../data/experience";
import { certificates } from "../../data/certificates";
import { dossierPages } from "../../data/dossier";
import { storyRig } from "../../story/storyRig";

/**
 * Accessible equivalent of the dossier's painted sheets: every section at
 * once (a screen reader needs no page changes); no duplicate visual paper.
 */
export function DossierRecords() {
  const [open, setOpen] = useState(false);
  const shown = useRef(false);
  useFrame(() => {
    const next = storyRig.dossierOpen >= 0.995;
    if (shown.current !== next) {
      shown.current = next;
      setOpen(next);
    }
  });
  if (!open) return null;
  return (
    <Html position={[0.02, 0.101, 0.12]} style={{ pointerEvents: "none" }}>
      <article className="sr-only" aria-label="Subject file">
        <h2>Case info: {profile.name.join(" ")}</h2>
        <p>{profile.roles.join(" & ")}.</p>
        <p>{profile.about}</p>
        <h3>Skills</h3>
        {profileSkills.map((skill) => (
          <p key={skill.label}>
            {skill.label}: {skill.value}
          </p>
        ))}
        <h2>Education</h2>
        {education.map((school) => (
          <section key={school.id}>
            <h3>{school.institution}</h3>
            <p>
              {school.credential}. {school.period}.
            </p>
            {school.detail && <p>{school.detail}</p>}
          </section>
        ))}
        <h2>Experience</h2>
        {experienceEntries.map((job) => (
          <section key={job.id}>
            <h3>{job.organization}</h3>
            <p>
              {job.role}. {job.period}.
            </p>
            {job.summary && <p>{job.summary}</p>}
            {job.bullets && (
              <ul>
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
            {job.tools && <p>Tools: {job.tools}</p>}
          </section>
        ))}
        {/* Only while the Achievements sheet is on the dossier. */}
        {dossierPages.some((page) => page.id === "achievements") && (
          <>
            <h2>Achievements</h2>
            {certificates.map((cert) => (
              <p key={cert.id}>
                {cert.title}, {cert.issuer}, {cert.year}.
              </p>
            ))}
          </>
        )}
      </article>
    </Html>
  );
}
