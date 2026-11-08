import { useFrame } from "@react-three/fiber";
import { MathUtils } from "three";
import { storyRig } from "../../story/storyRig";

/**
 * Copies the scroll-driven story rig onto the camera every frame (blended toward
 * the terminal-screen close-up while it is focused). The rig
 * is tweened by GSAP in StoryController; nothing here touches React state.
 */
export function CameraRig() {
  useFrame(({ camera }, dt) => {
    const f = storyRig.screenFocus;
    f.amount = MathUtils.damp(f.amount, f.on ? 1 : 0, 5, dt);
    // Settled at either end: skip the blend so the story camera stays exact.
    const k = f.amount < 0.001 ? 0 : MathUtils.smootherstep(f.amount, 0, 1);
    const [cx, cy, cz] = storyRig.camera;
    const [tx, ty, tz] = storyRig.target;
    camera.position.set(
      MathUtils.lerp(cx, f.camera[0], k),
      MathUtils.lerp(cy, f.camera[1], k),
      MathUtils.lerp(cz, f.camera[2], k),
    );
    camera.lookAt(
      MathUtils.lerp(tx, f.target[0], k),
      MathUtils.lerp(ty, f.target[1], k),
      MathUtils.lerp(tz, f.target[2], k),
    );
  });
  return null;
}
