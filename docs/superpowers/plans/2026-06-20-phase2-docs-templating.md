# Phase 2 — Docs Templating (one manifest drives nav + build; kill drift) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a single manifest (`docs/nav.mjs`) the one source of the page list, so the left-nav rail and Vite's build inputs are generated from it and can never drift again (e.g. the currently-missing Keyboard link), while each page keeps its authored body and demo scripts.

**Architecture:** Add `docs/nav.mjs` exporting an ordered `pages` array (file, navLabel, title, icon SVG). `vite.config.mjs` derives `rollupOptions.input` from it and adds an inline `transformIndexHtml` plugin (`order: "pre"`) that replaces three placeholder comments in each page — `<!--#head-->`, `<!--#nav-->`, `<!--#scripts-->` — with generated chrome (per-page title, the full nav with active state + per-page-relative hrefs + icons, and the common script tail). Each page file is reduced to its authored body plus those three placeholders.

**Tech Stack:** Plain HTML/CSS, Vite 8 (built-in `transformIndexHtml` hook, no new deps), Node ESM.

## Global Constraints

- Plain HTML and CSS; two-space indentation for nested HTML. Class grammar unchanged (`.ds-*`, `.u-*`, `.is-*`, `data-*`).
- The nav rail's complete, correct order (from current `index.html`) is exactly: Overview, Foundations, Utilities, Patterns, Buttons, Forms & Inputs, Data Display, Feedback, Navigation, Keyboard, System & Theming.
- Per-page `<title>` values are fixed (verbatim): index = `Desktop Design System`; others = `<Name> — Desktop Design System` where two contain HTML entities: `Forms &amp; Inputs — Desktop Design System` and `System &amp; Theming — Desktop Design System`.
- The inline FOUC theme script must stay inline and first in the generated `<head>`, before the stylesheet link (runs pre-paint).
- Authored page bodies and any per-page demo `<script>...</script>` blocks must be PRESERVED unchanged. Only head inner, the nav element, and the trailing external `<script defer src=...>` tags become placeholders.
- The script tail is uniform for all pages: `sortable.min.js` then `ds.js` (both `defer`). The theme toggle handler stays in `ds.js` this phase (the ds.js/docs.js split is deferred to Phase 3).
- Relative paths differ by depth: index (root) uses no prefix; `pages/*` use `../`. This applies to the stylesheet link, the script srcs, and nav hrefs.
- Do NOT change `tokens.css`, `components.css`, or any `css/*` file; do NOT modify `js/ds.js` or `js/docs` in this phase.
- `dist/` stays gitignored; never commit it. The Phase 1 `copyStaticJs` plugin and `base: "./"` config stay as-is.
- Known tradeoff: after templating, opening a page directly from disk (`file://`) shows unrendered placeholders. The dev/build workflow (`npm run dev`) is the supported path; docs are updated to say so (Task 6).

---

### Task 1: Create the page manifest `docs/nav.mjs`

**Files:**
- Create: `docs/nav.mjs`

**Interfaces:**
- Produces: `export const pages` — an array of `{ file: string, navLabel: string, title: string, icon: string }`, ordered. `file` is the page path relative to repo root (`"index.html"` or `"pages/<name>.html"`). `icon` is a full `<svg>…</svg>` string. Consumed by `vite.config.mjs` (Task 2) and the inject-chrome plugin (Task 3).

- [ ] **Step 1: Write `docs/nav.mjs`** (icons copied verbatim from the current `index.html` nav rail)

