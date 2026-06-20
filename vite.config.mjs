import { resolve } from "node:path";
import { defineConfig } from "vite";

const pages = [
  "index.html",
  "pages/buttons.html",
  "pages/data-display.html",
  "pages/feedback.html",
  "pages/forms.html",
  "pages/foundations.html",
  "pages/keyboard.html",
  "pages/navigation.html",
  "pages/patterns.html",
  "pages/system.html",
  "pages/utilities.html"
];

export default defineConfig({
  base: "./",
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
          page.replace(/\.html$/, "").replace(/[/-]/g, "_") || "index",
          resolve(page)
        ])
      )
    }
  }
});
