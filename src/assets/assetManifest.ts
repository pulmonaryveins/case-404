import type { Vector3Tuple } from "../types/common";

export type AssetCategory = "environment" | "furniture" | "workstation" | "dossier" | "props";

export type PreloadPriority = 1 | 2 | 3 | 4 | 5;

export interface ManifestAsset {
  id: string;
  url: string;
  category: AssetCategory;
  preloadPriority: PreloadPriority;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  castShadow: boolean;
  receiveShadow: boolean;
  attribution?: {
    creator: string;
    sourceUrl: string;
    license: string;
  };
}

/**
 * Centralized asset configuration. Scene components look up models by id
 * here rather than hardcoding `public/models/...` paths.
 *
 * Empty in Phase 0 — no production GLBs have been approved yet. Phase 1
 * populates this after the source-asset audit (see assets-source/case-404).
 */
export const assetManifest: ManifestAsset[] = [];