```js
// Single source of truth for the docs page list + left-nav rail.
// Order here IS the rail order. Adding a page here adds it to the nav AND the
// Vite build (vite.config.mjs derives both from this file). icon = full <svg>.
export const pages = [
  {
    file: "index.html",
    navLabel: "Overview",
    title: "Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></g></svg>`
  },
  {
    file: "pages/foundations.html",
    navLabel: "Foundations",
    title: "Foundations — Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></g></svg>`
  },
  {
    file: "pages/utilities.html",
    navLabel: "Utilities",
    title: "Utilities — Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"/></svg>`
  },
  {
    file: "pages/patterns.html",
    navLabel: "Patterns",
    title: "Patterns — Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/></g></svg>`
  },
  {
    file: "pages/buttons.html",
    navLabel: "Buttons",
    title: "Buttons — Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><rect width="20" height="12" x="2" y="6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" rx="2"/></svg>`
  },
  {
    file: "pages/forms.html",
    navLabel: "Forms &amp; Inputs",
    title: "Forms &amp; Inputs — Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M12 12h.01M17 12h.01M7 12h.01"/></g></svg>`
  },
  {
    file: "pages/data-display.html",
    navLabel: "Data Display",
    title: "Data Display — Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>`
  },
  {
    file: "pages/feedback.html",
    navLabel: "Feedback",
    title: "Feedback — Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/></svg>`
  },
  {
    file: "pages/navigation.html",
    navLabel: "Navigation",
    title: "Navigation — Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></g></svg>`
  },
  {
    file: "pages/keyboard.html",
    navLabel: "Keyboard",
    title: "Keyboard — Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M8 13h.01M12 13h.01M16 13h.01M6 17h12"/></g></svg>`
  },
  {
    file: "pages/system.html",
    navLabel: "System &amp; Theming",
    title: "System &amp; Theming — Desktop Design System",
    icon: `<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0a2.34 2.34 0 0 0 3.319 1.915a2.34 2.34 0 0 1 2.33 4.033a2.34 2.34 0 0 0 0 3.831a2.34 2.34 0 0 1-2.33 4.033a2.34 2.34 0 0 0-3.319 1.915a2.34 2.34 0 0 1-4.659 0a2.34 2.34 0 0 0-3.32-1.915a2.34 2.34 0 0 1-2.33-4.033a2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></g></svg>`
  }
];
```

- [ ] **Step 2: Verify the manifest imports and is complete**

Run:
```bash
node --input-type=module -e "import {pages} from './docs/nav.mjs'; console.log(pages.length); console.log(pages.map(p=>p.file).join(','));"
```
Expected: prints `11` then the 11 file paths in the order above (index.html first, pages/system.html last).

- [ ] **Step 3: Verify every manifest file exists on disk**

Run:
```bash
node --input-type=module -e "import {pages} from './docs/nav.mjs'; import {existsSync} from 'node:fs'; const miss=pages.filter(p=>!existsSync(p.file)); console.log(miss.length? 'MISSING: '+miss.map(p=>p.file): 'all present');"
```
Expected: `all present`

- [ ] **Step 4: Commit**

```bash
git add docs/nav.mjs
git commit -m "Add docs/nav.mjs page manifest (single source for nav + build)"
```

---

### Task 2: Derive Vite build inputs from the manifest

**Files:**
- Modify: `vite.config.mjs` (replace the hardcoded `pages` array with an import from `docs/nav.mjs`)

**Interfaces:**
- Consumes: `pages` from `docs/nav.mjs` (Task 1).
- Produces: `rollupOptions.input` built from `pages.map(p => p.file)`. The inject-chrome plugin (Task 3) is added to the same file.

- [ ] **Step 1: Replace the hardcoded page array with the manifest import**

In `vite.config.mjs`, change the top imports and remove the hardcoded array. The imports become:
```js
import { resolve } from "node:path";
import { cpSync } from "node:fs";
import { defineConfig } from "vite";
import { pages } from "./docs/nav.mjs";
```
Then DELETE the entire hardcoded `const pages = [ ... ];` block (lines listing index.html … pages/utilities.html). The `copyStaticJs` function stays unchanged.

- [ ] **Step 2: Point `rollupOptions.input` at the manifest files**

In the `build.rollupOptions.input` mapping, the `pages.map((page) => ...)` currently maps over strings. Update it to map over the manifest objects' `file` property:
```js
      input: Object.fromEntries(
        pages.map((page) => [
          page.file.replace(/\.html$/, "").replace(/[/-]/g, "_") || "index",
          resolve(page.file)
        ])
      )
```

- [ ] **Step 3: Verify the build still produces all 11 pages**

Run: `npm run build 2>&1 | grep -E 'dist/(index|pages/)' | wc -l`
Expected: `11` (the build emits index.html + 10 pages; the "can't be bundled without type=module" warnings for ds.js/sortable are expected and harmless).

- [ ] **Step 4: Commit**

```bash
git add vite.config.mjs
git commit -m "Derive Vite build inputs from docs/nav.mjs"
```

---

### Task 3: Add the inject-chrome plugin and convert index.html + buttons.html (spike)

**Files:**
- Modify: `vite.config.mjs` (add the `injectChrome` plugin and register it)
- Modify: `index.html` (replace head inner, nav, trailing scripts with placeholders)
- Modify: `pages/buttons.html` (same)

**Interfaces:**
- Consumes: `pages` from `docs/nav.mjs`.
- Produces: the placeholder convention (`<!--#head-->`, `<!--#nav-->`, `<!--#scripts-->`) and the generation logic that all remaining pages (Task 4) rely on.

This task is the spike: it proves the path mechanics for BOTH depths (root `index.html` and a `pages/*` file) before converting the rest.

- [ ] **Step 1: Add the `injectChrome` plugin to `vite.config.mjs`**

Add this function next to `copyStaticJs` (above `export default defineConfig`):
```js
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
        if (!entry) throw new Error(`inject-chrome: no docs/nav.mjs entry for ${ctx.path}`);
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
            return `      <a class="ds-navi${active}" href="${href}">${p.icon}${p.navLabel}</a>`;
          })
          .join("\n");

        const nav =
`<nav class="ds-rail doc-nav">
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
<script defer src="${prefix}js/ds.js"></script>`;

        return html
          .replace("<!--#head-->", head)
          .replace("<!--#nav-->", nav)
          .replace("<!--#scripts-->", scripts);
      }
    }
  };
}
```

- [ ] **Step 2: Register the plugin**

Change the `plugins` line so both plugins run:
```js
  plugins: [injectChrome(), copyStaticJs()],
```

- [ ] **Step 3: Convert `index.html`**

Replace the entire `<head>` inner content (everything between `<head>` and `</head>` — the two meta tags, the FOUC script, the title, and the stylesheet link) with a single line so the head reads exactly:
```html
<head>
<!--#head-->
</head>
```
Replace the entire `<nav class="ds-rail doc-nav"> … </nav>` element (the brand, all nav links, spacer, theme toggle) with:
```html
    <!--#nav-->
```
At the end of the file, replace the trailing `<script defer src="js/ds.js"></script>` line with:
```html
<!--#scripts-->
```
Leave the `<!doctype html>`, `<html lang="en">`, `<body>`, the `<div class="doc">` / titlebar, the `<main>` body content, and the FOUC-unrelated structure untouched.

- [ ] **Step 4: Convert `pages/buttons.html`**

Do the same three replacements. The head becomes `<!--#head-->`; the nav element becomes `    <!--#nav-->`; and at the end replace the trailing `<script defer src="../js/ds.js"></script>` line with `<!--#scripts-->`. (buttons.html has no demo `<script>` block, so nothing else changes.)

- [ ] **Step 5: Build and verify both depths render correctly**

Run: `npm run build && echo "---" && grep -c "ds-navi" dist/index.html dist/pages/buttons.html`
Expected: build succeeds; both files report `11` (all 11 nav links present, including Keyboard).

- [ ] **Step 6: Verify per-page titles, active state, and per-depth relative paths in the built output**

Run:
```bash
echo "TITLES:"; grep -h "<title>" dist/index.html dist/pages/buttons.html
echo "ACTIVE index (expect href index.html):"; grep -o 'ds-navi is-active" href="[^"]*"' dist/index.html
echo "ACTIVE buttons (expect href buttons.html):"; grep -o 'ds-navi is-active" href="[^"]*"' dist/pages/buttons.html
echo "CSS refs:"; grep -o 'href="[^"]*assets/[^"]*\.css"' dist/index.html dist/pages/buttons.html
echo "JS refs:"; grep -o 'src="[^"]*js/ds\.js"' dist/index.html dist/pages/buttons.html
```
Expected:
- TITLES: `Desktop Design System` for index, `Buttons — Desktop Design System` for buttons.
- ACTIVE: index's single active link has `href="index.html"` (the Overview/self link); buttons' single active link has `href="buttons.html"` (its self link).
- CSS refs: index links a hashed `assets/*.css` with NO `../`; buttons links `../assets/*.css` (or `../` + hashed path) — i.e. the `pages/` file correctly points up one level.
- JS refs: index → `js/ds.js`; buttons → `../js/ds.js`.

- [ ] **Step 7: Verify the script tail and that buttons' nav hrefs are correct sibling paths**

Run:
```bash
echo "buttons nav hrefs:"; grep -o 'href="[^"]*"' dist/pages/buttons.html | grep -E 'html"' | head -12
echo "sortable present in both:"; grep -c "sortable.min.js" dist/index.html dist/pages/buttons.html
```
Expected: buttons' nav hrefs are `../index.html` for Overview and bare `foundations.html`, `buttons.html`, … for the `pages/*` siblings (no `pages/` prefix, no `../` on siblings); sortable appears once in each file.

- [ ] **Step 8: Commit**

```bash
git add vite.config.mjs index.html pages/buttons.html
git commit -m "Add inject-chrome plugin; templatize index + buttons (spike)"
```

---

### Task 4: Convert the remaining 9 pages

**Files:**
- Modify: `pages/foundations.html`, `pages/utilities.html`, `pages/patterns.html`, `pages/forms.html`, `pages/data-display.html`, `pages/feedback.html`, `pages/navigation.html`, `pages/keyboard.html`, `pages/system.html`

**Interfaces:**
- Consumes: the placeholder convention proven in Task 3.

For EACH of the nine files, apply the same three replacements as Task 3 Step 4, with one extra rule for the pages that have demo scripts.

- [ ] **Step 1: Replace the head inner with the placeholder in all 9 files**

In each file, replace everything between `<head>` and `</head>` (the two metas, FOUC script, title, stylesheet link) so the head reads:
```html
<head>
<!--#head-->
</head>
```

- [ ] **Step 2: Replace the nav element with the placeholder in all 9 files**

In each file, replace the entire `<nav class="ds-rail doc-nav"> … </nav>` element with:
```html
    <!--#nav-->
```

- [ ] **Step 3: Replace ONLY the trailing external script tags with the placeholder, preserving demo scripts**

In each file, at the end, replace the external `<script defer src="../js/ds.js"></script>` line — and, for `pages/data-display.html` ONLY, also the `<script defer src="../js/vendor/sortable.min.js"></script>` line that precedes it — with a single:
```html
<!--#scripts-->
```
CRITICAL: `pages/data-display.html`, `pages/feedback.html`, `pages/forms.html`, `pages/navigation.html`, and `pages/system.html` each contain a demo `<script> … </script>` block (inline JavaScript, not a `src=`). Do NOT remove or alter those blocks — they stay exactly where they are, immediately before the `<!--#scripts-->` placeholder.

- [ ] **Step 4: Verify no page still contains old static chrome**

Run:
```bash
echo "stray nav rails (expect 0):"; grep -lc 'class="ds-rail doc-nav"' pages/*.html | grep -v ':0' || echo none
echo "stray ds.js src tags (expect 0):"; grep -l 'src="../js/ds.js"' pages/*.html || echo none
echo "placeholders present (expect 10 each):"; grep -lc "<!--#nav-->" index.html pages/*.html | wc -l
```
Expected: no stray `ds-rail doc-nav` markup in source pages; no stray `../js/ds.js` src tags; all 11 source files (`wc -l` = 11) contain the nav placeholder.

- [ ] **Step 5: Verify demo inline scripts are preserved**

Run:
```bash
for f in pages/data-display.html pages/feedback.html pages/forms.html pages/navigation.html pages/system.html; do echo "$f inline <script> blocks:"; grep -c "<script>" "$f"; done
```
Expected: each of the five files still reports `1` (the demo block; the FOUC script moved into the generated head, so only the demo `<script>` remains as a bare `<script>` tag in the source body).

- [ ] **Step 6: Commit**

```bash
git add pages/foundations.html pages/utilities.html pages/patterns.html pages/forms.html pages/data-display.html pages/feedback.html pages/navigation.html pages/keyboard.html pages/system.html
git commit -m "Templatize remaining 9 docs pages"
```

---

### Task 5: Whole-site build + offline + drift verification gate

**Files:**
- None modified (verification only).

**Interfaces:**
- Consumes: all prior tasks.

- [ ] **Step 1: Clean build**

Run: `npm run build`
Expected: completes; emits `dist/index.html` and all 10 `dist/pages/*.html`. Only the expected ds.js/sortable "can't be bundled" warnings appear.

- [ ] **Step 2: Every page has the full 11-item nav including Keyboard (drift fixed)**

NOTE: a plain `grep -c "ds-navi"` is misleading on `index.html` because its body contains a
"live shell" DEMO with its own `ds-navi`/`is-active` markup. Scope the count to the actual
`<nav class="ds-rail doc-nav">…</nav>` rail with this node check:

```bash
node --input-type=module -e "
import {readFileSync} from 'node:fs';
const files=['dist/index.html',...['buttons','data-display','feedback','forms','foundations','keyboard','navigation','patterns','system','utilities'].map(s=>'dist/pages/'+s+'.html')];
let ok=true;
for(const f of files){const h=readFileSync(f,'utf8');const m=h.match(/<nav class=\"ds-rail doc-nav\">[\s\S]*?<\/nav>/);const rail=m?m[0]:'';const links=(rail.match(/ds-navi/g)||[]).length;const kbd=/href=\"[^\"]*keyboard\.html\"/.test(rail);const active=(rail.match(/is-active/g)||[]).length;if(links!==11||!kbd||active!==1){ok=false;console.log('BAD',f,'links',links,'keyboard',kbd,'active',active);}}
console.log(ok?'ALL 11 PAGES: 11 rail links, Keyboard present, exactly 1 active':'FAILURES ABOVE');
"
```
Expected: `ALL 11 PAGES: 11 rail links, Keyboard present, exactly 1 active` (the original drift bug is gone). This single check also covers Step 3 (active-state uniqueness within the rail).

- [ ] **Step 3: (covered by Step 2's rail-scoped check — exactly 1 `is-active` per rail)**

No separate command needed; Step 2 already asserts exactly one active nav item per page's rail.

- [ ] **Step 4: Fully offline — no CDN refs, local CSS/JS/fonts present**

Run:
```bash
echo "CDN refs (expect none):"; grep -rln "fonts.googleapis\|fonts.gstatic" dist/ || echo "NONE"
echo "hashed css + woff2:"; ls dist/assets/ | grep -E '\.css$|\.woff2$'
echo "JS copied:"; ls dist/js/ds.js dist/js/vendor/sortable.min.js
```
Expected: no CDN refs; one hashed `.css` plus both `.woff2` in `dist/assets/`; both JS files present.

- [ ] **Step 5: Manual browser check (dev server)**

Run `npm run dev`, open the printed URL. Verify on index + 3 pages (include `data-display` and `system`): the left nav is complete and identical on every page (Keyboard present), the active item matches the current page, the theme toggle still works, and the demo behaviors still run (data-display: the sortable table / live meter; system: theme/density/accent preview). Confirm DevTools Network shows no `fonts.googleapis.com`/`fonts.gstatic.com` requests. Stop the server.

- [ ] **Step 6: Commit (only if a verification fix was needed)**

```bash
git commit -am "Fix Phase 2 verification issue" || echo "nothing to commit"
```

---

### Task 6: Update contributor docs for the templated workflow

**Files:**
- Modify: `AGENTS.md` (the "Build, Test, and Development Commands" section)
- Modify: `README.md` (if it instructs opening `index.html` directly)

**Interfaces:**
- Consumes: nothing.

- [ ] **Step 1: Update `AGENTS.md`**

In `AGENTS.md`, the line that says to open `index.html` directly (`start index.html …`) is now inaccurate (pages contain placeholders that only render via the build). Replace that guidance so it reads:
```markdown
- `npm run dev`: start the Vite dev server and open the docs (pages are assembled from `docs/nav.mjs` + per-page bodies; opening the raw `.html` files directly no longer renders the nav/head).
```
Also add one line documenting the manifest:
```markdown
- To add or reorder a docs page, edit `docs/nav.mjs` — it drives both the left-nav rail and the Vite build inputs.
```

- [ ] **Step 2: Update `README.md` if needed**

Run: `grep -n "start index.html\|open index.html\|index.html in" README.md || echo "no direct-open instruction in README"`
If matches are found, update each to point at `npm run dev` instead of opening the file directly. If the command prints `no direct-open instruction in README`, make no change to README.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md README.md 2>/dev/null; git commit -m "Document docs/nav.mjs workflow; dev server replaces direct file open" || echo "nothing to commit"
```
