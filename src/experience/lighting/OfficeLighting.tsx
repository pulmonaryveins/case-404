/**
 * Phase 0: enough lighting to verify the scene renders. See ARCHITECTURE.md
 * "Lighting Philosophy" for the future tungsten/exterior/phosphor strategy —
 * cinematic lighting is Phase 2 work.
 */
export function OfficeLighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 2]} intensity={0.8} />
    </>
  );
}
