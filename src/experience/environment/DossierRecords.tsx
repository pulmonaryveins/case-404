import { useLayoutEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { MeshStandardMaterial } from "three";
import { profile, dossierTabs } from "../../data/profile";
import { education } from "../../data/education";
import { experienceEntries } from "../../data/experience";
import { paintAboutPage } from "../surfaces/paintDossierPages";
import { storyRig } from "../../story/storyRig";
import styles from "./DossierRecords.module.css";

/** Imperative GPU resource update, separate from React's record state. */
function updatePaper(material: MeshStandardMaterial, section: number, entry: number) {
  const texture = material.map;
  if (!texture) return;
  texture.image = paintAboutPage(section, entry);
  texture.needsUpdate = true;
}

/** Transparent controls over the original, scene-lit canvas paper. */
export function DossierRecords({ material }: { material: MeshStandardMaterial }) {
  const [open, setOpen] = useState(false);
  const shown = useRef(false);
  const [section, setSection] = useState(0);
  const [entry, setEntry] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  useFrame(() => {
    const next = storyRig.dossierOpen >= 0.995;
    if (shown.current !== next) {
      shown.current = next;
      setOpen(next);
    }
  });
  useLayoutEffect(() => {
    updatePaper(material, section, entry);
  }, [material, section, entry]);
  const count =
    section === 1
      ? Math.max(1, education.length)
      : section === 2
        ? Math.max(1, experienceEntries.length)
        : 1;
  const select = (next: number) => {
    setSection(next);
    setEntry(0);
  };
  const school = education[entry];
  const job = experienceEntries[entry];
  if (!open) return null;
  return (
    <Html
      transform
      distanceFactor={1}
      position={[0.02, 0.101, 0.12]}
      rotation={[-Math.PI / 2, 0, 0]}
      zIndexRange={[20, 10]}
    >
      <div className={styles.controls}>
        <div className={styles.tabs} role="tablist" aria-label="Dossier records">
          {dossierTabs.map((tab, index) => (
            <button
              key={tab}
              ref={(el) => {
                buttons.current[index] = el;
              }}
              id={`dossier-tab-${index}`}
              role="tab"
              aria-selected={section === index}
              aria-controls="dossier-record"
              tabIndex={section === index ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={(event) => {
                let next: number;
                if (event.key === "ArrowRight") next = (index + 1) % 3;
                else if (event.key === "ArrowLeft") next = (index + 2) % 3;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = 2;
                else return;
                event.preventDefault();
                select(next);
                buttons.current[next]?.focus();
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <section
          id="dossier-record"
          role="tabpanel"
          aria-labelledby={`dossier-tab-${section}`}
          className="sr-only"
        >
          {section === 0 ? (
            <>
              <h2>About the subject</h2>
              <p>{profile.about}</p>
              <p>
                {profile.name.join(" ")}. {profile.location}. {profile.status}.
              </p>
            </>
          ) : section === 1 ? (
            <>
              <h2>Education record</h2>
              <p>
                {school
                  ? `${school.institution}. ${school.credential}. ${school.period}.`
                  : "Records have not been supplied yet."}
              </p>
            </>
          ) : (
            <>
              <h2>Experience record</h2>
              <p>
                {job
                  ? `${job.organization}. ${job.role}. ${job.period}. ${job.summary}`
                  : "Records have not been supplied yet."}
              </p>
            </>
          )}
        </section>
        {count > 1 && (
          <nav className={styles.pagination} aria-label="Record pagination">
            <button
              aria-label="Previous record"
              disabled={entry === 0}
              onClick={() => setEntry(entry - 1)}
            >
              Previous
            </button>
            <button
              aria-label="Next record"
              disabled={entry === count - 1}
              onClick={() => setEntry(entry + 1)}
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </Html>
  );
}
