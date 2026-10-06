import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { cameraAnchors } from "./cameraAnchors";

/**
 * Phase 0: positions the camera at the default development anchor.
 * Cinematic camera travel (push/pan/truck/tilt between anchors) is built
 * in Phase 4 once the physical office geometry exists.
 */
export function CameraRig() {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const anchor = cameraAnchors.roomOverview;
    camera.position.set(...anchor.position);
    camera.lookAt(...anchor.target);
  }, [camera]);

  return null;
}
