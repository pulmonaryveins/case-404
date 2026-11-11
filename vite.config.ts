import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Connect, type Plugin } from "vite";

/**
 * `/3d` (no trailing slash) would fall through to the site's index.html, and
 * the visitor would get the website, with none of the 3D version's interface or
 * music. Send it to `/3d/`, in dev and in preview.
 */
const slashFor3d: Connect.NextHandleFunction = (req, res, next) => {
  if (req.url === "/3d" || req.url?.startsWith("/3d?")) {
    res.statusCode = 301;
    res.setHeader("Location", `/3d/${req.url.slice(3)}`);
    res.end();
    return;
  }
  next();
};
const trailingSlash3d: Plugin = {
  name: "case404-3d-trailing-slash",
  configureServer: (server) => void server.middlewares.use(slashFor3d),
  configurePreviewServer: (server) => void server.middlewares.use(slashFor3d),
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), trailingSlash3d],
  build: {
    // Two pages: the site (index.html, plain HTML and CSS, no WebGL) and the
    // immersive 3D case file (3d/index.html, served at /3d/). inspector.html
    // is a dev-only GLB inspection tool (see src/dev-inspector/), left out so
    // it never gets built or shipped.
    rollupOptions: {
      input: {
        site: fileURLToPath(new URL("./index.html", import.meta.url)),
        case3d: fileURLToPath(new URL("./3d/index.html", import.meta.url)),
      },
    },
  },
});
