# Unified build → offline bundle + always-current docs

**Date:** 2026-06-19
**Status:** Approved (design) — pending implementation plans (3 phases)
**Revision:** 2 (incorporates parallel-review findings)

## Problem

The repository has two parallel, partially-overlapping systems that are not unified:

1. **Hand-authored docs** — `index.html` and `pages/*.html` link the six individual
   `css/*.css` files directly and load Sora + JetBrains Mono from the Google Fonts CDN
   (not offline).
2. **A Vite/`src` bundle path** — `src/design-language.css` and
   `src/design-language.docs.css` `@import` the same six files into bundled entries,
   plus an icon registry generator (`tools/build-icons.mjs`).

Consequences:

- **`dist` is broken.** The HTML pages reference raw `css/*.css` paths (and CDN fonts)
  instead of the bundled `src/*` entry, so Vite emits only one stray `docs-*.css` and the
  built pages are not coherent or self-contained. A stale `dist/` is also committed in the
  working tree and must be cleaned.
- **No release package.** An app built elsewhere cannot grab one versioned, offline-complete
  artifact (CSS + JS + icons + fonts); it must cherry-pick files.
- **Docs drift — already live.** Chrome (head, fonts, CSS links, nav rail, scripts) is
  duplicated across eleven HTML files. Confirmed bug: `pages/keyboard.html` exists and is
  linked from `index.html`'s nav, but is missing from the nav on every other `pages/*` file
  **and** missing from `vite.config.mjs`'s input array. This is the canonical drift to kill.

## Goals

1. **One unified build** that produces both a working docs site and a downloadable offline
   bundle from the same source.
2. **A consumable offline bundle** any app can download and use without network: bundled
   CSS, component JS behaviors, self-hosted fonts, and an extendable icon registry.
3. **Always-current docs** — shared chrome (especially the nav and the page list) generated
   from a single source so pages cannot drift.
4. **Fix `dist`** as part of the above.

## Non-goals

- Fully data-driven generation of doc pages from a component schema (too large a rewrite;
  loses the nuance of the hand-crafted showcase pages). Authored example bodies are kept.
- Replacing Vite. Vite stays the engine; it is fixed properly.
- Local zip tooling — packaging the zip is done in CI (GitHub Actions), not the local build.

## Decisions (from brainstorming + review)

| Topic | Decision |
|---|---|
| Distribution | **GitHub Releases artifact** — versioned zip attached to a Release, downloaded from a stable URL. |
| Fonts | **Self-host** Sora + JetBrains Mono as **variable woff2** (OFL-1.1; subsetting permitted) in the bundle; drop the Google Fonts CDN. Ship the OFL text. |
| Bundle scope | CSS (tokens→patterns), component JS behaviors, self-hosted fonts, icon assets — with an **offline-extendable** icon registry. |
| Icon extend | **Ship a generator tool + the full Lucide catalog as its offline input.** Runtime registry stays curated/small; regeneration needs no network and no npm install. |
| Docs build | **Minimal change** — generate the page list + shared chrome from one manifest; keep authored example bodies (including their per-page inline scripts). |
| Build engine | **Keep Vite, fix it properly** via an inline `transformIndexHtml` plugin with `order: 'pre'`. |
| Structure | **Three sequenced, independently shippable phases** (see below). |

## Phasing

The work is split into three plans, each independently verifiable and revertible. Later
phases depend on earlier ones.

- **Phase 1 — Fix + de-risk.** Self-host fonts, repoint every page at the bundled stylesheet,
  drop the CDN, clean the stale committed `dist/`, make `dist` build coherently.
- **Phase 2 — Templating.** `nav.json` as the single page list driving **both** the rendered
  nav **and** `rollupOptions.input`; partials + placeholder comments; the small `ds.js`
  theme-toggle split. Fixes the `keyboard.html` drift.
- **Phase 3 — Bundle + distribution.** `tools/bundle.mjs`, esbuild devDependency, the icon
  generator + catalog + `icons.js`, and the GitHub Actions Release workflow.

Each phase gets its own implementation plan via the writing-plans skill.

---

## Phase 1 — Fix + de-risk

### Source changes
- Add `assets/fonts/*.woff2` — self-hosted **variable** Sora + JetBrains Mono woff2 (one file
  per family). OFL-1.1; subsetting is permitted by the license (don't reuse Reserved Font
  Names; ship the OFL text). Committed binaries.
