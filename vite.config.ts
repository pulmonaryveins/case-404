import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // inspector.html is a dev-only GLB inspection tool (see
    // src/dev-inspector/). Pin the production entry to index.html so it
    // never gets built or shipped.
    rollupOptions: {
      input: fileURLToPath(new URL("./index.html", import.meta.url)),
    },
  },
});
