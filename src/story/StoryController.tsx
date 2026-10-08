import { useEffect, useRef } from "react";
import { gsap, registerGsap, ScrollTrigger } from "../lib/gsap";
import { useExperienceStore } from "../store/useExperienceStore";
import { cameraAnchors } from "../experience/camera/cameraAnchors";
import type { CameraAnchorId } from "../experience/camera/cameraTypes";
import { profile } from "../data/profile";
import { caseFile } from "../data/evidenceBoard";
import { storyRig } from "./storyRig";
import type { ChapterId } from "./storyTypes";
import { CatmullRomCurve3, Vector3 } from "three";

/**
 * Scroll length of the opening sequence, in viewport heights. Six screens
 * for two camera moves and the folder opening; 800 made the same journey
 * feel like it was being paid out rather than travelled.
 */
const STAGE_VH = 600;
const SCRUB_SECONDS = 0.45;

const debug = import.meta.env.DEV && new URLSearchParams(window.location.search).has("story");

function chapterAt(p: number): ChapterId {
  if (p < 0.16) return "CASE_OPENED";
  if (p < 0.5) return "EVIDENCE_BOARD";
  return "SUBJECT_PROFILE";
}

function applyAnchor(id: CameraAnchorId) {
  const a = cameraAnchors[id];
  storyRig.camera.splice(0, 3, ...a.position);
  storyRig.target.splice(0, 3, ...a.target);
}

/**
 * Owns the opening scroll sequence: one GSAP timeline scrubbed by one
 * ScrollTrigger over a tall scroll stage. The timeline only tweens the
 * plain storyRig object; the scene reads it each frame. Zustand only hears
 * about chapter changes.
 */
export function StoryController() {
  const stage = useRef<HTMLDivElement>(null);
  const debugEl = useRef<HTMLPreElement>(null);

  useEffect(() => {
    registerGsap();
    const store = useExperienceStore.getState();
    store.setExperienceReady(true);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    store.setReducedMotion(reduced);

    const setChapter = (p: number) => {
      const next = chapterAt(p);
      if (useExperienceStore.getState().currentChapter !== next) {
        useExperienceStore.getState().setCurrentChapter(next);
      }
    };
    const showDebug = (p: number) => {
      if (debugEl.current) {
        debugEl.current.textContent =
          `progress ${p.toFixed(3)}\nchapter  ${chapterAt(p)}\n` +
          `dossier  ${storyRig.dossierOpen.toFixed(2)}  reveal ${storyRig.profileReveal.toFixed(2)}`;
      }
    };

    if (reduced) {
      // No camera travel: jump between three readable states.
      const trigger = ScrollTrigger.create({
        trigger: stage.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: ({ progress: p }) => {
          applyAnchor(p < 0.33 ? "roomOverview" : p < 0.66 ? "caseFile" : "dossierOpen");
          storyRig.dossierOpen = storyRig.profileReveal = p < 0.66 ? 0 : 1;
          setChapter(p);
          showDebug(p);
        },
      });
      return () => trigger.kill();
    }

    applyAnchor("roomOverview");
    storyRig.dossierOpen = 0;
    storyRig.profileReveal = 0;

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "sine.inOut" },
      // Read the rendered timeline, not the scroll target: numeric scrub
      // continues settling after the last scroll event.
      onUpdate() {
        const p = this.progress();
        setChapter(p);
        showDebug(p);
      },
      scrollTrigger: {
        trigger: stage.current,
        start: "top top",
        end: "bottom bottom",
        scrub: SCRUB_SECONDS,
      },
    });

    const travel = (ids: CameraAnchorId[], at: number, duration: number) => {
      const path = new CatmullRomCurve3(
        ids.map((id) => new Vector3(...cameraAnchors[id].position)),
      );
      const aim = new CatmullRomCurve3(ids.map((id) => new Vector3(...cameraAnchors[id].target)));
      const progress = { value: 0 };
      const position = new Vector3();
      const target = new Vector3();
      // One eased move through intermediate anchors: no braking at each.
      tl.to(
        progress,
        {
          value: 1,
          duration,
          onUpdate: () => {
            path.getPoint(progress.value, position);
            aim.getPoint(progress.value, target);
            position.toArray(storyRig.camera);
            target.toArray(storyRig.target);
          },
        },
        at,
      );
    };

    // Two moves, not a tour. The push-in is now a single straight run: the
    // anchors it used to thread through sat nearly in line with it and only
    // added small changes of direction, which read as separate little scenes.
    travel(["roomOverview", "caseFile"], 0, 0.42);
    // A beat to read the case file, then one arc down onto the desk. Both
    // intermediates here are load-bearing, unlike on the way in: `leaveBoard`
    // keeps the camera in front of the desk (z > -1.63) while it tilts down,
    // and `subjectProfile` pulls the aim onto the desk early. Without it the
    // target crosses the wall below the board too slowly and the shot sits on
    // blank plaster for most of the descent.
    travel(["caseFile", "leaveBoard", "subjectProfile", "dossierOpen"], 0.48, 0.42);
    tl.to(storyRig, { dossierOpen: 1, profileReveal: 1, duration: 0.22 }, 0.74);
    tl.set({}, {}, 1);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <>
      <div ref={stage} style={{ height: `${STAGE_VH}vh` }}>
        {/* Screen-reader copy of what the scene shows: the board's case
            file, then the dossier's identity and ABOUT record. */}
        <section className="sr-only" aria-label="Case file">
          <h1>
            {caseFile.title.join(" ")} — {caseFile.subtitle}
          </h1>
          <ul>
            {caseFile.fields.map((f) => (
              <li key={f.label}>
                {f.label} {f.value}
              </li>
            ))}
          </ul>
        </section>
        <section className="sr-only" aria-label="Subject profile">
          <h2>{profile.name.join(" ")}</h2>
          <p>
            {profile.status}, {profile.location}. {profile.roles.join(", ")}.
          </p>
          <h3>About</h3>
          <p>{profile.about}</p>
        </section>
      </div>
      {debug && (
        <pre
          ref={debugEl}
          style={{
            position: "fixed",
            top: 8,
            left: 8,
            margin: 0,
            padding: 8,
            font: "12px monospace",
            color: "#9f9",
            background: "rgba(0,0,0,0.7)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}
