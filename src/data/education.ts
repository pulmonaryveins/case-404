export interface EducationEntry {
  id: string;
  institution: string;
  credential: string;
  period: string;
}

/** Placeholder demo content. */
export const education: EducationEntry[] = [
  {
    id: "edu-1",
    institution: "Placeholder Institution",
    credential: "Placeholder Credential",
    period: "20XX–20XX",
  },
];
