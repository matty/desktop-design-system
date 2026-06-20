import { resolve } from "node:path";
import { cpSync } from "node:fs";
import { defineConfig } from "vite";
import { pages } from "./docs/nav.mjs";

// Copy global (non-module) JS — ds.js, docs.js, vendored sortable — into the
// build output. Vite can't bundle IIFE scripts, and js/ isn't in publicDir,
// so without this they 404 in dist. Source js/ is untouched (dev + file:// keep working).
function copyStaticJs() {
  return {
    name: "copy-static-js",
    apply: "build",
    closeBundle() {
      cpSync(resolve("js"), resolve("dist/js"), { recursive: true });
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [copyStaticJs()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: false
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: false
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsDir: "assets",
    target: "es2022",
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [
          page.file.replace(/\.html$/, "").replace(/[/-]/g, "_") || "index",
          resolve(page.file)
        ])
      )
    }
  }
});
