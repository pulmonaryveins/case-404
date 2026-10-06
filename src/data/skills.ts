export interface Skill {
  id: string;
  label: string;
  discipline: "Frontend Development" | "UI/UX Design" | "Graphic Design" | "Video Editing";
}

/** Placeholder demo content. */
export const skills: Skill[] = [
  { id: "skill-1", label: "Placeholder Skill", discipline: "Frontend Development" },
];
