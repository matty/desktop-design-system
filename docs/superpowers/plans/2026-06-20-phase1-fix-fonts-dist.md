# Phase 1 — Fix + De-risk (self-host fonts, repoint heads, coherent dist) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the docs build coherently and fully offline by self-hosting the fonts, pointing every page at the single bundled stylesheet, and removing the Google Fonts CDN — without touching the templating or bundle work (those are Phases 2 and 3).

**Architecture:** Add a `css/fonts.css` with `@font-face` rules for self-hosted **variable** woff2 (sourced via Fontsource, copied into committed `assets/fonts/`), insert it at the head of the existing `src/design-language.css` `@import` chain, and replace each page's CDN + six raw `<link>`s with one `<link>` to `src/design-language.docs.css`. Native CSS `@import` keeps direct file-open working; Vite bundles/hashes the chain so `dist/` becomes self-contained.

**Tech Stack:** Plain HTML/CSS, Vite 8, Node, Fontsource variable font packages (dev-only, for sourcing the woff2).

## Global Constraints

- Plain HTML and CSS; two-space indentation for nested HTML.
- Class grammar unchanged: `.ds-*` primitives, `.u-*` utilities, `.is-*` states, `data-*` modes.
- Design values reference CSS custom properties from `tokens.css` — no hard-coded colors/sizes.
- Font family names are fixed by `tokens.css`: `"Sora"` and `"JetBrains Mono"` — `@font-face` `font-family` must match these exactly.
- Fonts are OFL-1.1: ship the license text; do not reuse Reserved Font Names. Subsetting is permitted.
- The inline FOUC theme script must stay inline and first in `<head>` (runs pre-paint; never extract/hash it).
- Do NOT change `vite.config.mjs`'s templating behavior or create the bundle — those are later phases. (One small input-array completeness fix in Task 5 is the only `vite.config.mjs` change.)
- `dist/` stays gitignored; never commit it.

---

### Task 1: Remove the stale committed `dist/`

**Files:**
- Delete (from git tracking): `dist/` (currently committed despite being gitignored)
- Reference: `.gitignore` (already contains `dist/` — no change)

**Interfaces:**
- Consumes: nothing.
- Produces: a clean tree where `dist/` is untracked, so later build output never shows as committed.

- [ ] **Step 1: Confirm `dist/` is committed and gitignored**

Run: `git ls-files dist | head -3 && grep -n "dist/" .gitignore`
Expected: lists tracked files under `dist/` (e.g. `dist/index.html`) AND prints `dist/` from `.gitignore` — confirming it's both tracked and ignored (the stale state to fix).

- [ ] **Step 2: Untrack `dist/` (keep nothing on disk)**

Run: `git rm -r --cached dist && rm -rf dist`
Expected: `rm 'dist/...'` lines; working tree no longer has `dist/`.

- [ ] **Step 3: Verify it is gone from the index**

