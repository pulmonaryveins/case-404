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
    "A curious mind who turns ideas into meaningful digital experiences. I design, develop and create, bringing concepts to life through clean interfaces, thoughtful design and engaging visuals.",
};

/** Right-page records. Only ABOUT has content in Phase 4A. */
export const dossierTabs = ["ABOUT", "EDUCATION", "EXPERIENCE"] as const;
