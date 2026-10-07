import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { cameraAnchors } from "./cameraAnchors";

/**
 * Phase 1B: applies the roomOverview anchor — the single established static
 * camera. FOV is set declaratively on the Canvas; this only places the
 * camera and aims it. Cinematic travel between anchors is Phase 4.
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
