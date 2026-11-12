/**
 * True on mobile data (or Data Saver / a slow link): the site then skips
 * background video fetches and only loads a clip when it is played. Wi-Fi,
 * ethernet and browsers that don't report the connection (Safari) get the
 * full experience.
 */
export function isLeanNetwork(): boolean {
  const c = (
    navigator as Navigator & {
      connection?: { type?: string; saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  return (
    !!c && (c.type === "cellular" || !!c.saveData || /^(slow-)?[23]g$/.test(c.effectiveType ?? ""))
  );
}
