import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { DPR_RANGE, DEFAULT_CAMERA } from "../../lib/three";
import { CameraRig } from "../camera/CameraRig";
import { DetectiveOffice } from "../environment/DetectiveOffice";
import { OfficeLighting } from "../lighting/OfficeLighting";

/**
 * The ONE persistent R3F Canvas for the whole experience. Do not create
 * additional Canvas instances per portfolio section — the camera travels
 * through a single physical environment instead.
 */
export function ExperienceCanvas() {
  return (
    <Canvas
      dpr={DPR_RANGE}
      camera={{ fov: DEFAULT_CAMERA.fov, near: DEFAULT_CAMERA.near, far: DEFAULT_CAMERA.far }}
      gl={{ antialias: true }}
    >
      <CameraRig />
      <OfficeLighting />
      <Suspense fallback={null}>
        <DetectiveOffice />
      </Suspense>
    </Canvas>
  );
}
