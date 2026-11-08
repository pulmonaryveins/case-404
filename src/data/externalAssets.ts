export interface ExternalAsset {
  id: string;
  name: string;
  type: "sketchfab-embed";
  modelId: string;
  pageUrl: string;
  embedUrl: string;
  role: string;
}

/**
 * Assets that live outside the GLB pipeline (see
 * assets-source/case-404/workstation/computer/ibm-pcjr-sketchfab.md).
 * Not rendered yet — Project Archive iframe integration is Phase 6.
 */
export const externalAssets: ExternalAsset[] = [
  {
    id: "ibm-pcjr-4863",
    name: "IBM PCjr 4863 Computer",
    type: "sketchfab-embed",
    modelId: "1c3c3cd0643d44d49a1771048da74c62",
    pageUrl:
      "https://sketchfab.com/3d-models/ibm-pcjr-4863-computer-1c3c3cd0643d44d49a1771048da74c62",
    embedUrl: "https://sketchfab.com/models/1c3c3cd0643d44d49a1771048da74c62/embed",
    role: "Project Archive workstation computer",
  },
];
