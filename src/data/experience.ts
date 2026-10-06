export interface ExperienceEntry {
  id: string;
  role: string;
  organization: string;
  period: string;
  summary: string;
}

/** Placeholder demo content. */
export const experienceEntries: ExperienceEntry[] = [
  {
    id: "exp-1",
    role: "Placeholder Role",
    organization: "Placeholder Organization",
    period: "20XX–20XX",
    summary: "Placeholder experience summary.",
  },
];
