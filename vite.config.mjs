import { resolve } from "node:path";
import { cpSync } from "node:fs";
import { defineConfig } from "vite";
import { pages } from "./docs/nav.mjs";

// Generate shared chrome from docs/nav.mjs into each page's placeholders.
// order:"pre" so injected <link>/<script> refs are seen by Vite's asset
// pipeline (bundled/hashed CSS; ds.js copied by copyStaticJs).
function injectChrome() {
  return {
    name: "inject-chrome",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const baseName = ctx.path.split("?")[0].split("/").pop() || "index.html";
        const entry = pages.find((p) => p.file.split("/").pop() === baseName);
        if (!entry) {
          // Real docs pages carry the chrome placeholders; if one is missing its nav entry, fail loudly.
          if (html.includes("<!--#head-->")) throw new Error(`inject-chrome: no docs/nav.mjs entry for ${ctx.path}`);
          return html; // not a docs page (e.g. Storybook's iframe.html) — leave untouched
        }
        const inPages = entry.file.startsWith("pages/");
        const prefix = inPages ? "../" : "";

        const head =
`<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script>try{if(localStorage.getItem('ds-theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}</script>
<title>${entry.title}</title>
<link rel="stylesheet" href="${prefix}src/design-language.docs.css" />`;

        const links = pages
          .map((p) => {
            const active = p.file === entry.file ? " is-active" : "";
            let href;
            if (!inPages) href = p.file;
            else if (p.file === "index.html") href = "../index.html";
            else href = p.file.replace("pages/", "");
            const current = active ? ' aria-current="page"' : "";
            return `      <a class="ds-navi${active}"${current} href="${href}">${p.icon}${p.navLabel}</a>`;
          })
          .join("\n");

        const nav =
`<nav class="ds-rail doc-nav" aria-label="Documentation">
      <div class="doc-nav-brand"><b>Desktop</b><span>Design System</span></div>
${links}
      <div class="ds-rail-spacer"></div>
      <div class="doc-theme-toggle">
        <svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        <label class="ds-switch"><input type="checkbox" id="themeToggle" aria-label="Toggle light theme" /><span class="ds-track"></span></label>
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      </div>
    </nav>`;

        const scripts =
`<script defer src="${prefix}js/vendor/sortable.min.js"></script>
<script defer src="${prefix}js/ds.js"></script>
<script defer src="${prefix}js/docs.js"></script>`;

        const titlebar =
`<div class="ds-titlebar">
    <div class="ds-titlebar-title">Desktop Design System</div>
    <div class="ds-winbtns">
      <button title="Minimize"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg></button>
      <button title="Maximize"><svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" rx="2"/></svg></button>
      <button class="is-close" title="Close"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg></button>
    </div>
  </div>`;

        for (const ph of ["<!--#head-->", "<!--#nav-->", "<!--#scripts-->", "<!--#titlebar-->"]) {
          if (!html.includes(ph)) throw new Error(`inject-chrome: missing ${ph} in ${ctx.path}`);
        }
        return html
          .replace("<!--#head-->", head)
          .replace("<!--#nav-->", nav)
          .replace("<!--#scripts-->", scripts)
          .replace("<!--#titlebar-->", titlebar);
      }
    }
  };
}

// Copy global (non-module) JS — ds.js, docs.js, vendored sortable — into the
// build output. Vite can't bundle IIFE scripts, and js/ isn't in publicDir,
// so without this they 404 in dist. Source js/ is untouched (dev + file:// keep working).
function copyStaticJs() {
  return {
    name: "copy-static-js",
    apply: "build",
    closeBundle() {
      cpSync(resolve("js"), resolve("dist/js"), { recursive: true });
      cpSync(resolve("LLM_GUIDE.md"), resolve("dist/LLM_GUIDE.md"));
    }
  };
}

export default defineConfig({
  base: "./",
  plugins: [injectChrome(), copyStaticJs()],
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
