# Vue Components — Phase 4: Bundle Integration, Docs & Final Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `vue/` layer inside the offline release bundle, document copy-in usage, and run the full verification gate so the Vue components are consumable from the published zip.

**Architecture:** Extend `tools/bundle.mjs` to copy `vue/` (source only, no tests) into `dist/bundle/vue/`; add a "Vue components" section to the bundle README; verify the bundled `vue/` is self-contained and importable.

**Tech Stack:** Node ESM bundler (`tools/bundle.mjs`), Vitest, vue-tsc, Vite docs build.

## Global Constraints

- Depends on Phases 1–3 being complete and green (all 10 components + 5 composables + barrel).
- Do NOT modify `js/ds.js`, `css/`, or `pages/`.
- The bundle must stay self-contained and offline; `dist/` stays gitignored.
- Ship `vue/` **source** only — exclude `*.test.ts`, `env.d.ts`, and any `__*` files from the bundle copy.
- `npm test`, `npm run typecheck`, `npm run build`, and `npm run icons:check` must all pass at the end.
- Two-space indentation; ESM.

---

### Task 1: Copy `vue/` into the offline bundle

**Files:**
- Modify: `tools/bundle.mjs`

**Interfaces:**
- Consumes: the `vue/` directory (Phases 1–3).
- Produces: `dist/bundle/vue/**` (source only) included in `manifest.json` (the existing `walk()` picks it up automatically).

- [ ] **Step 1: Add a recursive copy of `vue/` (source only) to `tools/bundle.mjs`**

In `tools/bundle.mjs`, update the `node:fs/promises` import on line 4 to also import `cp`:
```js
import { rm, mkdir, readFile, writeFile, readdir, copyFile, cp } from "node:fs/promises";
```
Then, immediately after the icons section (after line 38, the `icons/icons.js` copy) and before the `// 4. Docs, licenses, version.` comment, add:
```js
// 3b. Vue component layer — source only (no tests / type-shims).
await cp(resolve(root, "vue"), resolve(out, "vue"), {
  recursive: true,
  filter: (src) =>
    !src.endsWith(".test.ts") && !src.endsWith("env.d.ts") && !src.includes("__")
});
```

- [ ] **Step 2: Verify the bundle includes vue source but not tests**

Run:
```bash
npm run bundle >/dev/null 2>&1
echo "index + a component present:"; ls dist/bundle/vue/index.ts dist/bundle/vue/components/DsCombobox.vue >/dev/null && echo yes
echo "composables present:"; ls dist/bundle/vue/composables/useToast.ts >/dev/null && echo yes
echo "no test files in bundle (expect 0):"; grep -rl ".test.ts" dist/bundle/vue/ | wc -l
echo "no env.d.ts in bundle (expect 0):"; ls dist/bundle/vue/env.d.ts 2>/dev/null | wc -l
echo "vue files listed in manifest (expect >0):"; grep -c '"vue/' dist/bundle/manifest.json
```
Expected: `yes`, `yes`, `0`, `0`, a count `>0`.

- [ ] **Step 3: Commit**

```bash
git add tools/bundle.mjs
git commit -m "bundle: ship the Vue component layer (source only) in the offline bundle"
```

---

### Task 2: Document copy-in usage in the bundle README

**Files:**
- Modify: `tools/bundle-readme.md`

**Interfaces:** none.

- [ ] **Step 1: Add a "Vue components" section to `tools/bundle-readme.md`**

Append this section to the end of `tools/bundle-readme.md`:
```markdown

## Vue 3 components (optional)

The `vue/` folder contains optional Vue 3 components for the interactive primitives
(combobox, tree, context menu, dropdown, tabs, accordion, dialog, toast, splitter,
sortable). They render the same `.ds-*` classes — the CSS in this bundle is still the
source of truth, so no component ships its own styles.

To use them in a Vue 3 + Vite + TypeScript app:

1. Copy the `vue/` folder into your app (e.g. `src/design-language/`).
2. Make sure the design-language CSS is imported once in your app, e.g.
   `import "./design-language/design-language.css"` (or the individual
   `tokens.css` + `base.css` + `components.css`).
3. Only if you use `DsSortable`, install its peer dependency: `npm i sortablejs`.
4. Import components from the barrel:
   ```ts
   import { DsCombobox, DsDialog, useToast } from "./design-language/vue";
   ```
5. For toasts, mount `<DsToastHost />` once near your app root and call
   `useToast().toast({ message: "Saved", tone: "success" })` from anywhere.

The components are shipped as raw `.vue` / `.ts` source; your app's own Vite/Vue build
compiles them.
```

- [ ] **Step 2: Verify the README ships the section**

