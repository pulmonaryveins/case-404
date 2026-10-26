import { useGLTF } from "@react-three/drei";
import startup from "./startupAssets.json";
import { installLoadTracking } from "./loadProgress";

/**
 * Starts every startup download at once, before React renders.
 *
 * Left to the scene, the files are asked for in waves (a component suspends, the
 * next one is only tried after it resolves), so the loader could neither know the
 * total nor show a steady percentage. Asking for all of them here makes the
 * downloads parallel and the total known from the start; the scene's own
 * `useGLTF` calls then find the models already in drei's cache, and the images,
 * fetched into the HTTP cache, are served from it when their `new Image()` runs.
 *
 * The list is startupAssets.json. Keep it in step with what the scene loads at
 * startup; in dev a stray request logs a warning.
 */
export function preloadStartupAssets() {
  installLoadTracking();
  for (const url of startup.glb) useGLTF.preload(url);
  for (const url of startup.images) {
    fetch(url)
      .then((res) => res.arrayBuffer())
      .catch(() => {});
  }
}
