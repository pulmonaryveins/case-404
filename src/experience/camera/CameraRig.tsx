import { useFrame } from "@react-three/fiber";
import { storyRig } from "../../story/storyRig";

/**
 * Copies the scroll-driven story rig onto the camera every frame. The rig
 * is tweened by GSAP in StoryController; nothing here touches React state.
 */
export function CameraRig() {
  useFrame(({ camera }) => {
    camera.position.set(...storyRig.camera);
    camera.lookAt(...storyRig.target);
  });
  return null;
}
