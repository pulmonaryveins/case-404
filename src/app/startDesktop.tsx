import { StrictMode } from "react";
import type { Root } from "react-dom/client";
import { App } from "./App";
import { gramophone } from "../experience/audio/gramophoneAudio";
import { preloadStartupAssets } from "../experience/loading/preloadAssets";

/** Starts the 3D experience: music, every startup download, then the app. */
export function start(root: Root) {
  // The music starts as the page loads (on the first click, key or tap where
  // the browser blocks sound until then).
  gramophone.autoplay();

  // Every startup download begins now, in parallel, and is counted for the loader.
  preloadStartupAssets();

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
