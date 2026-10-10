import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { DPR_RANGE, DEFAULT_CAMERA } from "../../lib/three";
import { cameraAnchors } from "../camera/cameraAnchors";
import { CameraRig } from "../camera/CameraRig";
import { DetectiveOffice } from "../environment/DetectiveOffice";
import { OfficeLighting } from "../lighting/OfficeLighting";

/** Dev-only orbit controls for composing the scene: `?debug=1` in dev. */
const debugControls =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has("debug");

/**
 * Mounts only once the scene has resolved its Suspense. The first frames
 * compile shaders and upload textures, so the loading overlay stays up for a
 * few frames instead of revealing an empty canvas.
 *
 * Not gl.compileAsync: it never resolved on some machines and left the
 * overlay stuck at 90%.
 */
function FirstFrames({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 4) onReady();
  });
  return null;
}

/**
 * The ONE persistent R3F Canvas for the whole experience. Do not create
 * additional Canvas instances per portfolio section — the camera travels
 * through a single physical environment instead.
 */
export function ExperienceCanvas({ onReady }: { onReady: () => void }) {
  return (
    <Canvas
      dpr={DPR_RANGE}
      // PCFShadowMap, stated explicitly: three removed PCFSoftShadowMap (what
      // "soft" selects) and silently falls back to this anyway. Naming it
      // keeps the console clean and makes it clear that `shadow-radius` on
      // the lights is live — PCFSoft would have ignored it.
      shadows="percentage"
      camera={{
        fov: cameraAnchors.roomOverview.fov,
        near: DEFAULT_CAMERA.near,
        far: DEFAULT_CAMERA.far,
      }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.95;
      }}
    >
      <color attach="background" args={["#0a0908"]} />
      <CameraRig />
      <OfficeLighting />
      <Suspense fallback={null}>
        <DetectiveOffice />
        <FirstFrames onReady={onReady} />
      </Suspense>
      {debugControls && <OrbitControls makeDefault />}
    </Canvas>
  );
}
