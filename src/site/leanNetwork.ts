/**
 * True on mobile data (or Data Saver / a slow link): the site then skips
 * background video fetches and only loads a clip when it is played.
 *
 * Wi-Fi and ethernet get the full experience. Browsers that don't report the
 * connection (all of iOS) can't be told apart, so a touch-only phone or tablet
 * there is treated as being on mobile data; desktops are treated as on Wi-Fi.
 */
export function isLeanNetwork(): boolean {
  const c = (
    navigator as Navigator & {
      connection?: { type?: string; saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (c?.type || c?.effectiveType || c?.saveData) {
    return c.type === "cellular" || !!c.saveData || /^(slow-)?[23]g$/.test(c.effectiveType ?? "");
  }
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}
