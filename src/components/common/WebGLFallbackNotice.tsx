/**
 * Minimal accessible fallback shown when the 3D experience cannot run.
 * Phase 0 scope only — a full non-WebGL portfolio presentation is future
 * work (see ARCHITECTURE.md "WebGL Fallback Strategy").
 */
export function WebGLFallbackNotice() {
  return (
    <main role="main" style={{ padding: "2rem", color: "var(--color-text)" }}>
      <h1>CASE 404</h1>
      <p>
        The interactive 3D experience couldn&apos;t start in this browser. Portfolio content will be
        made available here in an alternate, non-3D presentation.
      </p>
    </main>
  );
}