- Add `css/fonts.css` — `@font-face` rules referencing `assets/fonts/*.woff2` (relative
  `url()`), matching the `font-family` names already used in `tokens.css`.
- Add `css/fonts.css` to the `@import` chain of **`src/design-language.css`** (so both the
  docs CSS and the future app bundle carry `@font-face`).
- In every HTML head: remove the three Google Fonts `<link>`s and the six raw `css/*.css`
  `<link>`s; link the single bundled entry instead (`src/design-language.docs.css` for the
  docs site). Keep the inline FOUC theme script **inline and first** (it must run pre-paint;
  it must not be extracted/hashed).
- Add OFL-1.1 license text to the repo and reference it from `THIRD_PARTY_LICENSES.md`.

### Build
- Remove the stale committed `dist/` (step zero) and confirm `dist/` stays gitignored.
- `vite build` now emits one hashed CSS (the `@import` chain) plus hashed woff2 in
  `dist/assets/`, referenced correctly by every page.

### Verification
- `npm run dev` and `npm run build`: every page loads local fonts with **zero CDN
  requests**; `dist/` is self-contained and coherent.

---

## Phase 2 — Templating (kill drift)

### `docs/nav.json` — the single page manifest
One ordered list of pages, each: `{ slug, title, icon, order }`. (No `group` field — the rail
is flat today; add grouping/section headers only when actually wanted.)

- Drives **both** the rendered nav rail **and** `vite.config.mjs`'s `rollupOptions.input`
  (derived from this file — **mandatory**, not optional). Adding/removing a page touches one
  file. `keyboard.html` is added here and is the acceptance test (must appear in nav on every
  page and in the build).
- `icon` is a semantic name resolved via `icons/approved.json`/`registry.json` (each current
  nav item has a distinct Lucide icon — the manifest must reproduce them).
- Non-page links (e.g. `LLM_GUIDE.md` referenced from the index body) are **not** entries and
  must not be treated as Vite inputs.

### Partials + placeholders
Replace duplicated chrome in each page with placeholder comments; **preserve authored bodies
including their per-page inline scripts.**

- `<!--#head-->` → a **template** (not a static partial). Interpolates the page's `title`
  from `nav.json` (`X — Desktop Design System`, with the index special-cased to
  `Desktop Design System`), links the single bundled `src/design-language.docs.css`, and
  contains the inline FOUC script. Per-page title is templated, not shared.
- `<!--#nav-->` → nav rail rendered from `nav.json`: brand block, the link list (with icons +
  active state computed from the current page), the spacer, and the theme-toggle block. The
  **brand, spacer, and theme-toggle are static parts of the nav template**; only the link list
  comes from the manifest. The list is flat (no section headers today).
- `<!--#scripts-->` → the **common tail only** (`sortable.min.js` then `ds.js` then
  `docs.js`, in that order, all `defer`). Per-page inline `<script>` blocks (on `system`,
  `forms`, `feedback`, `navigation`, `data-display`) stay in the authored body, before this
  placeholder. `data-display`'s sortable need is satisfied by the common tail.

### Relative paths
The generator computes depth from the page being rendered: index links use `pages/<slug>.html`
and root asset paths; `pages/*` use `<slug>.html`, `../index.html`, and `../` asset prefixes.
With Vite `base: "./"`, injected asset/script references must be per-page-relative (never
absolute `/...`). This applies to the head links and the script tail, not just nav hrefs.

### The Vite plugin
Inline plugin in `vite.config.mjs` using `transformIndexHtml` with **`order: 'pre'`** (or the
`tags` return form) so injected `<link>`/`<script>` references are scanned, bundled, and
hashed by Vite. (A `normal`/`post` hook would emit raw, unhashed references and re-break
`dist` — this ordering is load-bearing.) The plugin fails `vite build` if a placeholder's
template/manifest entry is missing, or if a page is in `nav.json` with no source file (or vice
versa). In dev, such errors surface per-request in the overlay rather than as a hard exit.
Note: `vite preview` serves `dist/` statically and does not re-run the plugin — all chrome
must be fully materialized at build time (the inline-string approach satisfies this).

