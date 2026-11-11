import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Site } from "./Site";

// The site: plain HTML and CSS, no WebGL. The immersive 3D case file is its
// own page (3d/index.html, src/main.tsx), linked from here.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Site />
  </StrictMode>,
);