Run: `git ls-files dist | wc -l`
Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Remove stale committed dist (it is gitignored build output)"
```

---

### Task 2: Source self-hosted variable fonts into `assets/fonts/`

**Files:**
- Create: `assets/fonts/sora-var.woff2` (binary, committed)
- Create: `assets/fonts/jetbrains-mono-var.woff2` (binary, committed)
- Create: `assets/fonts/Sora-OFL.txt` (license text, committed)
- Create: `assets/fonts/JetBrainsMono-OFL.txt` (license text, committed)
- Modify: `package.json` (add two dev-only Fontsource packages used to source the files)

**Interfaces:**
- Consumes: nothing.
- Produces: committed variable woff2 at the exact paths `assets/fonts/sora-var.woff2` and `assets/fonts/jetbrains-mono-var.woff2`, consumed by `css/fonts.css` (Task 3).

- [ ] **Step 1: Install the Fontsource variable packages (dev-only sourcing)**

Run:
```bash
npm install -D @fontsource-variable/sora @fontsource-variable/jetbrains-mono
```
Expected: both packages added under `devDependencies`; `node_modules/@fontsource-variable/sora/files/` and `.../jetbrains-mono/files/` exist.

- [ ] **Step 2: Verify the variable woff2 files exist in the packages**

Run:
```bash
ls node_modules/@fontsource-variable/sora/files/ | grep 'latin-wght-normal.woff2'
ls node_modules/@fontsource-variable/jetbrains-mono/files/ | grep 'latin-wght-normal.woff2'
```
Expected: prints `sora-latin-wght-normal.woff2` and `jetbrains-mono-latin-wght-normal.woff2` (the latin variable subset — sufficient for a desktop app).

- [ ] **Step 3: Copy the woff2 + license text into `assets/fonts/`**

Run:
```bash
mkdir -p assets/fonts
cp node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2 assets/fonts/sora-var.woff2
cp node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2 assets/fonts/jetbrains-mono-var.woff2
cp node_modules/@fontsource-variable/sora/LICENSE assets/fonts/Sora-OFL.txt
cp node_modules/@fontsource-variable/jetbrains-mono/LICENSE assets/fonts/JetBrainsMono-OFL.txt
```
Expected: no errors.

- [ ] **Step 4: Verify the copied files are present and non-empty**

Run: `ls -l assets/fonts/`
Expected: four files listed, both `.woff2` non-zero size (tens of KB), both `*-OFL.txt` non-zero.

- [ ] **Step 5: Commit**

```bash
git add assets/fonts/ package.json package-lock.json
git commit -m "Add self-hosted variable Sora + JetBrains Mono woff2 with OFL text"
```

---

### Task 3: Create `css/fonts.css` with `@font-face` rules

**Files:**
- Create: `css/fonts.css`

**Interfaces:**
- Consumes: `assets/fonts/sora-var.woff2`, `assets/fonts/jetbrains-mono-var.woff2` (Task 2).
- Produces: `@font-face` declarations for families `"Sora"` and `"JetBrains Mono"`, imported by `src/design-language.css` (Task 4). `url()` paths are relative to this file's location (`css/`).

- [ ] **Step 1: Write `css/fonts.css`**

```css
/* Self-hosted variable fonts. url() is relative to this file (css/). */
@font-face {
  font-family: "Sora";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("../assets/fonts/sora-var.woff2") format("woff2");
}
@font-face {
  font-family: "JetBrains Mono";
  font-style: normal;
  font-weight: 400 600;
  font-display: swap;
  src: url("../assets/fonts/jetbrains-mono-var.woff2") format("woff2");
}
```

- [ ] **Step 2: Verify family names match the tokens**

Run: `grep -nE '"Sora"|"JetBrains Mono"' css/fonts.css css/tokens.css`
Expected: `"Sora"` and `"JetBrains Mono"` appear in BOTH files (the `@font-face` names match `--font-sans`/`--font-mono` in `tokens.css`).

- [ ] **Step 3: Commit**

```bash
git add css/fonts.css
git commit -m "Add @font-face rules for self-hosted variable fonts"
```

---

### Task 4: Insert `fonts.css` at the head of the CSS `@import` chain

**Files:**
- Modify: `src/design-language.css`

**Interfaces:**
- Consumes: `css/fonts.css` (Task 3).
- Produces: an `@import` chain where `@font-face` is declared before consumers; inherited by `src/design-language.docs.css` (which imports `design-language.css`) and by the future app bundle (Phase 3).

- [ ] **Step 1: Add the fonts import as the first line**

Edit `src/design-language.css` so it reads:
```css
@import "../css/fonts.css";
@import "../css/tokens.css";
@import "../css/base.css";
@import "../css/components.css";
@import "../css/utilities.css";
@import "../css/patterns.css";
```
(The only change is the new first line `@import "../css/fonts.css";`.)

- [ ] **Step 2: Verify the chain**

Run: `head -1 src/design-language.css`
Expected: `@import "../css/fonts.css";`

- [ ] **Step 3: Commit**

```bash
git add src/design-language.css
git commit -m "Import fonts.css first in the design-language CSS chain"
```

---

### Task 5: Repoint every page head to the single bundled stylesheet; drop the CDN

**Files:**
- Modify: `index.html` (head)
- Modify: `pages/buttons.html`, `pages/data-display.html`, `pages/feedback.html`, `pages/forms.html`, `pages/foundations.html`, `pages/keyboard.html`, `pages/navigation.html`, `pages/patterns.html`, `pages/system.html`, `pages/utilities.html` (heads)
- Modify: `vite.config.mjs` (add the missing `pages/keyboard.html` to the input array for build completeness)

**Interfaces:**
- Consumes: `src/design-language.docs.css` (existing — imports `design-language.css` + `docs.css`).
- Produces: every page references one stylesheet entry, so Vite bundles one coherent hashed CSS (+ hashed woff2) for all pages instead of a stray single-page file.

- [ ] **Step 1: In `index.html`, replace the three CDN links and six raw CSS links with one bundled link**

In `index.html`, delete these three lines:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```
and delete these six lines:
```html
<link rel="stylesheet" href="css/tokens.css" />
<link rel="stylesheet" href="css/base.css" />
<link rel="stylesheet" href="css/components.css" />
<link rel="stylesheet" href="css/utilities.css" />
<link rel="stylesheet" href="css/patterns.css" />
<link rel="stylesheet" href="css/docs.css" />
```
Replace all nine with this single line (same position):
```html
<link rel="stylesheet" href="src/design-language.docs.css" />
```
Leave the `<meta>` tags, the inline FOUC `<script>`, and the `<title>` untouched.

- [ ] **Step 2: In each `pages/*.html`, do the same with the `../` prefix**

For each of the ten files in `pages/`, delete the same three CDN lines (identical) and these six raw links (note the `../` prefix):
```html
<link rel="stylesheet" href="../css/tokens.css" />
<link rel="stylesheet" href="../css/base.css" />
<link rel="stylesheet" href="../css/components.css" />
<link rel="stylesheet" href="../css/utilities.css" />
<link rel="stylesheet" href="../css/patterns.css" />
<link rel="stylesheet" href="../css/docs.css" />
```
Replace all nine with this single line:
```html
<link rel="stylesheet" href="../src/design-language.docs.css" />
```
Leave each page's `<meta>`, inline FOUC `<script>`, `<title>`, and body untouched.