### `ds.js` split
`ds.js` is a single ~410-line IIFE, loaded `defer` on every page, that wires up at load with
no public re-init. Only the `#themeToggle` handler (~12 lines) is docs-coupled. Extract that
block into `js/docs.js`; everything reusable (combobox, context menu, tree, splitter, sortable
init, focus-trap, roving-tabindex, `dsAnnounce`) stays in `ds.js`. Do this as **its own commit
before** the templating rewrite so a regression is isolatable.

### Verification
- Every page shows complete, identical nav (Keyboard present everywhere) with correct icons
  and active state, in dark/light, compact density, keyboard focus, reduced motion.
- Per-page demos that rely on inline scripts still work.
- Removing/adding a page in `nav.json` updates nav and the build with no other edits.

---

## Phase 3 — Bundle + distribution

### `tools/bundle.mjs` (esbuild) → `dist/bundle/`
esbuild is added as an **explicit, pinned devDependency** (do not rely on it being transitive;
Vite 8 here is built on rolldown). The bundle step produces:

```
dist/bundle/
  design-language.css        # tokens→patterns + @font-face, app-facing (no docs CSS)
  design-language.min.css
  fonts/*.woff2              # stable names (assetNames: 'fonts/[name]', no hash)
  ds.js                      # component runtime only
  sortable.min.js
  icons/
    registry.json            # curated offline icon bodies (+ Lucide version stamped in source)
    approved.json            # curated name → Lucide id map
    lucide-catalog.json      # full Lucide source — offline input for the generator
    extend-icons.mjs         # generalized generator; reads app approved.json + local catalog
    icons.js                 # render-by-name helper (defined API; dogfooded by docs)
  README.md                  # usage, font layout, theme contract, icon-extend steps
  THIRD_PARTY_LICENSES.md    # incl. OFL-1.1 text for the fonts + Lucide ISC
  VERSION
  manifest.json              # version + file list + SemVer, for consumer pinning
```

- **CSS:** esbuild bundles `src/design-language.css` (resolves `@import`, rewrites `url()`),
  emitting app-facing `design-language.css` + a minified variant. Font output is pinned to
  stable `fonts/<name>.woff2` via `assetNames` (no content hash) so the app gets predictable
  filenames. The app-facing CSS excludes `docs.css`.
- **Consumer font layout (documented in README):** `design-language.css` must be served from a
  location where `./fonts/<name>.woff2` resolves (co-located `fonts/` folder).
- **JS contract (documented):** load `sortable.min.js` then `ds.js`, both `defer`, after the
  DOM. `ds.js` wires up at load and does not re-scan dynamically (no public re-init) —
  documented limitation for SPA consumers. Theme is the app's responsibility: toggle
  `document.documentElement.dataset.theme` (`light` / absent=dark), persist under the
  `ds-theme` localStorage key, and include the verbatim FOUC `<head>` snippet. The toggle UI
  is docs-only (it lives in `docs.js`).
- **Icon extend (offline):** the bundle ships `lucide-catalog.json` (full Lucide source).
  `extend-icons.mjs` (generalized from `tools/build-icons.mjs`) reads an app-provided
  `approved.json` and resolves names against the **local catalog** — no npm install, no
  network. `registry.json` records the Lucide collection version it was generated from.
  `icons.js` renders any registry entry by name into inline SVG, applying `registry.style`
  (viewBox/stroke). It ships as **ESM with a small global shim** (exact API defined in the
  Phase 3 plan). It is dogfooded by **one icon-gallery demo** (a section on `foundations.html`
  that renders the registry by name via `icons.js`) so it ships tested and documented — the
  ~288 existing hand-inlined SVGs across the docs are **left as-is** (no mass conversion).

### Distribution
- `package.json` `version` is the bundle version; stamped into `VERSION`, `manifest.json`, and
  the docs footer.
- GitHub Actions on tag/release: `npm ci` → `npm run build` → zip `dist/bundle/` →
  `design-language-<version>.zip` + a published **SHA-256 checksum** → attached to the Release.
  Local build emits the folder only; CI does the zip + checksum.

### npm scripts
| script | does |
|---|---|
| `dev` | Vite dev server with the templating plugin |
| `build` | `icons:check && vite build && node tools/bundle.mjs` → docs site **and** bundle |
| `preview` | preview the built docs |
| `bundle` | run `tools/bundle.mjs` standalone |
| `icons:build` / `icons:check` | unchanged |

