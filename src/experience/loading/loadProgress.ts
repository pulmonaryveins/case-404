import startup from "./startupAssets.json";
import sizes from "./assetSizes.json";

/**
 * What the loading screen reports, measured rather than guessed.
 *
 *  1. DOWNLOAD  every startup file (startupAssets.json) is requested at once, and
 *     its size is known before it arrives (assetSizes.json, written at build). A
 *     fetch wrapper counts the bytes as they stream in, so this part is
 *     `bytes received / bytes to receive`: it cannot jump back, and it does not
 *     depend on the order the scene happens to ask for things.
 *  2. ASSEMBLE  React builds the room from what arrived (painted textures
 *     included). Its length is not known in advance, so it eases toward its end
 *     and the scene-built event completes it.
 *  3. GPU       the first frames compile every material and upload every texture;
 *     each of those steps is counted (`gpuDone / gpuTotal`).
 *  4. READY     the first frames have drawn.
 */

export type LoadStage = "download" | "assemble" | "gpu" | "ready";

export interface LoadState {
  /** Bytes received / bytes expected, startup files only. */
  bytes: number;
  total: number;
  /** Files finished / files expected. */
  files: number;
  fileTotal: number;
  stage: LoadStage;
  gpuDone: number;
  gpuTotal: number;
  /** performance.now() when the download finished (starts the assemble ease). */
  downloadedAt: number | null;
}

/** Share of the bar each part owns. They add up to 1. */
export const WEIGHTS = { download: 0.45, assemble: 0.3, gpu: 0.23, ready: 0.02 } as const;

const expected = sizes as Record<string, number>;
const urls = [...startup.glb, ...startup.images];

let state: LoadState = {
  bytes: 0,
  total: urls.reduce((n, u) => n + (expected[u] ?? 0), 0),
  files: 0,
  fileTotal: urls.length,
  stage: "download",
  gpuDone: 0,
  gpuTotal: 0,
  downloadedAt: null,
};
const received = new Map<string, number>();
const finished = new Set<string>();
const listeners = new Set<() => void>();

function set(patch: Partial<LoadState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const loadProgress = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getState: () => state,
};

function recount() {
  let bytes = 0;
  for (const u of urls)
    bytes += finished.has(u)
      ? (expected[u] ?? 0)
      : Math.min(received.get(u) ?? 0, expected[u] ?? 0);
  const done = finished.size;
  const complete = done >= state.fileTotal;
  set({
    bytes,
    files: done,
    downloadedAt: complete ? (state.downloadedAt ?? performance.now()) : state.downloadedAt,
    stage: complete && state.stage === "download" ? "assemble" : state.stage,
  });
}

const pathOf = (input: RequestInfo | URL) => {
  const href = input instanceof Request ? input.url : String(input);
  try {
    return new URL(href, location.href).pathname;
  } catch {
    return href;
  }
};

/**
 * Wraps window.fetch so a startup file's bytes are counted as they stream (three's
 * loaders and the preloads below all go through fetch). Everything else passes
 * through untouched. Call once, before anything loads.
 */
export function installLoadTracking() {
  if (typeof window === "undefined" || typeof TransformStream === "undefined") return;
  // Once only: a hot reload of this module must not wrap the wrapper.
  if ((window as { __loadTracked?: boolean }).__loadTracked) return;
  (window as { __loadTracked?: boolean }).__loadTracked = true;
  const original = window.fetch.bind(window);
  const tracked = new Set(urls);
  window.fetch = async (input, init) => {
    const path = pathOf(input);
    if (!tracked.has(path)) {
      if (import.meta.env.DEV && /^\/(models|images)\//.test(path) && !warned.has(path)) {
        warned.add(path);
        console.warn(`[loading] ${path} is fetched at startup but not in startupAssets.json`);
      }
      return original(input, init);
    }
    try {
      const res = await original(input, init);
      if (!res.ok || !res.body) {
        finish(path);
        return res;
      }
      const counter = new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          received.set(path, (received.get(path) ?? 0) + chunk.byteLength);
          recount();
          controller.enqueue(chunk);
        },
        flush: () => finish(path),
      });
      return new Response(res.body.pipeThrough(counter), {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    } catch (error) {
      finish(path);
      throw error;
    }
  };
}
const warned = new Set<string>();

function finish(path: string) {
  if (finished.has(path)) return;
  finished.add(path);
  recount();
}

/** The scene is built (Suspense resolved): the assemble part is over. */
export function markSceneBuilt() {
  if (state.stage === "ready" || state.stage === "gpu") return;
  set({ stage: "gpu" });
}

/** GPU preparation: `done` of `total` steps finished. */
export function setGpuProgress(done: number, total: number) {
  set({ gpuDone: done, gpuTotal: total });
}

export function markReady() {
  set({ stage: "ready", gpuDone: state.gpuTotal });
}

/**
 * 0..1 for the whole load, from the measured parts. Monotonic by construction
 * (every input only grows), apart from the assemble ease, which is capped below
 * its own end until the scene reports built.
 */
export function overallProgress(s: LoadState, now = performance.now()): number {
  const net = s.total ? s.bytes / s.total : 1;
  const downloaded = s.stage !== "download";
  let assemble = 0;
  if (s.stage === "gpu" || s.stage === "ready") assemble = 1;
  else if (downloaded && s.downloadedAt !== null) {
    // Not knowable in advance, so it slows without ever stopping: 45% of its
    // share after 3 s, 70% after 10 s, 82% after 30 s. Reaching 90% would need
    // the build to take many minutes; the scene-built event completes it.
    const t = now - s.downloadedAt;
    assemble = 0.9 * (t / (t + 3000));
  }
  const gpu = s.stage === "ready" ? 1 : s.gpuTotal ? s.gpuDone / s.gpuTotal : 0;
  const ready = s.stage === "ready" ? 1 : 0;
  return (
    WEIGHTS.download * net + WEIGHTS.assemble * assemble + WEIGHTS.gpu * gpu + WEIGHTS.ready * ready
  );
}
