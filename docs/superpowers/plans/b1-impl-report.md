# Batch 1 Implementation Report

**Branch:** feat/components-batch1  
**Commit range:** c4f3e19..20b38a9  
**Date:** 2026-06-24

---

## Task 1: DsButtonGroup

### Files Created
- `vue/components/DsButtonGroup.vue` — thin wrapper, renders `.ds-btn-group` with `role="group"` and `:aria-label`
- `vue/components/DsButtonGroup.test.ts` — 2 tests
- `vue/components/DsButtonGroup.stories.ts` — CSF3, `Foundation/DsButtonGroup`, stories: Default, Labelled

### Files Modified
- `vue/index.ts` — export added
- `pages/buttons.html` — new example with `role="group"` and `aria-label="Alignment"` added to "Button group" section
- `reference/manifest.json`, `REFERENCE.md`, `llms.txt` — regenerated

### Per-task gate output
```
lint-usage: 11 file(s) clean.
vue-tsc: 0 errors
coverage:check — story: ok, example: ok, renders: ok, docs: ok
coverage:check passed — all layers aligned.
```

**Commit:** `8870354 feat(vue): DsButtonGroup wrapper over ds-btn-group + story/docs`

---

## Task 2: DsTooltip

### Files Created
- `vue/components/DsTooltip.vue` — thin wrapper, renders `.ds-tip` span with `:data-tip="text"`
- `vue/components/DsTooltip.test.ts` — 1 test
- `vue/components/DsTooltip.stories.ts` — CSF3, `Display/DsTooltip`, story: Default

### Files Modified
- `vue/index.ts` — export added
- `reference/manifest.json`, `REFERENCE.md`, `llms.txt` — regenerated

Note: `ds-tip` example already existed on `pages/feedback.html`; no new docs example was required.

### Per-task gate output
```
lint-usage: 11 file(s) clean.
vue-tsc: 0 errors
coverage:check — story: ok, example: ok, renders: ok, docs: ok
coverage:check passed — all layers aligned.
```

**Commit:** `8c5cee3 feat(vue): DsTooltip wrapper over ds-tip + story`

---

## Task 3: DsPopover

### Files Created
- `vue/components/DsPopover.vue` — `defineModel<boolean>("open")` + `useDismiss`; renders `.ds-popover-anchor` > `.ds-btn` trigger + `.ds-popover` content
- `vue/components/DsPopover.test.ts` — 4 tests (closed initially, toggle open, ariaLabel, v-model:open controlled)
- `vue/components/DsPopover.stories.ts` — CSF3, `Interactive/DsPopover`, story: Default

### Files Modified
- `css/components.css` — added `.ds-popover-anchor` + `.ds-popover-anchor .ds-popover` positioning rules near line 423
- `vue/index.ts` — export added
- `tools/coverage-core.mjs` — `DsPopover` added to `DATA_VUE_EXPECTED`
- `tools/coverage.test.mjs` — updated sorted array assertion to include `DsPopover` (11 components); updated test description
- `pages/feedback.html` — new example block with `ds-popover-anchor is-open` preview + `<template data-vue>` snippet
- `reference/manifest.json`, `REFERENCE.md`, `llms.txt` — regenerated

### Per-task gate output
```
lint-usage: 11 file(s) clean.
vue-tsc: 0 errors
npx vitest run tools/coverage.test.mjs: 21 tests passed
coverage:check — story: ok, example: ok, renders: ok, docs: ok
coverage:check passed — all layers aligned.
```

**Commit:** `20b38a9 feat(vue): DsPopover (trigger + floating surface) + gate data-vue tracking`

---

## Task 4: Batch Verification

### Full test suite
```
npx vitest run: 67 test files, 221 tests — all passed
npm run typecheck: 0 errors
```

### Build
```
npm run build: exit 0
  - icons:check passed
  - reference:check passed
  - reference:lint: 11 file(s) clean
  - coverage:check passed — all layers aligned
  - vite build: ✓ built in 291ms
  - bundle: 137 files written to dist/bundle
```

### Gate (node tools/coverage.mjs)
```
coverage:check —
  story (component → .stories.ts): ok
  example (primitive → docs example): ok
  renders (component → primitive): ok
  docs (component → data-vue): ok
coverage:check passed — all layers aligned.
```

### Manifest confirmation
```
DsButtonGroup:true DsTooltip:true DsPopover:true
```

---

## Summary

| Item | Result |
|------|--------|
| Tests | 221 passed (67 files) |
| Typecheck | 0 errors |
| Build | exit 0 |
| Gate | story/example/renders/docs all ok |
| Commits | c4f3e19..20b38a9 (3 commits) |

All tasks completed cleanly with no concerns.

---

## Post-merge Fix: DsPopover Code-Review Items

**Commit:** `5463b7a fix(vue): DsPopover drop dead @click.stop + controlled round-trip tests`  
**Date:** 2026-06-24

### Fix 1 — Remove misleading `@click.stop` on trigger button (`DsPopover.vue`)

`@click.stop="toggle"` was changed to `@click="toggle"`. The `.stop` modifier served no functional purpose: `useDismiss` listens on `pointerdown` in capture phase and guards via `root.value.contains(e.target)`, so stopping the `click` event does not affect dismiss behaviour. The modifier was misleading because it implied a dismiss-race guard that did not exist.

### Fix 2 — Controlled-mode round-trip tests (`DsPopover.test.ts`)

Two new tests were added to exercise `defineModel` reconciliation when the parent changes the `open` prop without a user click:

- **"opens when the parent sets open=true (controlled)"** — mounts with `open: false`, asserts popover absent, sets `open: true` via `setProps`, asserts popover present.
- **"closes when the parent sets open=false (controlled)"** — mounts with `open: true`, asserts popover present, sets `open: false` via `setProps`, asserts popover absent.

### Test output

```
✓ vue/components/DsPopover.test.ts (6 tests) 31ms

Test Files  1 passed (1)
      Tests  6 passed (6)
```

### Typecheck

```
vue-tsc --noEmit: 0 errors
```
