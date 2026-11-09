import { StrictMode } from "react";
import type { Root } from "react-dom/client";
import { MobileSite } from "./MobileSite";

/** Faces for the plain site only: the 3D office has its own and never loads these. */
const FONTS =
  "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@800" +
  "&family=Courier+Prime:wght@400;700&family=Newsreader:opsz,wght@6..72,400&display=swap";

function loadFonts() {
  for (const [rel, href] of [
    ["preconnect", "https://fonts.gstatic.com"],
    ["stylesheet", FONTS],
  ]) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (rel === "preconnect") link.crossOrigin = "";
    document.head.append(link);
  }
}

/** Starts the plain portfolio for touch devices: no WebGL, no models, no music. */
export function start(root: Root) {
  loadFonts();
  root.render(
    <StrictMode>
      <MobileSite />
    </StrictMode>,
  );
}
