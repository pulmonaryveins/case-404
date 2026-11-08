export interface ExperienceEntry {
  id: string;
  role: string;
  organization: string;
  period: string;
  /** One line about the post; left out where there is nothing to add yet. */
  summary?: string;
  /** What was done, one line each, listed under the title on the dossier. */
  bullets?: string[];
  /** Tools used, one line. */
  tools?: string;
}

/** Newest first: the dossier's Experience sheet. */
export const experienceEntries: ExperienceEntry[] = [
  {
    id: "ntv360-engineer",
    role: "Software Engineer",
    organization: "NTV360",
    period: "June 2026–Present",
    summary: "Builds and maintains software systems end to end.",
  },
  {
    id: "ntv360-intern",
    role: "Frontend Developer Intern",
    organization: "NTV360",
    period: "January–June 2026",
    summary: "Built and maintained frontend features for team systems.",
  },
  {
    id: "alliance",
    role: "Student Trainee · Jumpstart",
    organization: "Alliance Software Inc.",
    period: "Aug–Dec 2025",
    summary: "Built a food-ordering frontend with a development team.",
  },
  {
    id: "cesafi",
    role: "Graphic Designer",
    organization: "CESAFI Esports League",
    period: "Apr 2024–Aug 2025",
    summary: "Created event visuals for Cebu’s esports community.",
  },
  {
    id: "psits",
    role: "Media Director | Public Relations Officer",
    organization: "Philippine Society of Information Technology Students (PSITS)",
    period: "Sep 2023–2026",
    summary: "Led and mentored teams in design, photography and video.",
  },
  {
    id: "uc-cop",
    role: "Assistant Undersecretary for Operations Unit / Assistant Media Head",
    organization: "University of Cebu Council of Presidents – Main Campus",
    period: "Apr 2023–2026",
    summary: "Coordinated university events, operations and media.",
  },
];
