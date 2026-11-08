#!/usr/bin/env node
/**
 * Writes src/experience/loading/assetSizes.json: the byte size of every file in
 * startupAssets.json, so the loading screen knows its total before anything has
 * downloaded and its percentage is bytes received over bytes to receive.
 * Runs before `dev` and `build`; fails if a listed file is missing.
 */
import { readFileSync, statSync, writeFileSync } from "node:fs";

const { glb, images } = JSON.parse(readFileSync("src/experience/loading/startupAssets.json", "utf8"));
const sizes = {};
let total = 0;
for (const url of [...glb, ...images]) {
  try {
    sizes[url] = statSync("public" + url).size;
    total += sizes[url];
  } catch {
    console.error(`startupAssets.json lists ${url}, but public${url} does not exist`);
    process.exit(1);
  }
}
writeFileSync("src/experience/loading/assetSizes.json", JSON.stringify(sizes, null, 2) + "\n");
console.log(`assetSizes.json: ${Object.keys(sizes).length} files, ${(total / 1e6).toFixed(1)} MB`);
