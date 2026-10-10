export type ProjectCategory = "Development" | "UI/UX" | "Graphic Design" | "Video Editing";

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  tools: string[];
  /** Live link or case study. Omit until there is one. */
  link?: string;
}

/**
 * Archive projects shown on the floppy-disk rack. Placeholder copy: replace
 * titles, descriptions, tools and links with the real work. The first three
 * of each category are shown; the rack holds three disks per tray.
 */
export const projects: Project[] = [
  {
    id: "dev-1",
    title: "Dev Project One",
    category: "Development",
    description: "Placeholder description of the first development project.",
    tools: ["React", "TypeScript", "Vite"],
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
];

export const archiveProjects = projects.filter(
  (p) => p.category === "Development" || p.category === "UI/UX",
);
