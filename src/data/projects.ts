export type ProjectCategory = "Development" | "UI/UX" | "Graphic Design" | "Video Editing";

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
}

/** Placeholder demo content. */
export const projects: Project[] = [
  {
    id: "proj-1",
    title: "Placeholder Project",
    category: "Development",
    description: "Placeholder description.",
  },
];