### Verification
- A scratch consuming app: includes `design-language.css` offline and renders with local
  fonts; loads `ds.js` + `sortable.min.js` and exercises a combobox/sortable; runs
  `extend-icons.mjs` with an added Lucide name **with no network** and renders it via
  `icons.js`.

---

## Components and interfaces

- **`docs/nav.json`** — ordered page manifest `{slug,title,icon,order}`. Consumed by
  the Vite plugin (nav + title) and to derive `rollupOptions.input`.
- **Vite templating plugin** (`vite.config.mjs`, `order: 'pre'`) — input: page HTML + manifest
  + partials; output: complete, asset-bundled HTML per page at dev and build time.
- **`tools/bundle.mjs`** — input: `src/design-language.css`, `assets/fonts/*`, `js/ds.js`,
  `js/vendor/sortable.min.js`, `icons/*`, full Lucide catalog, `package.json` version; output:
  `dist/bundle/`.
- **`extend-icons.mjs`** (shipped) — input: app `approved.json` + local `lucide-catalog.json`;
  output: extended `registry.json`. Shares logic with `tools/build-icons.mjs`.
- **`icons.js`** (shipped) — input: a registry + an icon name; output: inline SVG element with
  `registry.style` applied.

## Error handling

- `icons:check` fails the build if `registry.json` is stale; retained before `vite build`.
- The Vite plugin fails `vite build` on missing placeholder template/manifest entry, or
  nav.json/source mismatch (per-request overlay error in dev).
- `tools/bundle.mjs` fails if any required source (font, JS, icon file, catalog) is missing
  rather than emitting a partial bundle.

## Testing (manual)

No automated framework exists. Verify per phase as listed above; the cross-cutting checks are
dark/light themes, compact density, keyboard focus, reduced motion, and (Phase 3) the
offline scratch-app flow.

## Resolved review findings (for traceability)

- Vite `transformIndexHtml` ordering → `order: 'pre'` required (Phase 2).
- `keyboard.html` drift → nav.json drives nav + inputs, mandatory (Phase 2).
- Non-uniform chrome (per-page titles, per-page inline scripts, per-item icons) → head is a
  template, scripts placeholder is common-tail-only, manifest has `icon` (Phase 2).
- Icon extend not offline → ship `lucide-catalog.json` as generator input (Phase 3).
- `icons.js` nonexistent/untested → API defined + dogfooded by one icon-gallery demo (Phase 3);
  existing inline SVGs left as-is.
- OFL-1.1 redistribution → ship license text + use OFL originals (Phase 1/3).
- `@font-face` missing from app CSS → add `css/fonts.css` to `src/design-language.css` chain
  (Phase 1).
- esbuild font hashing vs flat layout → `assetNames: 'fonts/[name]'`, documented co-location
  (Phase 3).
- esbuild "transitive under Vite" claim wrong → explicit pinned devDep (Phase 3).
- `ds.js` load-order/no-reinit/theme key → documented contract; toggle split to `docs.js`
  (Phase 2/3).
- Stale committed `dist/` → cleaned step zero (Phase 1).
- Added: `manifest.json` + SHA-256 checksum + Lucide version stamp (Phase 3).

## Consciously deferred (YAGNI)

- **Formal token-stability contract + SemVer/changelog policy.** Deferred until external
  consumers exist; the user owns both the system and the consuming apps. `VERSION` +
  `manifest.json` suffice at v1.
- **`group`/section headers in the nav.** The rail is flat; add only when wanted.
- **Mass conversion of inline SVGs to `icons.js`.** One gallery demo dogfoods it; the rest
  stay inline.
- **Font subsetting build step.** Ship variable woff2 as-is; subset later only if size matters.

## Plan-level notes (for the implementers)

- **Phase 2 spike:** prototype the `transformIndexHtml` plugin on `index.html` + one `pages/*`
  file and confirm `dist` resolves/hashes the per-page-relative bundled assets for both depths
  **before** converting the remaining 9 pages.
- **Phase 3 precondition:** the `origin` remote
  (`github.com/matty/desktop-design-system.git`) exists but there is no `.github/workflows/`
  yet — verify push access before relying on the Releases flow.
