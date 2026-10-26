import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Material, Mesh } from "three";
import { Texture } from "three";
import { markReady, markSceneBuilt, setGpuProgress } from "../loading/loadProgress";

/**
 * Mounts once the scene has resolved its Suspense (so every download is in), and
 * keeps the loading overlay up for the first frames, which compile shaders and
 * upload textures; otherwise the visitor would see an empty canvas.
 *
 * Frame 1 compiles every material and frame 2 uploads every texture in the scene,
 * including the archive desk's (rack, disks, polaroids, Wall-E), which are out of
 * view at the start; otherwise that work lands the first time the camera turns to
 * them, as a hitch. Frame 4 is ready. Each step reports to the loader. Normal
 * rendering is left on throughout: pausing it to compile in smaller pieces left
 * the room unlit. Not gl.compileAsync: it never resolved on some machines and
 * left the overlay stuck.
 */
export function SceneWarmup({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    markSceneBuilt();
    setGpuProgress(0, 4);
  }, []);

  useFrame(() => {
    frames.current++;
    if (frames.current === 1) {
      gl.compile(scene, camera);
      setGpuProgress(1, 4);
    }
    if (frames.current === 2) {
      const seen = new Set<Texture>();
      scene.traverse((o) => {
        const material = (o as Mesh).material as Material | Material[] | undefined;
        if (!material) return;
        for (const m of Array.isArray(material) ? material : [material]) {
          for (const value of Object.values(m)) {
            if (value instanceof Texture && !seen.has(value)) {
              seen.add(value);
              gl.initTexture(value);
            }
          }
        }
      });
      setGpuProgress(2, 4);
    }
    if (frames.current === 3) setGpuProgress(3, 4);
    if (frames.current === 4) {
      markReady();
      onReady();
    }
  });
  return null;
}
