import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { certificates } from "../data/certificates";
import { contact } from "../data/contact";
import { designWork, designWorkUrl, merchWork, type DesignPiece } from "../data/designWork";
import { education } from "../data/education";
import { experienceEntries } from "../data/experience";
import { profile, profileSkills } from "../data/profile";
import { projects, type Project } from "../data/projects";
import { downloadResume } from "../experience/resume/resumeFile";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { NigelChat } from "./NigelChat";
import { ProjectDialog } from "./ProjectDialog";
import { TerminalDialog } from "./TerminalDialog";
import { cover } from "./projectMedia";
import styles from "./Site.module.css";
import { useSiteMotion } from "./useSiteMotion";

/** The immersive version: the 3D detective's office (3d/index.html). */
const CASE_3D = "/3d/";

const fullName = profile.name.join(" ");
const realProjects = projects.filter((p) => !/placeholder/i.test(p.description));
const degrees = education.filter((e) => /bachelor|associate|master|doctor/i.test(e.credential));
const pad = (n: number) => String(n).padStart(2, "0");
const title = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * The portfolio as a single page, styled as a classified case file: a hero
 * with the subject's name, the evidence board of projects, the design
 * archive, the subject's profile and an open channel to get in touch. A card
 * in the corner leads to the 3D version.
 */
export function Site() {
  const [open, setOpen] = useState<Project | null>(null);
  const [poster, setPoster] = useState<DesignPiece | null>(null);
  const root = useRef<HTMLDivElement>(null);
  useSiteMotion(root);
  return (
    <div ref={root} className={styles.site}>
      <Hud />
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <main id="main">
        <Hero />
        <SubjectProfile />
        <EvidenceBoard onOpen={setOpen} />
        <DesignArchive onOpen={setPoster} />
        <ThreeDSection />
        <Contact />
      </main>
      <ThreeDCard />
      <NigelChat />
      <ProjectDialog
        project={open}
        list={realProjects}
        onSelect={setOpen}
        onClose={() => setOpen(null)}
      />
      <PosterDialog piece={poster} onSelect={setPoster} onClose={() => setPoster(null)} />
      {/* After the dialogs: its effect must run once they have opened. */}
      <Cursor lift={!!open || !!poster} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Frame                                                                */
/* ------------------------------------------------------------------ */

/** The surveillance readouts in the corners of the screen: decoration only. */
function Hud() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className={styles.hud} aria-hidden>
      <div className={styles.hudTopLeft}>
        <span>CASE 404</span>
        <span className={styles.accent}>FILE 404-A</span>
      </div>
      <div className={styles.hudTopRight}>
        <span>{now.toLocaleTimeString("en-GB")}</span>
        <span>CEBU · PH</span>
      </div>
    </div>
  );
}

