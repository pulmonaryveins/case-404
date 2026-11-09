import { createRoot } from "react-dom/client";
import "./styles/globals.css";

/**
 * Touch-only devices (phones, tablets) get the plain portfolio; anything with
 * a mouse gets the 3D office, however narrow its window. Each is its own
 * bundle, so a phone never downloads three.js, the models or the music.
 *
 * Two separate statements on purpose: written as one `a ? import() : import()`
 * expression, the build dropped the first branch's stylesheet from production.
 */
const touchOnly = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
const root = createRoot(document.getElementById("root")!);

async function startMobile() {
  const site = await import("./mobile/startMobile");
  site.start(root);
}

async function startDesktop() {
  const site = await import("./app/startDesktop");
  site.start(root);
}

void (touchOnly ? startMobile() : startDesktop());
