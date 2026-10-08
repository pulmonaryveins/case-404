export interface ExperienceEntry {
  id: string;
  role: string;
  organization: string;
  period: string;
  summary: string;
}

/** Condensed from the supplied portfolio records. */
export const experienceEntries: ExperienceEntry[] = [
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
    role: "Media Director / PR Officer",
    organization: "PSITS",
    period: "Sep 2023–Present",
    summary: "Led and mentored teams in design, photography and video.",
  },
  {
    id: "uc-cop",
    role: "Asst. Operations & Media Lead",
    organization: "UC Council of Presidents · Main Campus",
    period: "Apr 2023–Present",
    summary: "Coordinated university events, operations and media.",
  },
];
