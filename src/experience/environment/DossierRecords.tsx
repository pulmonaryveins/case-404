import { useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { profile, profileSkills } from "../../data/profile";
import { experienceEntries } from "../../data/experience";
import { storyRig } from "../../story/storyRig";

/** Accessible equivalent of the single canvas profile; no duplicate visual paper. */
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
      <article className="sr-only" aria-label="Subject profile">
        <h2>About the subject — {profile.name.join(" ")}</h2>
        <p>
          {profile.roles.join(" & ")}. {profile.status}. {profile.location}.
        </p>
        <p>{profile.about}</p>
        <h3>Skills</h3>
        {profileSkills.map((skill) => (
          <p key={skill.label}>
            {skill.label}: {skill.value}
          </p>
        ))}
        <h3>Selected experience</h3>
        {experienceEntries.map((job) => (
          <section key={job.id}>
            <h4>{job.organization}</h4>
            <p>
              {job.role}. {job.period}.
            </p>
            <p>{job.summary}</p>
          </section>
        ))}
      </article>
    </Html>
  );
}
