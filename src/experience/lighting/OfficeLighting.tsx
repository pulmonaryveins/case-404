import { ContactShadows } from "@react-three/drei";

/**
 * Room light. The only sources are the desk lamp (DeskLampLight, parented to
 * the lamp prop) and the moonlight through the window (MoonWindow). This file
 * adds nothing but a low hemisphere fill, so shadows stay dark grey rather than
 * black, and the soft grounding under the desk.
 */
export function OfficeLighting() {
  return (
    <>
      {/* Neutral-cool night fill, kept low so the lamp reads as the source:
          cool from above, deep charcoal from the floor, so corners and shadow
          interiors stay dark grey rather than crushing to black. */}
      <hemisphereLight args={["#8e97a6", "#2b2724", 0.95]} />

      {/* Grounding: soft occlusion under the desk feet, dense at contact and
          fading outward. Static scene, so it renders once (frames={1}). */}
      <ContactShadows
        position={[0.05, 0.002, -2.05]}
        scale={[3.2, 2.2]}
        far={0.9}
        blur={2.2}
        opacity={0.85}
        resolution={512}
        color="#000000"
        frames={1}
      />
    </>
  );
}
