export interface EducationEntry {
  id: string;
  institution: string;
  credential: string;
  period: string;
  /** One line under the credential: honours, focus, thesis. */
  detail?: string;
}

/** Newest first. */
export const education: EducationEntry[] = [
  {
    id: "uc-main",
    institution: "University of Cebu · Main Campus",
    credential: "Bachelor of Science in Information Technology",
    period: "2022–2026",
  },
  {
    id: "uc-shs",
    institution: "University of Cebu Pri SHS",
    credential: "Senior High School · STEM",
    period: "2020–2022",
  },
  {
    id: "smasn",
    institution: "St. Mary's Academy of San Nicolas",
    credential: "High School",
    period: "2016–2020",
  },
];
