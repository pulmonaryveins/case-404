/**
 * Shadow maps are drawn on demand, not every frame (see ShadowDriver): the
 * room is still most of the time, and redrawing three shadow maps every frame
 * was the largest idle cost (about 700 extra draw calls per frame).
 *
 * Anything that casts a shadow and moves (a disk going into the drive, the
 * dossier opening, a sheet dropping, a poster turning, a drawer sliding) or a
 * light that changes calls `shadowsChanged` on each frame it moves; the maps
 * are redrawn until a moment after it stops, so they settle on its final
 * position.
 */
const shadows = { until: 0 };

/** Keep the shadow maps updating for at least `ms` more milliseconds. */
export function shadowsChanged(ms = 150) {
  const until = performance.now() + ms;
  if (until > shadows.until) shadows.until = until;
}

/** Whether the shadow maps should be redrawn this frame. */
export function shadowsDue() {
  return performance.now() <= shadows.until;
}
