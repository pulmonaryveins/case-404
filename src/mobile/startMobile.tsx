import { StrictMode } from "react";
import type { Root } from "react-dom/client";
import { MobileSite } from "./MobileSite";

/** Starts the plain portfolio for touch devices: no WebGL, no models, no music. */
export function start(root: Root) {
  root.render(
    <StrictMode>
      <MobileSite />
    </StrictMode>,
  );
}
