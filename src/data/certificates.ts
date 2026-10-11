export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  year: string;
}

/**
 * Placeholder demo content. The first four hang as the framed achievements on
 * the shelf above the archive terminal (AchievementShelf), left to right.
 */
export const certificates: Certificate[] = [
  { id: "cert-1", title: "Frontend Development", issuer: "Placeholder Academy", year: "20XX" },
  { id: "cert-2", title: "UI/UX Design", issuer: "Placeholder Institute", year: "20XX" },
  { id: "cert-3", title: "Graphic Design", issuer: "Placeholder School of Arts", year: "20XX" },
  { id: "cert-4", title: "Video Editing", issuer: "Placeholder Film Lab", year: "20XX" },
];
