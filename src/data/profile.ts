/**
 * Subject profile — revealed only when the dossier opens (never on the
 * evidence board). Copy is a first draft to be refined later.
 */
export interface Profile {
  name: [string, string];
  status: string;
  location: string;
  roles: string[];
  about: string;
  /** Portrait URL under public/. Leave undefined to show the placeholder slot. */
  photo?: string;
}

export const profile: Profile = {
  name: ["VINCE BRYANT", "CABUNILAS"],
  status: "IT STUDENT",
  location: "CEBU, PHILIPPINES",
  roles: ["UI/UX DESIGNER", "FRONTEND DEVELOPER"],
  about:
    "I build intuitive interfaces and tell visual stories through design and media. My work brings together frontend development, industry training and creative team leadership.",
};

export const profileSkills = [
  { label: "DEVELOPMENT", value: "React, JavaScript, HTML, CSS, Tailwind, MySQL" },
  { label: "DESIGN & MEDIA", value: "Figma, Photoshop, Premiere Pro" },
  { label: "WORKFLOW", value: "Vite, Git, GitHub" },
] as const;

/** Right-page records. Only ABOUT has content in Phase 4A. */
export const dossierTabs = ["ABOUT", "EDUCATION", "EXPERIENCE"] as const;
