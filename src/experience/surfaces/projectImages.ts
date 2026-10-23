import type { Project } from "../../data/projects";

/**
 * Screenshots for the archive terminal's records, loaded once and kept. The
 * record page is painted from whatever has loaded; `version` goes up each time
 * another image arrives, so the terminal knows to paint the page again.
 */
const cache = new Map<string, HTMLImageElement>();
export const projectImages = { version: 0 };

/** Starts loading a project's screenshots (a disk going in): ready by the time its record shows. */
export function loadProjectImages(project: Project | null | undefined) {
  const srcs = [
    ...(project?.screenshots ?? []).map((s) => s.src),
    ...(project?.videos ?? []).map((v) => v.poster),
  ];
  for (const src of srcs) {
    if (cache.has(src)) continue;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      projectImages.version++;
    };
    img.src = src;
    cache.set(src, img);
  }
}

/** The screenshot if it has loaded, else null. */
export function loadedImage(src: string) {
  const img = cache.get(src);
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

/** How many of a project's screenshots and posters have loaded (part of its page's cache key). */
export function loadedCount(project: Project) {
  return (
    (project.screenshots ?? []).filter((s) => loadedImage(s.src)).length +
    (project.videos ?? []).filter((v) => loadedImage(v.poster)).length
  );
}
