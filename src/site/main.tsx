import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Site } from "./Site";

// The page always opens at the top, where its intro plays: a reload would otherwise
// restore a deep scroll position under the loader (which locks scrolling), and the
// scroll reveals were measured against it.
history.scrollRestoration = "manual";
window.scrollTo(0, 0);

// The site: plain HTML and CSS, no WebGL. The immersive 3D case file is its
// own page (3d/index.html, src/main.tsx), linked from here.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Site />
  </StrictMode>,
);
