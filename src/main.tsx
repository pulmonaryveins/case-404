import { createRoot } from "react-dom/client";
import "./styles/globals.css";

/**
 * Touch-only devices (phones, tablets) get the plain portfolio; anything with
 * a mouse gets the 3D office, however narrow its window. Each is its own
 * bundle, so a phone never downloads three.js, the models or the music.
 */
const touchOnly = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const root = createRoot(document.getElementById("root")!);

void (touchOnly ? import("./mobile/startMobile") : import("./app/startDesktop")).then((site) =>
  site.start(root),
);
