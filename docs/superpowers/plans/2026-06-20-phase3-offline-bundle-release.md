# Phase 3 — Offline Release Bundle + Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a single, versioned, fully-offline `dist/bundle/` any app can download (via GitHub Releases) and use without a network — bundled app CSS, self-hosted fonts, the component-runtime JS, and an icon set that the app can extend offline — and wire a CI workflow that zips it and attaches it to releases.

**Architecture:** A post-build Node script `tools/bundle.mjs` (using esbuild) bundles `src/design-language.css` into one app-facing stylesheet (+ minified) with fonts copied to stable names, copies the component JS, assembles `icons/` (curated registry + approved map + full offline Lucide catalog + a standalone generator + a render helper), and writes `README.md`/`VERSION`/`manifest.json`/licenses. A GitHub Actions workflow runs `npm run build`, zips `dist/bundle/`, and uploads the zip + SHA-256 to the Release. The `ds.js`→`docs.js` split deferred from Phase 2 lands here (so the shipped `ds.js` carries only component runtime).

**Tech Stack:** Node ESM, esbuild (new devDependency), Vite 8 (existing), GitHub Actions.

## Global Constraints

- Plain JS/CSS; ES modules. No new runtime dependencies in the shipped bundle (esbuild is build-time only).
- The app-facing `design-language.css` must contain the `@font-face` rules and the tokens→patterns layers, and must NOT contain `docs.css` (docs-only chrome). It is produced from `src/design-language.css` (which already excludes docs.css).
- Self-hosted fonts ship under `bundle/fonts/` with STABLE names (`sora-var.woff2`, `jetbrains-mono-var.woff2` — no content hash); `design-language.css` must reference them co-located as `fonts/<name>.woff2`.
- The shipped bundle JS is `ds.js` (component runtime) + `sortable.min.js` only. `docs.js` (theme-toggle, docs-only) is NOT shipped.
- Icon extend must be fully offline: the bundle ships `icons/lucide-catalog.json` (the full Lucide source) so `icons/extend-icons.mjs` regenerates `icons/registry.json` with no network and no npm install.
- OFL-1.1 font license text and `THIRD_PARTY_LICENSES.md` travel with the bundle.
- `dist/` (incl. `dist/bundle/`) stays gitignored; never commit build output. The local build emits the folder only — CI does the zip + SHA-256.
- Do NOT alter the Phase 1/Phase 2 behavior (offline docs, nav templating). The existing `tools/build-icons.mjs` and `icons:check` stay as-is for repo-internal registry generation.
- Theme contract for consumers (documented, not code): toggle `document.documentElement.dataset.theme` (`light` / absent=dark), persist under the `ds-theme` localStorage key, include the FOUC `<head>` snippet. The toggle UI is docs-only.

---

### Task 1: Split `ds.js` → `docs.js` (deferred from Phase 2)

**Files:**
- Create: `js/docs.js`
- Modify: `js/ds.js` (remove the theme-toggle block)
- Modify: `vite.config.mjs` (add `docs.js` to the injected script tail)

**Interfaces:**
- Produces: `js/docs.js` (docs-only theme toggle, loaded after `ds.js` on docs pages). `js/ds.js` becomes component-runtime-only (what the bundle ships in Task 4).

NOTE: `root` and `toggle` are used ONLY inside the theme-toggle block in `ds.js` (verified), so removing the whole block is safe.

- [ ] **Step 1: Create `js/docs.js`** with the theme-toggle IIFE

```js
/* Desktop Design System — docs-only behaviour (theme toggle).
   Loaded with `defer` after ds.js on docs pages only. NOT part of the shipped bundle. */
(function () {
  // ---- Theme toggle (persisted under localStorage 'ds-theme') ----
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.checked = root.getAttribute('data-theme') === 'light';
    toggle.addEventListener('change', function () {
      if (toggle.checked) {
        root.setAttribute('data-theme', 'light');
        try { localStorage.setItem('ds-theme', 'light'); } catch (e) {}
      } else {
        root.removeAttribute('data-theme');
        try { localStorage.setItem('ds-theme', 'dark'); } catch (e) {}
      }
    });
  }
})();
```

