import type { Chapter } from "./storyTypes";

/**
 * Chapter order/metadata only. No scroll ranges or scene state yet —
 * those are added when ScrollTrigger choreography is built.
 * CONTACT / CASE_SOLVED return to the main investigation zone.
 */
export const chapters: Chapter[] = [
  {
    id: "CASE_OPENED",
    label: "Case Opened",
    order: 0,
    zone: "mainInvestigation",
    cameraAnchor: "roomOverview",
  },
  {
    id: "EVIDENCE_BOARD",
    label: "Evidence Board",
    order: 1,
    zone: "mainInvestigation",
    cameraAnchor: "evidenceBoard",
  },
  {
    id: "SUBJECT_PROFILE",
    label: "Subject Identity",
    order: 2,
    zone: "mainInvestigation",
    cameraAnchor: "subjectProfile",
  },
  {
    id: "EDUCATION",
    label: "Education",
    order: 3,
    zone: "mainInvestigation",
    cameraAnchor: "education",
  },
  {
    id: "EXPERIENCE",
    label: "Experience",
    order: 4,
    zone: "mainInvestigation",
    cameraAnchor: "experience",
  },
  {
    id: "DIGITAL_ARCHIVE",
    label: "Digital Archive",
    order: 5,
    zone: "digitalArchive",
    cameraAnchor: "digitalArchive",
  },
  {
    id: "CREATIVE_EVIDENCE",
    label: "Creative Evidence",
    order: 6,
    zone: "creativeEvidence",
    cameraAnchor: "creativeEvidence",
  },
  {
    id: "CREDENTIALS",
    label: "Credential Evidence",
    order: 7,
    zone: "credentialEvidence",
    cameraAnchor: "credentials",
  },
  {
    id: "CONTACT",
    label: "Contact / Final File",
    order: 8,
    zone: "mainInvestigation",
    cameraAnchor: "contact",
  },
  {
    id: "CASE_SOLVED",
    label: "Case Solved",
    order: 9,
    zone: "mainInvestigation",
    cameraAnchor: "caseSolved",
  },
];
