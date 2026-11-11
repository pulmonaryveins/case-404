import { createRoot } from "react-dom/client";
import "./styles/globals.css";

/**
 * The 3D office (3d/index.html). Phones and tablets (touch only) get the
 * website instead (index.html, src/site): the 3D scene is for anything with a
 * mouse, however narrow its window. The 3D code is a separate bundle, so a
 * phone sent back to the website never downloads three.js, the models or the
 * music.
 */
const touchOnly = window.matchMedia("(hover: none) and (pointer: coarse)").matches;

if (touchOnly) {
  window.location.replace("/");
} else {
  void import("./app/startDesktop").then((m) =>
    m.start(createRoot(document.getElementById("root")!)),
  );
}