- [ ] **Step 2: Remove the theme-toggle block from `js/ds.js`**

In `js/ds.js`, delete lines 4–18 inclusive — the entire block from the comment
`// ---- Theme toggle (persisted under localStorage 'ds-theme') ----` through its closing
`}` and the blank line after it — so the file goes directly from `(function () {` (line 3)
to the `// ---- Combobox / styled select ----` section. Also update the header comment
(lines 1–2) to:
```js
/* Desktop Design System — component runtime (combobox, context menu, tree, splitter,
   sortable, focus-trap, roving-tabindex, dsAnnounce). Loaded with `defer`. */
```
Leave the rest of the file unchanged.

- [ ] **Step 3: Verify ds.js no longer references the toggle, and both files parse**

Run:
```bash
echo "themeToggle refs in ds.js (expect 0):"; grep -c "themeToggle" js/ds.js
echo "themeToggle refs in docs.js (expect 1):"; grep -c "themeToggle" js/docs.js
node --check js/ds.js && node --check js/docs.js && echo "both parse OK"
```
Expected: `0` for ds.js, `1` for docs.js, `both parse OK`.

- [ ] **Step 4: Add `docs.js` to the injected script tail in `vite.config.mjs`**

In the `injectChrome` plugin, change the `scripts` template literal so it loads docs.js after ds.js:
```js
        const scripts =
`<script defer src="${prefix}js/vendor/sortable.min.js"></script>
<script defer src="${prefix}js/ds.js"></script>
<script defer src="${prefix}js/docs.js"></script>`;
```

- [ ] **Step 5: Build and verify docs pages load docs.js and the toggle still works**

Run:
```bash
npm run build
echo "docs.js referenced (expect 11):"; grep -rl "js/docs.js" dist/index.html dist/pages/*.html | wc -l
echo "docs.js copied to dist:"; ls dist/js/docs.js
```
Expected: `11` pages reference `js/docs.js`; `dist/js/docs.js` exists (copied by the Phase 1 `copyStaticJs` plugin).

- [ ] **Step 6: Commit**

```bash
git add js/ds.js js/docs.js vite.config.mjs
git commit -m "Split docs-only theme toggle into js/docs.js; ds.js is now runtime-only"
```

---

### Task 2: Create the standalone offline icon generator `tools/extend-icons.mjs`

**Files:**
- Create: `tools/extend-icons.mjs`

**Interfaces:**
- Produces: a self-contained generator that reads `approved.json` + `lucide-catalog.json` (both resolved RELATIVE TO THE SCRIPT) and writes `registry.json` next to itself. Shipped to `bundle/icons/extend-icons.mjs` (Task 4). Output registry shape matches `tools/build-icons.mjs` exactly (`{source, style, icons:{name:{iconify, body}}}`).

- [ ] **Step 1: Write `tools/extend-icons.mjs`**

