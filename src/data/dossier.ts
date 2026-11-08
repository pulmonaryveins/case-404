export type DossierPageId = "case" | "experience" | "achievements";

/**
 * The case dossier's sheets, in order, as a stack on the right-hand side of
 * the open folder. `tab` is the section's name; `label` is the short word on
 * its index tab sticking out of the stack's right edge (DossierTabs). Each
 * sheet is painted by `paintDossierPage`; the left cover's prints stay put
 * whichever sheet is on top (DossierEvidence).
 *
 * `show` is off for Achievements until there are real awards to list (its
 * sheet and tab label are written): turn it on and the tab appears.
 */
const sheets: { id: DossierPageId; tab: string; label: string; show: boolean }[] = [
  { id: "case", tab: "Case info", label: "CASE", show: true },
  { id: "experience", tab: "Experience", label: "EXPERIENCE", show: true },
  { id: "achievements", tab: "Achievements", label: "AWARDS", show: false },
];

export const dossierPages = sheets.filter((sheet) => sheet.show);
