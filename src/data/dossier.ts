export type DossierPageId = "case" | "education" | "experience" | "achievements";

/**
 * The case dossier's sheets, in order, as a stack on the right-hand side of
 * the open folder. `tab` is the section's name; `label` is the short word on
 * its index tab sticking out of the stack's right edge (DossierTabs). Each
 * sheet has its own two photographs and record card on the left cover
 * (DossierEvidence), and is painted by `paintDossierPage`.
 *
 * `show` is off for Achievements until there are real awards to list (its
 * sheet, tab label and left-cover items are all written): turn it on and the
 * tab appears.
 */
const sheets: { id: DossierPageId; tab: string; label: string; show: boolean }[] = [
  { id: "case", tab: "Case info", label: "CASE", show: true },
  { id: "education", tab: "Education", label: "EDUCATION", show: true },
  { id: "experience", tab: "Experience", label: "EXPERIENCE", show: true },
  { id: "achievements", tab: "Achievements", label: "AWARDS", show: false },
];

export const dossierPages = sheets.filter((sheet) => sheet.show);