```js
#!/usr/bin/env node
// Offline icon-registry generator shipped in the design-language bundle.
// Reads ./approved.json and ./lucide-catalog.json (next to this script) and
// writes ./registry.json. No network and no npm install required.
//
// Usage (inside the bundle's icons/ folder):
//   1. Add entries to approved.json, e.g. "rocket": "lucide:rocket"
//   2. node extend-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const approved = JSON.parse(await readFile(resolve(here, "approved.json"), "utf8"));
const lucide = JSON.parse(await readFile(resolve(here, "lucide-catalog.json"), "utf8"));

function resolveIcon(name, seen = new Set()) {
  if (lucide.icons[name]) return lucide.icons[name];
  const alias = lucide.aliases?.[name];
  if (!alias) return null;
  if (seen.has(name)) throw new Error(`Circular icon alias for ${name}`);
  seen.add(name);
  return resolveIcon(alias.parent, seen);
}

const registry = {
  source: {
    catalog: "Iconify",
    collection: "lucide",
    license: approved.source.license,
    runtimeNetwork: false,
    generated: true
  },
  style: {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2
  },
  icons: {}
};

for (const [localName, iconifyName] of Object.entries(approved.icons)) {
  const [collection, iconName] = iconifyName.split(":");
  if (collection !== "lucide") throw new Error(`${localName} uses unsupported collection ${collection}`);
  const icon = resolveIcon(iconName);
  if (!icon) throw new Error(`Missing ${iconifyName} for local icon ${localName}`);
  registry.icons[localName] = { iconify: iconifyName, body: icon.body };
}

await writeFile(resolve(here, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Wrote registry.json with ${Object.keys(registry.icons).length} icons.`);
```

- [ ] **Step 2: Verify it parses**

Run: `node --check tools/extend-icons.mjs && echo "parses OK"`
Expected: `parses OK`

- [ ] **Step 3: Verify it regenerates a registry offline in a temp dir (no node_modules)**

Run:
```bash
rm -rf /tmp/extgen && mkdir -p /tmp/extgen
cp tools/extend-icons.mjs /tmp/extgen/
cp icons/approved.json /tmp/extgen/
cp node_modules/@iconify-json/lucide/icons.json /tmp/extgen/lucide-catalog.json
( cd /tmp/extgen && node extend-icons.mjs )
echo "registry has 'home' icon body:"; node --input-type=module -e "import {readFileSync} from 'node:fs'; const r=JSON.parse(readFileSync('/tmp/extgen/registry.json','utf8')); console.log(!!r.icons.home && r.icons.home.body.length>0);"
```
Expected: prints `Wrote registry.json with 38 icons.` then `true`.

- [ ] **Step 4: Verify its output matches the repo's `build-icons.mjs` output (same registry)**

Run: `diff <(cat icons/registry.json) <(cat /tmp/extgen/registry.json) && echo "IDENTICAL"`
Expected: `IDENTICAL` (the shipped generator produces byte-identical registry to the repo's generator for the same approved set).

- [ ] **Step 5: Commit**

```bash
git add tools/extend-icons.mjs
git commit -m "Add standalone offline icon-registry generator (shipped in bundle)"
```

---

### Task 3: Create the icon render helper `icons/icons.js`

**Files:**
- Create: `icons/icons.js`

**Interfaces:**
- Produces:
  - `iconSvg(name, registry, attrs = {}) -> string` — returns `<svg …>{body}</svg>` markup (pure; works in Node and browser). Throws on unknown name.
  - `createIcon(name, registry, attrs = {}) -> SVGElement` — browser DOM element.
  - Global shim `window.dsIcons = { iconSvg, createIcon }` for non-module consumers.
  Shipped to `bundle/icons/icons.js` (Task 4).

- [ ] **Step 1: Write `icons/icons.js`**

```js
// Render a registry icon by name. Framework-agnostic, zero dependencies.
//   import { iconSvg } from "./icons.js";
//   import registry from "./registry.json" with { type: "json" }; // or fetch it
//   el.innerHTML = iconSvg("home", registry);
// `registry` is the object produced by extend-icons.mjs (has .style and .icons).
export function iconSvg(name, registry, attrs = {}) {
  const entry = registry.icons[name];
  if (!entry) throw new Error(`Unknown icon: ${name}`);
  const s = registry.style;
  const merged = {
    viewBox: s.viewBox,
    fill: s.fill,
    stroke: s.stroke,
    "stroke-linecap": s.strokeLinecap,
    "stroke-linejoin": s.strokeLinejoin,
    "stroke-width": s.strokeWidth,
    ...attrs
  };
  const attrStr = Object.entries(merged)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<svg ${attrStr}>${entry.body}</svg>`;
}

export function createIcon(name, registry, attrs = {}) {
  const tpl = document.createElement("template");
  tpl.innerHTML = iconSvg(name, registry, attrs).trim();
  return tpl.content.firstElementChild;
}

// Global shim for non-module <script> consumers.
if (typeof window !== "undefined") {
  window.dsIcons = { iconSvg, createIcon };
}
```

- [ ] **Step 2: Verify it parses**

Run: `node --check icons/icons.js && echo "parses OK"`
Expected: `parses OK`

- [ ] **Step 3: Dogfood — render every registry icon via iconSvg and validate (Node, no DOM)**

Run:
```bash
node --input-type=module -e "
import { iconSvg } from './icons/icons.js';
import { readFileSync } from 'node:fs';
const reg = JSON.parse(readFileSync('icons/registry.json','utf8'));
let ok = true;
for (const name of Object.keys(reg.icons)) {
  const svg = iconSvg(name, reg);
  if (!svg.startsWith('<svg ') || !svg.includes(reg.icons[name].body) || !svg.includes('viewBox=\"0 0 24 24\"')) { ok=false; console.log('BAD', name); }
}
// unknown-name throws:
let threw=false; try { iconSvg('definitely-not-an-icon', reg); } catch { threw=true; }
console.log(ok && threw ? 'ALL '+Object.keys(reg.icons).length+' ICONS RENDER + unknown throws' : 'FAILURE');
"
```
Expected: `ALL 38 ICONS RENDER + unknown throws`

- [ ] **Step 4: Commit**

```bash
git add icons/icons.js
git commit -m "Add framework-agnostic icon render helper (iconSvg/createIcon)"
```

---

### Task 4: Build the bundle — `tools/bundle.mjs` + README + esbuild + version

**Files:**
- Create: `tools/bundle.mjs`
- Create: `tools/bundle-readme.md`
- Modify: `package.json` (add `version`, esbuild devDependency, `bundle` script)

**Interfaces:**
- Consumes: `src/design-language.css`, `assets/fonts/*`, `js/ds.js`, `js/vendor/sortable.min.js`, `icons/{registry.json,approved.json,icons.js}`, `tools/extend-icons.mjs`, `node_modules/@iconify-json/lucide/icons.json`, `package.json` version.
- Produces: `dist/bundle/` (the complete release artifact).

- [ ] **Step 1: Add a version, esbuild, and the `bundle` script to `package.json`**

Add a top-level `"version": "0.1.0",` field (e.g. right after `"private": true,`). Install esbuild as a dev dependency:
```bash
npm install -D esbuild
```
Then add to the `scripts` block:
```json
    "bundle": "node tools/bundle.mjs",
```

- [ ] **Step 2: Write `tools/bundle-readme.md`** (shipped as the bundle's README)

```markdown
# Desktop Design System — offline bundle

A self-contained, offline copy of the design language. No network or build step required to use.

## Contents

- `design-language.css` / `design-language.min.css` — the full stylesheet (tokens, base, components, utilities, patterns) with `@font-face` for the self-hosted fonts.
- `fonts/` — Sora + JetBrains Mono variable woff2 (referenced by the CSS).
- `ds.js` — component runtime (combobox, context menu, tree, splitter, sortable, focus-trap, roving-tabindex). Plain global script.
- `sortable.min.js` — dependency of the sortable behaviour.
- `icons/` — `registry.json` (offline SVG data), `approved.json` (name → Lucide id), `lucide-catalog.json` (full Lucide source for offline extension), `extend-icons.mjs` (generator), `icons.js` (render helper).
- `manifest.json`, `VERSION`, `THIRD_PARTY_LICENSES.md`.

## Use the CSS

Place `design-language.css` and the `fonts/` folder together (the CSS references `fonts/<name>.woff2` relative to itself), then:

```html
<link rel="stylesheet" href="design-language.css" />
```

## Theme

Dark by default. Toggle light mode by setting `data-theme` on the root element, and (optional) persist it:

```js
document.documentElement.dataset.theme = "light"; // remove the attribute for dark
localStorage.setItem("ds-theme", "light");        // or "dark"
```

To avoid a flash before paint, add this inline in `<head>` BEFORE the stylesheet:

```html
<script>try{if(localStorage.getItem('ds-theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}</script>
```

The toggle UI itself is yours to build — this bundle only defines the `data-theme` behaviour in the CSS.

## Use the JS

Load with `defer`, sortable before ds.js:

```html
<script defer src="sortable.min.js"></script>
<script defer src="ds.js"></script>
```

`ds.js` wires up matching elements when it loads. It does not re-scan after load, so add dynamic content before it runs (or re-create the relevant nodes).

## Icons

Render an approved icon by name:

```js
import { iconSvg } from "./icons/icons.js";
import registry from "./icons/registry.json" with { type: "json" };
element.innerHTML = iconSvg("home", registry);
```

### Add more Lucide icons (offline)

1. Add a name to `icons/approved.json`, e.g. `"rocket": "lucide:rocket"`.
2. Run `node icons/extend-icons.mjs` (uses the bundled `lucide-catalog.json` — no network).
3. `icons/registry.json` now includes your icon.
```

- [ ] **Step 3: Write `tools/bundle.mjs`**

```js
// Build the offline release bundle into dist/bundle/.
// Run after `vite build`. CI zips dist/bundle + publishes a SHA-256.
import { build } from "esbuild";
import { rm, mkdir, readFile, writeFile, readdir, copyFile } from "node:fs/promises";
import { dirname, resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist/bundle");
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const lucide = JSON.parse(await readFile(resolve(root, "node_modules/@iconify-json/lucide/icons.json"), "utf8"));

await rm(out, { recursive: true, force: true });
await mkdir(resolve(out, "fonts"), { recursive: true });
await mkdir(resolve(out, "icons"), { recursive: true });

// 1. App CSS — esbuild bundles the @import chain and copies woff2 with stable names.
const cssOpts = {
  entryPoints: [resolve(root, "src/design-language.css")],
  bundle: true,
  loader: { ".woff2": "file" },
  assetNames: "fonts/[name]",
  logLevel: "warning"
};
await build({ ...cssOpts, outfile: resolve(out, "design-language.css") });
await build({ ...cssOpts, outfile: resolve(out, "design-language.min.css"), minify: true });

// 2. Component-runtime JS (docs.js is NOT shipped).
await copyFile(resolve(root, "js/ds.js"), resolve(out, "ds.js"));
await copyFile(resolve(root, "js/vendor/sortable.min.js"), resolve(out, "sortable.min.js"));

// 3. Icons: curated registry + approved map + full offline catalog + generator + helper.
await copyFile(resolve(root, "icons/registry.json"), resolve(out, "icons/registry.json"));
await copyFile(resolve(root, "icons/approved.json"), resolve(out, "icons/approved.json"));
await copyFile(resolve(root, "node_modules/@iconify-json/lucide/icons.json"), resolve(out, "icons/lucide-catalog.json"));
await copyFile(resolve(root, "tools/extend-icons.mjs"), resolve(out, "icons/extend-icons.mjs"));
await copyFile(resolve(root, "icons/icons.js"), resolve(out, "icons/icons.js"));

// 4. Docs, licenses, version.
await copyFile(resolve(root, "tools/bundle-readme.md"), resolve(out, "README.md"));
await copyFile(resolve(root, "THIRD_PARTY_LICENSES.md"), resolve(out, "THIRD_PARTY_LICENSES.md"));
await copyFile(resolve(root, "assets/fonts/Sora-OFL.txt"), resolve(out, "fonts/Sora-OFL.txt"));
await copyFile(resolve(root, "assets/fonts/JetBrainsMono-OFL.txt"), resolve(out, "fonts/JetBrainsMono-OFL.txt"));
await writeFile(resolve(out, "VERSION"), `${pkg.version}\n`);

// 5. Manifest — list every file except manifest.json itself.
async function walk(dir) {
  const ents = await readdir(dir, { withFileTypes: true });
  const out2 = [];
  for (const e of ents) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out2.push(...await walk(p));
    else out2.push(relative(out, p).split("\\").join("/"));
  }
  return out2;
}
const files = (await walk(out)).sort();
const manifest = {
  name: pkg.name,
  version: pkg.version,
  generated: true,
  lucideCatalogVersion: lucide.lastModified ?? null,
  files
};
await writeFile(resolve(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Bundle written to dist/bundle (${files.length + 1} files).`);
```

- [ ] **Step 4: Run the bundle and verify all expected files exist**

Run:
```bash
npm run bundle
echo "--- tree ---"; find dist/bundle -type f | sort
```
Expected (17 files): `design-language.css`, `design-language.min.css`, `manifest.json`, `README.md`, `THIRD_PARTY_LICENSES.md`, `VERSION`, `ds.js`, `sortable.min.js`, `fonts/sora-var.woff2`, `fonts/jetbrains-mono-var.woff2`, `fonts/Sora-OFL.txt`, `fonts/JetBrainsMono-OFL.txt`, `icons/registry.json`, `icons/approved.json`, `icons/lucide-catalog.json`, `icons/extend-icons.mjs`, `icons/icons.js`.

- [ ] **Step 5: Verify the app CSS is correct (has @font-face + fonts ref, excludes docs chrome, min is smaller)**

Run:
```bash
echo "@font-face present:"; grep -c "@font-face" dist/bundle/design-language.css
echo "references fonts/ woff2:"; grep -o "fonts/[a-z-]*\.woff2" dist/bundle/design-language.css | sort -u
echo "excludes docs-only chrome (expect 0):"; grep -c "doc-nav\|doc-main\|doc-section" dist/bundle/design-language.css
echo "sizes:"; ls -l dist/bundle/design-language.css dist/bundle/design-language.min.css | awk '{print $5, $9}'
```
Expected: `@font-face` count ≥ 2; both `fonts/sora-var.woff2` and `fonts/jetbrains-mono-var.woff2` referenced; `0` docs-chrome selectors; `.min.css` is smaller than `.css`.

- [ ] **Step 6: Verify the manifest lists the files and stamps the Lucide version**

Run: `node --input-type=module -e "import {readFileSync} from 'node:fs'; const m=JSON.parse(readFileSync('dist/bundle/manifest.json','utf8')); console.log('version',m.version,'| files',m.files.length,'| lucide',m.lucideCatalogVersion!=null,'| has-css',m.files.includes('design-language.css'),'| no-manifest-self',!m.files.includes('manifest.json'));"`
Expected: `version 0.1.0 | files 16 | lucide true | has-css true | no-manifest-self true`.

- [ ] **Step 7: Commit**

```bash
git add tools/bundle.mjs tools/bundle-readme.md package.json package-lock.json
git commit -m "Add tools/bundle.mjs: assemble the offline release bundle"
```

---

### Task 5: Wire `build`→`bundle` and add the GitHub Actions release workflow

**Files:**
- Modify: `package.json` (`build` script also runs the bundle)
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: `tools/bundle.mjs` (Task 4).
- Produces: `npm run build` emits both the docs site and the bundle; a CI workflow that publishes the zipped bundle on a `v*` tag.

- [ ] **Step 1: Make `build` also run the bundle**

In `package.json`, change the `build` script to:
```json
    "build": "npm run icons:check && vite build && npm run bundle",
```

- [ ] **Step 2: Create `.github/workflows/release.yml`**

```yaml
name: Release bundle

on:
  push:
    tags:
      - "v*"

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run build
      - name: Package bundle + checksum
        run: |
          cd dist
          VERSION="$(cat bundle/VERSION)"
          ZIP="design-language-${VERSION}.zip"
          zip -r "$ZIP" bundle
          sha256sum "$ZIP" > "$ZIP.sha256"
          ls -l "$ZIP" "$ZIP.sha256"
      - name: Attach to release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            dist/design-language-*.zip
            dist/design-language-*.zip.sha256
```

- [ ] **Step 3: Verify the full build emits docs + bundle, and the workflow is well-formed**

Run:
```bash
npm run build >/tmp/fullbuild.log 2>&1 && echo "BUILD OK" || tail -20 /tmp/fullbuild.log
echo "docs built:"; ls dist/index.html >/dev/null && echo yes
echo "bundle built:"; ls dist/bundle/manifest.json >/dev/null && echo yes
echo "workflow parses as YAML:"; node --input-type=module -e "import {readFileSync} from 'node:fs'; const t=readFileSync('.github/workflows/release.yml','utf8'); if(!/on:\s/.test(t)||!/jobs:/.test(t)||!/npm run build/.test(t)) throw new Error('workflow missing keys'); console.log('workflow has on/jobs/build steps');"
```
Expected: `BUILD OK`, `yes`, `yes`, and `workflow has on/jobs/build steps`.

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/release.yml
git commit -m "Run bundle in build; add GitHub Actions release workflow"
```

---

### Task 6: Final verification — offline scratch-consumer test

**Files:**
- None modified (verification only).

**Interfaces:**
- Consumes: the full bundle from Task 4/5.

This simulates a downstream app using the bundle with NO network and NO node_modules.

- [ ] **Step 1: Clean full build**

Run: `npm run build`
Expected: completes; `dist/bundle/` present with 17 files (per Task 4 Step 4).

- [ ] **Step 2: Copy the bundle to an isolated temp dir (no node_modules nearby)**

Run:
```bash
rm -rf /tmp/consumer && mkdir -p /tmp/consumer
cp -r dist/bundle/* /tmp/consumer/
ls /tmp/consumer/icons
```
Expected: lists `approved.json extend-icons.mjs icons.js lucide-catalog.json registry.json`.

- [ ] **Step 3: Offline icon extend — add a new Lucide icon and regenerate**

Run:
```bash
node --input-type=module -e "
import {readFileSync,writeFileSync} from 'node:fs';
const p='/tmp/consumer/icons/approved.json';
const a=JSON.parse(readFileSync(p,'utf8'));
a.icons.rocket='lucide:rocket';
writeFileSync(p, JSON.stringify(a,null,2)+'\n');
"
( cd /tmp/consumer/icons && node extend-icons.mjs )
echo "rocket now in registry:"; node --input-type=module -e "import {readFileSync} from 'node:fs'; const r=JSON.parse(readFileSync('/tmp/consumer/icons/registry.json','utf8')); console.log(!!r.icons.rocket && r.icons.rocket.body.length>0);"
```
Expected: prints `Wrote registry.json with 39 icons.` then `true` — the registry was extended fully offline.

- [ ] **Step 4: Render the new icon via the shipped helper (offline)**

Run:
```bash
node --input-type=module -e "
import { iconSvg } from '/tmp/consumer/icons/icons.js';
import { readFileSync } from 'node:fs';
const r = JSON.parse(readFileSync('/tmp/consumer/icons/registry.json','utf8'));
const svg = iconSvg('rocket', r, { class: 'ds-icon' });
console.log(svg.startsWith('<svg ') && svg.includes('class=\"ds-icon\"') && svg.includes(r.icons.rocket.body) ? 'ICON RENDERS OK' : 'FAIL');
"
```
Expected: `ICON RENDERS OK`

- [ ] **Step 5: Verify the bundle CSS is self-contained and offline (no external URLs)**

Run:
```bash
echo "external URLs in bundle CSS (expect none):"; grep -o "https\?://[^)\"' ]*" dist/bundle/design-language.css dist/bundle/design-language.min.css || echo "NONE"
echo "fonts present next to CSS:"; ls /tmp/consumer/fonts/*.woff2
```
Expected: `NONE`; both woff2 files listed next to the CSS (co-located, as the CSS expects).

- [ ] **Step 6: Manual sanity (optional)**

Note for the human: to fully confirm, drop `design-language.css` + `fonts/` + `ds.js` into a throwaway HTML file in a real app and confirm components render with the correct fonts offline. Not scriptable here.

- [ ] **Step 7: Commit (only if a verification fix was needed)**

```bash
git commit -am "Fix Phase 3 verification issue" || echo "nothing to commit"
```
