import type { Chapter } from "./storyTypes";

/**
 * Chapter order/metadata only. No scroll ranges or scene state yet —
 * those are added when ScrollTrigger choreography is built (Phase 4+).
 */
export const chapters: Chapter[] = [
  { id: "CASE_OPENED", label: "Case Opened", order: 0, cameraAnchor: "roomOverview" },
  { id: "EVIDENCE", label: "Evidence", order: 1, cameraAnchor: "evidenceBoard" },
  { id: "SUBJECT_PROFILE", label: "Subject Profile", order: 2, cameraAnchor: "subjectProfile" },
  { id: "EDUCATION", label: "Education", order: 3, cameraAnchor: "education" },
  { id: "EXPERIENCE", label: "Experience", order: 4, cameraAnchor: "experience" },
  { id: "PROJECT_ARCHIVE", label: "Project Archive", order: 5, cameraAnchor: "workstation" },
  { id: "CREDENTIALS", label: "Credentials", order: 6, cameraAnchor: "credentials" },
  { id: "CONTACT", label: "Contact", order: 7, cameraAnchor: "contact" },
  { id: "CASE_SOLVED", label: "Case Solved", order: 8, cameraAnchor: "caseSolved" },
];