/** The way into the 3D office, fixed in the corner. */
function ThreeDCard() {
  return (
    <a className={`${styles.threeD} ${styles.only3d}`} href={CASE_3D}>
      <svg viewBox="0 0 48 48" className={styles.cube} aria-hidden>
        <path d="M24 4 42 14v20L24 44 6 34V14z M6 14l18 10 18-10 M24 24v20" />
      </svg>
      Enter the 3D office <span aria-hidden>→</span>
    </a>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                             */
/* ------------------------------------------------------------------ */

/** What the loader ticks off, in the 3D office's words. */
const LOADER_STEPS = ["Retrieving the file", "Opening the folder", "Switching on the lamp"];

/** One line of the name: each letter rises out of the line's mask on reveal. */
function NameLine({ text }: { text: string }) {
  return (
    <span className={styles.nameLine} aria-hidden>
      {[...text].map((c, i) => (
        <span key={i} className={styles.char} data-char>
          {c === " " ? " " : c}
        </span>
      ))}
    </span>
  );
}

/**
 * The opening: a curtain lifts on the case file, the name's letters rise out
 * of the dark, and a pool of light follows the pointer. The light's centre
 * is CSS properties set straight from the pointer (no React state).
 */
function Hero() {
  const section = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(() => reducedMotion());

  // The loader, as the 3D office's own (LoadingOverlay): the case file's
  // heading, a percentage, a tungsten track and the steps ticked off. Then
  // the panel lifts away, the dark fades and the name rises.
  useLayoutEffect(() => {
    const el = section.current;
    if (!el || reducedMotion()) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    const all = (sel: string) => el.querySelectorAll<HTMLElement>(sel);
    const loader = el.querySelector<HTMLElement>("[data-loader]");
    const percent = el.querySelector<HTMLElement>("[data-percent]");
    const steps = all("[data-step]");
    const chars = all("[data-char]");
    const items = all("[data-hero]");
    const p = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        html.style.overflow = "";
        setRevealed(true);
        ScrollTrigger.refresh();
      },
    });
    gsap.set(items, { autoAlpha: 0, y: 20 });
    gsap.set(chars, { yPercent: 115 });
    tl.to(p, {
      v: 1,
      duration: 1.8,
      ease: "power1.inOut",
      onUpdate: () => {
        loader?.style.setProperty("--progress", String(p.v));
        if (percent) percent.textContent = String(Math.round(p.v * 100));
        steps.forEach((li, i) => {
          const start = i / steps.length;
          const end = (i + 1) / steps.length;
          li.dataset.state = p.v >= end - 0.001 ? "done" : p.v >= start ? "active" : "pending";
        });
      },
    })
      .to(
        all("[data-loader-panel]"),
        { autoAlpha: 0, y: -6, scale: 1.015, filter: "blur(1.5px)", duration: 0.45 },
        "+=0.25",
      )
      .to(loader, { autoAlpha: 0, duration: 0.7, ease: "power1.inOut" }, "-=0.2")
      .to(chars, { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.04 }, "-=0.45")
      .to(items, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12 }, "-=0.9");
    return () => {
      tl.kill();
      html.style.overflow = "";
    };
  }, []);

  const aim = (e: ReactPointerEvent) => {
    const el = section.current;
    if (!el || e.pointerType !== "mouse") return;
    const box = el.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    el.style.setProperty("--spot-x", `${x * 100}%`);
    el.style.setProperty("--spot-y", `${y * 100}%`);
    el.style.setProperty("--tilt-x", String((0.5 - y) * 8));
    el.style.setProperty("--tilt-y", String((x - 0.5) * 12));
  };
  return (
    <section ref={section} className={styles.hero} aria-labelledby="hero-title" onPointerMove={aim}>
      {!revealed && (
        <div className={styles.loader} data-loader aria-hidden>
          <div className={styles.loaderGlow} />
          <div className={styles.loaderPanel} data-loader-panel>
            <p className={styles.loaderHeading}>
              <span className={styles.loaderName}>Case 404</span>
              <span className={styles.loaderFile}>File 404-A</span>
            </p>
            <p className={styles.loaderPercent}>
              <span data-percent>0</span>
              <span className={styles.loaderSign}>%</span>
            </p>
            <div className={styles.loaderTrack}>
              <span className={styles.loaderFill} />
              <span className={styles.loaderKnob} />
            </div>
            <ul className={styles.loaderSteps}>
              {LOADER_STEPS.map((label) => (
                <li key={label} data-step data-state="pending">
                  <span className={styles.loaderMark} />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className={styles.darkness} aria-hidden />
      <p className={styles.tag} data-hero>
        TOP SECRET // CASE #404
      </p>
      <h1 id="hero-title" className={styles.name} aria-label={fullName}>
        <NameLine text={profile.name[0]} />
        <NameLine text={profile.name[1]} />
      </h1>
      <p className={styles.lede} data-hero>
        {title(profile.roles[0])} focused on <span className={styles.accent}>Frontend</span> &{" "}
        <span className={styles.accent}>UI/UX</span>.
        <br />
        <span className={styles.muted}>Based in {title(profile.location)}.</span>
      </p>
      <a className={styles.scrollCue} href="#profile" data-hero>
        Open the file <span aria-hidden>↓</span>
      </a>
    </section>
  );
}

/**
 * A custom pointer that is also a light: a dot, a ring that trails it and a
 * soft glow over the page. Mouse only; the native cursor is hidden by CSS
 * under the same condition.
 */
function Cursor({ lift }: { lift: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  // A modal dialog sits in the browser's top layer, above any z-index. The
  // cursor joins that layer too, and is shown again after each dialog opens so
  // it stays on top.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    try {
      if (el.matches(":popover-open")) el.hidePopover();
      el.showPopover();
    } catch {
      // No popover support: the cursor stays under dialogs.
    }
  }, [lift]);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const d = dot.current!;
    const r = ring.current!;
    const g = glow.current!;
    const dx = gsap.quickTo(d, "x", { duration: 0.05 });
    const dy = gsap.quickTo(d, "y", { duration: 0.05 });
    const rx = gsap.quickTo(r, "x", { duration: 0.35, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: 0.35, ease: "power3.out" });
    const gx = gsap.quickTo(g, "x", { duration: 0.6, ease: "power3.out" });
    const gy = gsap.quickTo(g, "y", { duration: 0.6, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      gx(e.clientX);
      gy(e.clientY);
      d.dataset.on = r.dataset.on = g.dataset.on = "1";
      r.dataset.hover = (e.target as Element | null)?.closest?.("a,button,[role=button]")
        ? "1"
        : "";
    };
    const leave = () => {
      d.dataset.on = r.dataset.on = g.dataset.on = "";
    };
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <div ref={root} className={styles.cursor} popover="manual" aria-hidden>
      <div ref={glow} className={styles.cursorGlow} />
      <div ref={ring} className={styles.cursorRing} />
      <div ref={dot} className={styles.cursorDot} />
    </div>
  );
}

function SectionHead({ id, title: heading, meta }: { id: string; title: string; meta: string[] }) {
  return (
    <header className={styles.sectionHead} data-head>
      <h2 id={id}>
        <span>{heading}</span>
      </h2>
      <p className={styles.sectionMeta} aria-hidden data-meta>
        {meta.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <span className={styles.rule} aria-hidden data-rule />
    </header>
  );
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The projects: a slider of tall evidence cards (arrows, drag or trackpad,
 * with a progress readout), or a plain list.
 */
function EvidenceBoard({ onOpen }: { onOpen: (p: Project) => void }) {
  const [view, setView] = useState<"slider" | "list">("slider");
  const [current, setCurrent] = useState(1);
  const track = useRef<HTMLUListElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean; down: boolean } | null>(null);
  const switched = useRef(false);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 280) + 24), behavior: "smooth" });
  };

  // The progress bar is a scroll thumb, sized to the visible share of the track.
  const measure = () => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const p = max > 0 ? el.scrollLeft / max : 0;
    thumb.current?.style.setProperty(
      "--share",
      String(Math.min(1, el.clientWidth / el.scrollWidth)),
    );
    thumb.current?.style.setProperty("--progress", String(p));
    setCurrent(Math.round(p * (realProjects.length - 1)) + 1);
  };
  useEffect(() => {
    if (view !== "slider") return;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [view]);

  // Changing view deals the new layout in, then re-measures the page below.
  const choose = (next: typeof view) => {
    if (next === view) return;
    switched.current = true;
    setView(next);
  };
  useEffect(() => {
    if (!switched.current) return;
    switched.current = false;
    ScrollTrigger.refresh();
    const items = body.current?.firstElementChild?.children;
    if (items && !reducedMotion())
      gsap.from(items, { y: 28, autoAlpha: 0, duration: 0.6, stagger: 0.05, ease: "power3.out" });
  }, [view]);

  // A mouse drag scrolls the track; a drag never counts as a click on a card.
  const grab = (e: ReactPointerEvent<HTMLUListElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false, down: true };
  };
  const pull = (e: ReactPointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d?.down) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.dataset.dragging = "";
    }
    e.currentTarget.scrollLeft = d.left - dx;
  };
  const release = (e: ReactPointerEvent<HTMLUListElement>) => {
    if (drag.current) drag.current.down = false;
    delete e.currentTarget.dataset.dragging;
  };
  return (
    <section id="evidence" className={styles.section} aria-labelledby="evidence-title">
      <SectionHead
        id="evidence-title"
        title="Evidence Board"
        meta={["SECTOR: WEB · VIDEO", "SCANNING: ACTIVE"]}
      />
      <div className={styles.toolbar}>
        <div className={styles.toggle} role="group" aria-label="View">
          <button aria-pressed={view === "slider"} onClick={() => choose("slider")}>
            Slider
          </button>
          <button aria-pressed={view === "list"} onClick={() => choose("list")}>
            List
          </button>
        </div>
        {view === "slider" && (
          <div className={styles.sliderNav}>
            <span className={styles.counter} aria-hidden>
              <span className={styles.accent}>{pad(current)}</span> / {pad(realProjects.length)}
            </span>
            <div className={styles.arrows}>
              <button aria-label="Previous evidence" onClick={() => step(-1)}>
                ‹
              </button>
              <button aria-label="Next evidence" onClick={() => step(1)}>
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      <p className={styles.boardNote} role="note">
        <strong>Note</strong> This board isn&apos;t up to date yet. There are more projects than the
        ones shown here; I&apos;m still working on putting them in.
      </p>
      <div ref={body}>
        {view === "slider" ? (
          <ul
            ref={track}
            className={styles.slider}
            data-stagger
            onScroll={measure}
            onPointerDown={grab}
            onPointerMove={pull}
            onPointerUp={release}
            onPointerCancel={release}
            onClickCapture={(e) => {
              if (!drag.current?.moved) return;
              e.preventDefault();
              e.stopPropagation();
              drag.current = null;
            }}
          >
            {realProjects.map((p, i) => (
              <li key={p.id}>
                <button className={styles.card} onClick={() => onOpen(p)} data-project-id={p.id}>
                  <Cover project={p} />
                  <span className={styles.cardCategory}>{p.category}</span>
                  <span className={styles.cardFoot}>
                    <span className={styles.cardNo}>EVIDENCE #{pad(i + 1)}</span>
                    <span className={styles.cardTitle}>{p.title}</span>
                    <span className={styles.cardMore}>
                      <span>
                        <span className={styles.cardLine}>{p.tagline ?? p.description}</span>
                        <span className={styles.cardOpen}>Open file →</span>
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ol className={styles.list}>
            {realProjects.map((p, i) => (
              <li key={p.id}>
                <button onClick={() => onOpen(p)} data-project-id={p.id}>
                  <span className={styles.listBg} aria-hidden>
                    <Cover project={p} />
                  </span>
                  <span className={styles.listMain}>
                    <span className={styles.listNo}>Evidence #{pad(i + 1)}</span>
                    <span className={styles.listTitle}>{p.title}</span>
                  </span>
                  <span className={styles.listCategory}>{p.category}</span>
                  <span className={styles.listOpen} aria-hidden>
                    [ Open file ] <span>→</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
        {view === "slider" && (
          <span className={styles.progress} aria-hidden>
            <span ref={thumb} />
          </span>
        )}
      </div>
      <p className={styles.archiveCount} aria-hidden>
        EVIDENCE ARCHIVE · <span className={styles.accent}>{pad(realProjects.length)} FILES</span>
      </p>
    </section>
  );
}

/** A project's cover: its first screenshot or video poster, or a frame of its video. */
function Cover({ project }: { project: Project }) {
  const media = cover(project);
  if (media?.kind === "image")
    return (
      <img className={styles.cardMedia} src={media.src} alt="" loading="lazy" draggable={false} />
    );
  if (media?.kind === "video")
    return (
      <video
        className={styles.cardMedia}
        src={`${media.src}#t=1`}
        muted
        playsInline
        preload="metadata"
        aria-hidden
      />
    );
  return <span className={styles.cardMedia} />;
}

/** The graphic design work: the posters, in a masonry wall; each opens full size. */
/** Every print the viewer pages through: the design work, then the merch. */
const archive = [...designWork, ...merchWork];

/** One print on the wall: its picture in a frame, its number and title under it. */
function PosterCard({
  piece,
  number,
  onOpen,
}: {
  piece: DesignPiece;
  number: number;
  onOpen: (piece: DesignPiece) => void;
}) {
  return (
    <button className={styles.poster} onClick={() => onOpen(piece)} data-poster-id={piece.file}>
      <span className={styles.posterImg}>
        <img src={designWorkUrl(piece.file)} alt="" loading="lazy" />
        <span className={styles.posterView} aria-hidden>
          View print ↗
        </span>
      </span>
      <span className={styles.posterMeta}>
        <span className={styles.posterNo}>#{pad(number)}</span>
        <span className={styles.posterTitle}>{piece.title}</span>
      </span>
    </button>
  );
}

function DesignArchive({ onOpen }: { onOpen: (piece: DesignPiece) => void }) {
  return (
    <section id="design" className={styles.section} aria-labelledby="design-title">
      <SectionHead
        id="design-title"
        title="Design Archive"
        meta={["SECTOR: GRAPHIC DESIGN", `PRINTS ON FILE: ${pad(archive.length)}`]}
      />
      <ul className={styles.posters} data-stagger>
        {designWork.map((piece, i) => (
          <li key={piece.file} data-feature={i === 0 || undefined}>
            <PosterCard piece={piece} number={i + 1} onOpen={onOpen} />
          </li>
        ))}
      </ul>

      <h3 className={styles.merchHead}>
        <span>Merch &amp; apparel</span>
        <small>Six designs, front and back</small>
      </h3>
      <ul className={styles.merchRow} data-stagger>
        {merchWork.map((piece, i) => (
          <li key={piece.file}>
            <PosterCard piece={piece} number={designWork.length + i + 1} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Icon files (public/images/tech, from Simple Icons) for the skills that have one. */
const TECH_ICONS: Record<string, string> = {
  HTML: "html5",
  CSS: "css3",
  JavaScript: "javascript",
  Angular: "angular",
  Tailwind: "tailwindcss",
  MySQL: "mysql",
  NestJS: "nestjs",
  PHP: "php",
  React: "react",
  Laravel: "laravel",
  Supabase: "supabase",
  "ASP.NET": "dotnet",
  "C#": "csharp",
  Figma: "figma",
  "Adobe Photoshop": "adobephotoshop",
  "Premiere Pro": "adobepremierepro",
  "After Effects": "adobeaftereffects",
  Canva: "canva",
  Git: "git",
  GitHub: "github",
  "Claude Code": "claude",
};

function SubjectProfile() {
  const skills = profileSkills.map((s) => ({ label: s.label, items: s.value.split(/,\s*/) }));
  return (
    <section id="profile" className={styles.section} aria-labelledby="profile-title">
      <SectionHead
        id="profile-title"
        title="Subject Profile"
        meta={["IDENTITY: CONFIRMED", "STATUS: ACTIVE"]}
      />
      <div className={styles.profile} data-stagger>
        <aside className={styles.panel}>
          <figure className={styles.mugshot}>
            <img src="/images/profile/subject-id.jpg" alt={`Portrait of ${fullName}`} />
            <figcaption aria-hidden>ID_MATCH 99.9%</figcaption>
          </figure>
          <div className={styles.nameplate}>
            <strong>{fullName}</strong>
            <span>SUBJECT NO. 404-A</span>
          </div>
          <dl className={styles.stats}>
            <div>
              <dt>Class</dt>
              <dd>{title(profile.roles[0])}</dd>
            </div>
            <div>
              <dt>Level</dt>
              <dd>{profile.status}</dd>
            </div>
            <div>
              <dt>Base</dt>
              <dd>{title(profile.location)}</dd>
            </div>
            <div>
              <dt>Post</dt>
              <dd>{experienceEntries[0]?.organization ?? "On file"}</dd>
            </div>
          </dl>
          <div className={styles.alert}>
            <span className={styles.alertKicker}>
              <span className={styles.dot} /> SYSTEM_ALERT
            </span>
            <strong>Open to work</strong>
            <span className={styles.alertFoot}>
              <span>// CONTRACTS: ENABLED</span>
              <span>[REMOTE_READY]</span>
            </span>
          </div>
        </aside>

        <div className={styles.panel}>
          <p className={styles.statement}>{profile.about}</p>
          <h3 className={styles.logHead}>// ACADEMIC_LOG [EDUCATION]</h3>
          <ul className={styles.log}>
            {degrees.map((e) => (
              <li key={e.id}>
                <span className={styles.logTitle}>
                  [{e.institution}] <span className={styles.badge}>{e.period}</span>
                </span>
                <span>{e.credential}</span>
              </li>
            ))}
          </ul>
          <h3 className={styles.logHead}>// FIELD_OPERATIONS [EXPERIENCE]</h3>
          <ul className={styles.log}>
            {experienceEntries.map((job) => (
              <li key={job.id}>
                <span className={styles.logTitle}>
                  [{job.organization}] <span className={styles.badge}>{job.period}</span>
                </span>
                <span>{job.role}</span>
                {job.summary && <span className={styles.muted}>{job.summary}</span>}
              </li>
            ))}
          </ul>
        </div>

        <aside className={styles.panel}>
          {skills.map((group) => (
            <div key={group.label} className={styles.skills}>
              <h3 className={styles.skillsHead}>{group.label}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>
                    {TECH_ICONS[item] && (
                      <span
                        className={styles.techIcon}
                        style={
                          { "--icon": `url(/images/tech/${TECH_ICONS[item]}.svg)` } as CSSProperties
                        }
                        aria-hidden
                      />
                    )}
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className={styles.skills}>
            <h3 className={styles.skillsHead}>Certifications</h3>
            <ul className={styles.certs}>
              {certificates.map((c) => (
                <li key={c.id}>
                  {c.title}
                  <span className={styles.muted}>
                    {c.issuer} · {c.year}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

const GLIMPSE = [
  {
    src: "/images/3d/office.jpg",
    title: "The office",
    note: "Walk the room: the evidence board on the wall, the filing cabinets, the lamp.",
  },
  {
    src: "/images/3d/dossier.jpg",
    title: "The dossier",
    note: "Open the subject's file on the desk and read the case.",
  },
  {
    src: "/images/3d/archive.jpg",
    title: "The archive",
    note: "Slide a disk into the terminal and play the work.",
  },
];

/**
 * A glimpse of the 3D version: a stage that cross-fades through three frames
 * from the office, with a list beside it. Each step runs five seconds (the
 * active step's bar fills, and finishing it moves on; hovering pauses it),
 * and any step can be picked. The stage is a door into the room.
 */
function ThreeDSection() {
  const [active, setActive] = useState(0);
  const next = () => setActive((i) => (i + 1) % GLIMPSE.length);
  return (
    <section
      id="office"
      className={styles.section}
      aria-labelledby="office-title"
    >
      <SectionHead
        id="office-title"
        title="The 3D Office"
        meta={["ROOM 01 · IMMERSIVE", "STATUS: OPEN"]}
      />
      <div className={styles.office} data-reveal>
        <a className={styles.stage} href={CASE_3D} aria-label="Enter the 3D office">
          {GLIMPSE.map((g, i) => (
            <img
              key={g.src}
              src={g.src}
              alt=""
              data-active={i === active || undefined}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
            />
          ))}
          <span className={styles.stageTag}>
            <span className={styles.dot} /> Live room · 3D
          </span>
          <span className={styles.stageCta}>
            Enter the office <span aria-hidden>→</span>
          </span>
        </a>

        <div className={styles.officeSide}>
          <p className={styles.officeLede}>
            The same case file, as a room you can walk through: a 1970s detective&apos;s office.
            Scroll to investigate.
          </p>
          <p className={styles.desktopNote}>
            The 3D office is available on desktop. Open this site on a computer with a mouse to
            walk through it.
          </p>
          <ol className={styles.steps}>
            {GLIMPSE.map((g, i) => (
              <li key={g.src}>
                <button
                  onClick={() => setActive(i)}
                  data-active={i === active || undefined}
                  aria-current={i === active}
                >
                  <span className={styles.stepNo}>{pad(i + 1)}</span>
                  <span className={styles.stepTitle}>{g.title}</span>
                  <span className={styles.stepNote}>{g.note}</span>
                  <span className={styles.stepBar} aria-hidden>
                    <span onAnimationEnd={next} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/** Line icons (24px grid), one per kind of link. */
const ICONS = {
  mail: (
    <>
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </>
  ),
  linkedin: (
    <>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <path d="M2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </>
  ),
  github: (
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.4 3.4 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.4 5.4 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.4 13.4 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.4 5.4 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.4 3.4 0 0 0 9 18.13V22" />
  ),
};

/** Every way to reach the subject: the two addresses, then the profiles. */
const channels = [
  ...contact.emails.map((e) => ({
    icon: ICONS.mail,
    label: e.label,
    title: `${e.label} email: ${e.address}`,
    href: `mailto:${e.address}`,
    external: false,
  })),
  ...contact.links.map((l) => ({
    icon: /linkedin/i.test(l.label) ? ICONS.linkedin : ICONS.github,
    label: l.label,
    title: `${l.label}: ${l.url.split("/").filter(Boolean).pop()}`,
    href: l.url,
    external: true,
  })),
];

const FOOTER_LINKS = [
  ["Profile", "#profile"],
  ["Evidence board", "#evidence"],
  ["Design archive", "#design"],
  ["The 3D office", "#office"],
  ["Contact", "#contact"],
] as const;

/** The time in Cebu, to the second. */
function CebuTime() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <time dateTime={now.toISOString()}>
      {now.toLocaleTimeString("en-GB", { timeZone: "Asia/Manila" })}
    </time>
  );
}

/**
 * The ending: the question, the address as the biggest thing on the page (a
 * link, with a copy button), the two ways to act on it, and the footer: who,
 * where to go on the site, where else to find the subject, and the time in
 * Cebu.
 */
function Contact() {
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const save = async () => {
    setSaving(true);
    try {
      await downloadResume();
    } finally {
      setSaving(false);
    }
  };
  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      window.setTimeout(() => setCopied((c) => (c === address ? null : c)), 1800);
    } catch {
      // Clipboard blocked: the address is still a mailto link.
    }
  };

  return (
    <section id="contact" className={styles.contact} aria-labelledby="contact-title">
      <p className={styles.channel} data-reveal>
        <span className={styles.dot} /> Channel open
      </p>
      <h2 id="contact-title" className={styles.contactTitle} data-reveal>
        What if we worked together?
      </h2>

      <div className={styles.mailRows} data-reveal>
        {contact.emails.map((e) => (
          <div className={styles.mailRow} key={e.address}>
            <span className={styles.mailLabel}>{e.label}</span>
            <a className={styles.bigMail} href={`mailto:${e.address}`}>
              <span>{e.address}</span>
              <span className={styles.bigMailArrow} aria-hidden>
                ↗
              </span>
            </a>
            <button className={styles.copyMail} onClick={() => void copy(e.address)}>
              {copied === e.address ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.contactActions} data-reveal>
        <button className={styles.primary} onClick={save} disabled={saving}>
          {saving ? "Preparing…" : "Download resume"}
        </button>
        <a className={styles.secondary} href={`mailto:${contact.email}`}>
          Initiate contact
        </a>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <strong>{fullName}</strong>
            <span>
              {title(profile.roles.join(" & "))} · {title(profile.focus).replace("Ui/Ux", "UI/UX")}
            </span>
            <span className={styles.footerStatus}>
              <span className={styles.dot} /> Open to work
            </span>
          </div>

          <nav aria-label="Site">
            <h3>Navigate</h3>
            <ul>
              {FOOTER_LINKS.map(([label, href]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
              <li className={styles.only3d}>
                <a href={CASE_3D}>Enter the 3D office ↗</a>
              </li>
            </ul>
          </nav>

          <div>
            <h3>Elsewhere</h3>
            <ul className={styles.footerSocial}>
              {channels.map((c) => (
                <li key={c.href}>
                  <a
                    href={c.href}
                    title={c.title}
                    {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden>
                      {c.icon}
                    </svg>
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Local time</h3>
            <p className={styles.footerClock}>
              <CebuTime />
            </p>
            <p className={styles.footerPlace}>{title(profile.location)} (UTC+8)</p>
          </div>
        </div>

        <div className={styles.footerBar}>
          <span>
            © {new Date().getFullYear()} {fullName}
          </span>
          <span className={styles.footerMid}>Case 404 · File 404-A</span>
          <a href="#main">Back to top ↑</a>
        </div>
      </footer>
    </section>
  );
}

/** One design print full size, in a modal dialog. */
function PosterDialog({
  piece,
  onSelect,
  onClose,
}: {
  piece: DesignPiece | null;
  onSelect: (p: DesignPiece) => void;
  onClose: () => void;
}) {
  // The print opened up close (its file name), until clicked again or another is shown.
  const [zoomed, setZoomed] = useState<string | null>(null);
  const index = piece ? archive.indexOf(piece) : -1;
  const details = piece
    ? (
        [
          ["Client", piece.client],
          ["When", piece.when],
          ["Tools", piece.tools],
        ] as const
      ).filter(([, v]) => v)
    : [];
  return (
    <TerminalDialog
      id={piece?.file ?? null}
      cardAttr="data-poster-id"
      bg={piece ? designWorkUrl(piece.file) : null}
      label={piece?.title ?? "Print"}
      step="print"
      onStep={(dir) => {
        setZoomed(null);
        if (index >= 0) onSelect(archive[(index + dir + archive.length) % archive.length]);
      }}
      onClose={() => {
        setZoomed(null);
        onClose();
      }}
    >
      {piece && (
        <>
          <header className={styles.terminalHead} data-terminal-in>
            <div>
              <p>Top secret // decrypted</p>
              <p>
                Print #{pad(index + 1)} / {pad(archive.length)}
              </p>
            </div>
            <span className={styles.terminalBadge}>Graphic design</span>
          </header>
          <h3 className={styles.terminalTitle} data-terminal-in>
            {piece.title}
          </h3>
          <div className={styles.printGrid}>
            <figure
              className={styles.printFrame}
              data-terminal-in
              data-zoomed={zoomed === piece.file || undefined}
              onClick={() => setZoomed((z) => (z === piece.file ? null : piece.file))}
              onPointerMove={(e) => {
                // While zoomed, the picture follows the pointer: move to look around.
                const box = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--ox",
                  `${((e.clientX - box.left) / box.width) * 100}%`,
                );
                e.currentTarget.style.setProperty(
                  "--oy",
                  `${((e.clientY - box.top) / box.height) * 100}%`,
                );
              }}
            >
              <img src={designWorkUrl(piece.file)} alt={piece.title} />
              <figcaption aria-hidden>
                {zoomed === piece.file
                  ? "Click to zoom out · move to look around"
                  : "Click to zoom in"}
              </figcaption>
            </figure>
            <aside className={styles.meta} data-terminal-in>
              <h4>Metadata</h4>
              {piece.note && <p className={styles.printNote}>{piece.note}</p>}
              {details.length > 0 && (
                <dl>
                  {details.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </aside>
          </div>
        </>
      )}
    </TerminalDialog>
  );
}