Run:
```bash
npm run bundle >/dev/null 2>&1
echo "vue section in bundled README (expect >=1):"; grep -c "Vue 3 components" dist/bundle/README.md
echo "mentions sortablejs peer dep (expect >=1):"; grep -c "npm i sortablejs" dist/bundle/README.md
```
Expected: both counts `>= 1`.

- [ ] **Step 3: Commit**

```bash
git add tools/bundle-readme.md
git commit -m "bundle README: document Vue component copy-in usage"
```

---

### Task 3: Bundled-consumer smoke test (vue layer is self-contained)

**Files:** none (verification only; creates and removes a scratch dir).

**Interfaces:** Consumes the assembled `dist/bundle/vue/`.

- [ ] **Step 1: Verify every import inside bundled `vue/` resolves to a file that also shipped**

This catches a component importing something that was excluded from the bundle (e.g. a path typo or a test-only helper). Run:
```bash
npm run bundle >/dev/null 2>&1
node --input-type=module -e "
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { readdirSync, statSync } from 'node:fs';
const base = 'dist/bundle/vue';
function walk(d){return readdirSync(d).flatMap(n=>{const p=resolve(d,n);return statSync(p).isDirectory()?walk(p):[p];});}
const files = walk(base).filter(f=>f.endsWith('.ts')||f.endsWith('.vue'));
let bad = 0;
for (const f of files) {
  const src = readFileSync(f,'utf8');
  const rels = [...src.matchAll(/from\\s+[\"'](\\.[^\"']+)[\"']/g)].map(m=>m[1]);
  for (const r of rels) {
    const stem = resolve(dirname(f), r);
    const ok = ['', '.ts', '.vue', '/index.ts'].some(ext => existsSync(stem+ext));
    if (!ok) { console.log('MISSING', r, 'in', f); bad++; }
  }
}
console.log(bad===0 ? 'ALL RELATIVE IMPORTS RESOLVE' : ('BROKEN IMPORTS: '+bad));
"
```
Expected: `ALL RELATIVE IMPORTS RESOLVE`.

- [ ] **Step 2: Confirm no `<style>` blocks leaked into any component (CSS stays single-source)**

Run:
```bash
echo "style blocks in vue/ (expect 0):"; grep -rl "<style" vue/ | wc -l
```
Expected: `0`.

- [ ] **Step 3: No commit (verification only)**

If Step 1 or 2 fails, fix the offending component in `vue/` and re-run; otherwise proceed.

---

### Task 4: Final full gate

**Files:** none (verification only).

- [ ] **Step 1: Tests + typecheck**

Run: `npm test`
Expected: all suites green across Phases 1–3 (types, 5 composables, barrel, 10 components incl. DsTabPanel/DsAccordionItem/DsTreeNode covered by their parent suites).
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 2: Full build (docs + bundle) still green**

Run: `npm run build`
Expected: `icons:check passed`, 11 pages emitted, bundle written, exit 0 (the `ds.js`/`docs.js`/`sortable.min.js` "can't be bundled" warnings are expected and unrelated).

- [ ] **Step 3: Bundle contains the full vue surface**

Run:
```bash
echo "component count in bundle (expect 13 .vue files):"; ls dist/bundle/vue/components/*.vue | wc -l
echo "composable count in bundle (expect 5):"; ls dist/bundle/vue/composables/*.ts | wc -l
echo "barrel present:"; ls dist/bundle/vue/index.ts >/dev/null && echo yes
```
Expected: `13`, `5`, `yes`.

> NOTE: the `.vue` count is **13** — the 10 public components plus 3 internal sub-components: `DsTreeNode` (Phase 2), `DsTabPanel`, `DsAccordionItem` (Phase 3). (`DsTabPanel`/`DsAccordionItem` are public exports too, but they are still single `.vue` files.) The gate is "every created `.vue` is present in the bundle" — if a component was split differently during implementation, set the expected number to the actual file list.

- [ ] **Step 4: Clean tree**

Run: `git status --porcelain || echo clean`
Expected: clean (no scratch dirs, no stray files).

- [ ] **Step 5: Commit (only if a gate fix was needed)**

```bash
git commit -am "vue: fix final-gate issue" || echo "nothing to commit"
```

---

## Self-Review

- **Spec coverage (Phase 4 portion):** bundle integration (Task 1), README docs (Task 2), self-contained verification (Task 3), full gate (Task 4). Matches spec sections "Distribution & build", "Docs (v1)", and "Success criteria" items 4–5. Success criteria 1–3 (usable components, v-model, no styles) are satisfied by Phases 1–3 and re-checked in Tasks 3–4.
- **Placeholder scan:** none — every step has full code or an exact command. The `.vue` count note explains how to reconcile the expected number with the actual file list rather than hard-coding a possibly-wrong constant.
- **Type consistency:** no new types introduced; relies on the barrel and component files from Phases 1–3.
