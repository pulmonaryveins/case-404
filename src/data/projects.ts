export type ProjectCategory = "Development" | "UI/UX" | "Graphic Design" | "Video Editing";

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  tools: string[];
  /** Live link or case study. Omit until there is one. */
  link?: string;
  /** Clip played on the archive terminal when the disk is inserted. */
  video?: string;
  /** One line under the title on the record: what it is at a glance. */
  tagline?: string;
  /** Label/value rows at the top of the record (type, setting, subject...). */
  facts?: [string, string][];
  /**
   * The record's sections, each under its own heading: paragraphs (blank
   * line between) and/or a bulleted list. Without them the record shows
   * `description` under OVERVIEW.
   */
  sections?: { heading: string; text?: string; items?: string[] }[];
  /** Why it was made: shown under PURPOSE on the record. */
  purpose?: string;
  /** Screenshots (under public/), shown in a grid on the record. */
  screenshots?: { src: string; caption: string }[];
}

/**
 * Archive projects shown on the floppy-disk rack. Placeholder copy: replace
 * titles, descriptions, tools and links with the real work. The first three
 * of each category are shown; the rack holds three disks per tray.
 */
/** CC0 placeholder clip (MDN interactive-examples); swap per project for real work. */
const SAMPLE_REEL = "/videos/sample-reel.mp4";

export const projects: Project[] = [
  {
    id: "dev-1",
    title: "CASE 404",
    category: "Development",
    tagline: "An interactive 3D portfolio, told as an open case in a 1970s detective's office.",
    facts: [
      ["Type", "Interactive 3D portfolio"],
      ["Setting", "A detective's office, 1970s"],
      ["Subject", "Vince Bryant Cabunilas"],
      ["Status", "Open"],
    ],
    // Short form, for N.I.G.E.L.'s case file and anywhere a single line is wanted.
    description:
      "An interactive 3D portfolio told as an open case in a 1970s detective's office: the visitor follows the evidence board, the dossier and this archive terminal to find out who the subject is and what they have made.",
    sections: [
      {
        heading: "The case",
        text: "Case 404: subject not found. A file has landed on the detective's desk about someone nobody can quite place.\n\nThe visitor works it like a detective would. The evidence board shows what the subject does. The dossier on the desk reveals who they are, where they studied and where they have worked. This terminal holds the work itself, one disk per project.",
      },
      {
        heading: "The subject",
        text: "Vince Bryant Cabunilas: a UI/UX designer and frontend developer from Cebu, Philippines, now a software engineer at NTV360. The whole office is a portfolio of his work, and the way it is built is part of the evidence.",
      },
      {
        heading: "The detective",
        text: "The office belongs to an old detective, a German veteran of the Second World War. He came home in 1945, never quite stopped looking for answers, and has worked cases ever since. Thirty years of them are in this room.",
      },
      {
        heading: "His collection",
        items: [
          "An old musket on the wall above the evidence board",
          "A scale model of the battleship Bismarck on the shelf",
          "A gramophone on the file cabinet, still playing",
          "A Colt Python revolver and a box of .357 rounds on the desk",
          "A sheriff's star from a case abroad",
          "His fedora, his magnifying glass and an instant camera",
          "Some things that are not his: a little robot on this terminal and two blocky toy figures, which came in with the subject's file",
        ],
      },
      {
        heading: "How it works",
        items: [
          "Everything runs in real time in the browser, in 3D",
          "The camera follows the story as the visitor scrolls",
          "Papers, photos and screens are painted live on canvas",
          "The sound effects are synthesised as they play, and the music comes from the gramophone",
          "N.I.G.E.L., the records clerk on the red disk, answers questions about the subject through Google Gemini",
        ],
      },
    ],
    purpose:
      "To show the subject's work as a story instead of a list, so the portfolio is itself the evidence of what he can design and build.",
    tools: [
      "React",
      "TypeScript",
      "Three.js",
      "React Three Fiber",
      "Drei",
      "GSAP",
      "Lenis",
      "Zustand",
      "Vite",
      "Web Audio API",
      "Canvas 2D",
      "glTF-Transform",
      "Cloudflare Workers",
      "Google Gemini",
    ],
    screenshots: [
      { src: "/images/projects/development/case-404-1.webp", caption: "THE OFFICE" },
      { src: "/images/projects/development/case-404-2.webp", caption: "THE EVIDENCE BOARD" },
      { src: "/images/projects/development/case-404-3.webp", caption: "THE DOSSIER" },
      { src: "/images/projects/development/case-404-4.webp", caption: "THE ARCHIVE TERMINAL" },
      { src: "/images/projects/development/case-404-5.webp", caption: "N.I.G.E.L. ON THE CRT" },
      { src: "/images/projects/development/case-404-6.webp", caption: "THE DESIGN WALL" },
    ],
  },
  {
    id: "dev-2",
    title: "Dev Project Two",
    category: "Development",
    description: "Placeholder description of the second development project.",
    tools: ["React", "Tailwind", "MySQL"],
  },
  {
    id: "dev-3",
    title: "Dev Project Three",
    category: "Development",
    description: "Placeholder description of the third development project.",
    tools: ["JavaScript", "HTML", "CSS"],
  },
  {
    id: "ux-1",
    title: "UI/UX Project One",
    category: "UI/UX",
    description: "Placeholder description of the first UI/UX project.",
    tools: ["Figma", "Prototyping"],
  },
  {
    id: "ux-2",
    title: "UI/UX Project Two",
    category: "UI/UX",
    description: "Placeholder description of the second UI/UX project.",
    tools: ["Figma", "User research"],
  },
  {
    id: "ux-3",
    title: "UI/UX Project Three",
    category: "UI/UX",
    description: "Placeholder description of the third UI/UX project.",
    tools: ["Figma", "Design system"],
  },
  {
    id: "vid-1",
    title: "Video Project One",
    category: "Video Editing",
    description: "Placeholder description of the first video editing project.",
    tools: ["Premiere Pro", "After Effects"],
    video: SAMPLE_REEL,
  },
  {
    id: "vid-2",
    title: "Video Project Two",
    category: "Video Editing",
    description: "Placeholder description of the second video editing project.",
    tools: ["Premiere Pro", "After Effects"],
    video: SAMPLE_REEL,
  },
  {
    id: "vid-3",
    title: "Video Project Three",
    category: "Video Editing",
    description: "Placeholder description of the third video editing project.",
    tools: ["Premiere Pro", "After Effects"],
    video: SAMPLE_REEL,
  },
];

export const archiveProjects = projects.filter(
  (p) => p.category === "Development" || p.category === "UI/UX" || p.category === "Video Editing",
);