- [ ] **Step 3: Verify no CDN references remain anywhere**

Run: `grep -rln "fonts.googleapis\|fonts.gstatic" index.html pages/`
Expected: no output (exit code 1) — zero matches.

- [ ] **Step 4: Verify every page now links exactly one design-language stylesheet**

Run: `grep -rc "design-language.docs.css" index.html pages/*.html`
Expected: every listed file shows `:1`.

- [ ] **Step 5: Verify no raw `css/*.css` `<link>`s remain in the pages**

Run: `grep -rn 'rel="stylesheet" href="\(\.\./\)\?css/' index.html pages/`
Expected: no output (exit code 1).

- [ ] **Step 6: Add the missing `keyboard.html` entry to the Vite input array**

In `vite.config.mjs`, in the `pages` array, add `"pages/keyboard.html",` (keep alphabetical order, after `"pages/foundations.html"`). This is a temporary completeness fix; Phase 2 replaces the whole array with a `nav.json`-derived list.

- [ ] **Step 7: Commit**

```bash
git add index.html pages/*.html vite.config.mjs
git commit -m "Point all pages at the bundled stylesheet and drop the Google Fonts CDN"
```

---

### Task 6: Record the font licenses in `THIRD_PARTY_LICENSES.md`

**Files:**
- Modify: `THIRD_PARTY_LICENSES.md`

**Interfaces:**
- Consumes: the OFL text files in `assets/fonts/` (Task 2).
- Produces: top-level attribution so redistribution (Phase 3 zip) is license-compliant.

- [ ] **Step 1: Append font attribution entries**

Add to `THIRD_PARTY_LICENSES.md`:
```markdown
## Fonts

- **Sora** — SIL Open Font License 1.1. Full text: `assets/fonts/Sora-OFL.txt`.
- **JetBrains Mono** — SIL Open Font License 1.1. Full text: `assets/fonts/JetBrainsMono-OFL.txt`.

Self-hosted as variable woff2 in `assets/fonts/`. Subsetting is permitted under the OFL;
Reserved Font Names are not reused.
```

- [ ] **Step 2: Verify the referenced license files exist**

Run: `ls assets/fonts/Sora-OFL.txt assets/fonts/JetBrainsMono-OFL.txt`
Expected: both paths listed, no error.

- [ ] **Step 3: Commit**

```bash
git add THIRD_PARTY_LICENSES.md
git commit -m "Document OFL-1.1 licensing for self-hosted fonts"
```

---

### Task 7: Build + offline verification gate

**Files:**
- None modified (verification only).

**Interfaces:**
- Consumes: all prior tasks.
- Produces: confirmation that `dist/` is coherent and offline before Phase 2 begins.

- [ ] **Step 1: Run the full build**

Run: `npm run build`
Expected: `icons:check` passes, then `vite build` completes with no errors; it reports emitting `dist/index.html`, all `dist/pages/*.html` (including `keyboard.html`), and hashed assets.

- [ ] **Step 2: Verify a single bundled CSS and the woff2 are emitted to dist**

Run: `ls dist/assets/ | grep -E '\.css$|\.woff2$'`
Expected: at least one hashed `.css` file and the two `.woff2` files (Sora + JetBrains Mono) present in `dist/assets/`.

- [ ] **Step 3: Verify the built pages contain no CDN references**

Run: `grep -rln "fonts.googleapis\|fonts.gstatic" dist/`
Expected: no output (exit code 1) — the built site makes zero font CDN requests.

- [ ] **Step 4: Verify the built pages reference the hashed local CSS**

Run: `grep -rl "assets/.*\.css" dist/index.html dist/pages/*.html | wc -l`
Expected: `11` (index + 10 pages all link the bundled hashed stylesheet).

- [ ] **Step 5: Manual browser check (dev server)**

Run: `npm run dev`, then open the printed URL. Verify on `index.html` and 2–3 pages: Sora/JetBrains Mono render (not a system fallback), dark↔light theme toggle works, and the browser DevTools Network tab shows **no requests to fonts.googleapis.com / fonts.gstatic.com** (fonts load from local `assets/`). Stop the server when done.

- [ ] **Step 6: Manual direct-open check**

Open `index.html` directly from disk in a browser (no server). Verify styles + fonts still load (native CSS `@import` resolves the chain; `@font-face` loads local woff2). This confirms Phase 1 preserves the no-build open workflow (Phase 2 templating is what later changes this).

- [ ] **Step 7: Final commit (if any verification fix was needed)**

If steps 1–6 required a fix, commit it; otherwise no commit needed.
```bash
git commit -am "Fix Phase 1 build/offline verification issue" || echo "nothing to commit"
```
