/**
 * Shared Three.js / R3F renderer configuration.
 * Centralized so ExperienceCanvas doesn't hardcode magic numbers.
 */
export const DPR_RANGE: [min: number, max: number] = [1, 1.5];

export const DEFAULT_CAMERA = {
  fov: 50,
  near: 0.1,
  far: 100,
} as const;
