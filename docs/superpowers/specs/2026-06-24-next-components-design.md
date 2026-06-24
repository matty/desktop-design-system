# Next component set — 11 components across CSS / docs / Vue / Storybook

**Date:** 2026-06-24
**Status:** Approved (design) — implementation decomposed into 4 batched plans.

## Problem / goal

The system has 52 Vue components but real desktop-app gaps remain, and some CSS
primitives ship without a Vue/Storybook equivalent. Add **11 components**, each landing
across every layer (CSS → static docs example → Vue → Storybook → green coverage gate),
so the alignment infrastructure built earlier (coverage gate + dual-mode docs) stays
satisfied.

The 11: **DsTooltip, DsPopover, DsButtonGroup** (Tier 1 — no new CSS), **DsSteps,
DsMenubar, DsPagination, DsDrawer** (Tier 2 — net-new CSS), **DsSplitButton,
DsCommandPalette** (Tier 3 light), **DsCalendar, DsDatePicker** (Tier 3 heavy).

## Non-goals

- DatePicker range/multi select — single date only for v1.
- Tooltip placements beyond `top` — the `ds-tip` CSS supports `top`; others deferred.
- New composables unless a component genuinely needs one — reuse `useDismiss`,
  `useFocusTrap`, `useRovingTabindex`, `useAnnounce`.
- Reworking existing components.

## Shared recipe (every component)

A component is complete only when all of these hold:

1. **CSS** — add/confirm the primitive(s) in `css/components.css` using `tokens.css`
   custom properties (never hard-coded colors/sizes). `npm run reference:build`
   regenerates `reference/manifest.json` + `REFERENCE.md` + `llms.txt`; commit them.
2. **Static docs** — a focused `.example` block on the component's page (shape
   `<div class="example"><div class="example-preview">…</div><div class="example-caption">…</div></div>`,
   `class` the last attribute on the preview div). This covers the primitive for the
   gate's `example` assertion. `npm run reference:lint` must stay clean.
3. **Vue** — `vue/components/DsX.vue` (`<script setup lang="ts">`, typed
   `defineProps<{…}>()` / `defineEmits<{…}>()`, v-model via `update:*`), exported from
   `vue/index.ts`. Shared types go in `vue/types.ts`. Reuse existing composables.
4. **Storybook** — `vue/components/DsX.stories.ts` (CSF3 + autodocs), at minimum a
   default/variants story and one composed story, following existing exemplars.
5. **Interactive components** (see set below) — author a `<template data-vue>` snippet in
   the component's docs `.example` (direct child, after `.example-preview`, before
   `.example-caption`) **and** add the component name to `DATA_VUE_EXPECTED` in
   `tools/coverage-core.mjs`. The snippet's prop/slot/event names must match the
   component's real API.
6. **Verification** — `npx vitest run` green (incl. `vue-tsc` typecheck via
   `npm run typecheck`), `npm run build` exit 0, and `node tools/coverage.mjs` reports
   `story`/`example`/`renders`/`docs` all `ok`. Gate stays **warn-only** (no `--strict`).

**Interactive set (Vue tab + `DATA_VUE_EXPECTED`, 8):** DsPopover, DsMenubar,
DsPagination, DsDrawer, DsSplitButton, DsCommandPalette, DsCalendar, DsDatePicker.
**Vue + story only (HTML tab, no snippet, 3):** DsTooltip, DsSteps, DsButtonGroup —
these mirror the ~42 existing simple components that carry no `data-vue`.

## New shared types (`vue/types.ts`)

```ts
export interface Step { id: string; label: string }
export interface MenubarMenu { id: string; label: string; items: MenuItem[] }
export interface CommandItem { id: string; label: string; hint?: string; group?: string }
```

Reuse existing `MenuItem`, `Tone`, `Size`. Dates are plain ISO `YYYY-MM-DD` strings
(no new type).

## Per-component contracts

### Tier 1 — no new CSS (Batch 1)

**DsTooltip** — wraps a trigger and shows the CSS-only `ds-tip` tooltip.
- CSS: existing `ds-tip` (text via `data-tip`, hover, top placement).
- Props: `text: string`, `placement?: "top"` (only `top` supported; prop reserved).
- Slots: default (the trigger element).
- Renders: a wrapper carrying `class="ds-tip"` and `:data-tip="text"` around the slot.
- Docs: `pages/feedback.html` (the existing `ds-tip` example covers the primitive; no
  new example strictly required, but add a small one demonstrating the Vue usage's
  vanilla equivalent if the page lacks a focused one). HTML tab only.

**DsPopover** — trigger + dismissible floating `ds-popover` surface.
- CSS: existing `ds-popover`; the trigger/anchor uses a positioned wrapper
  (`position:relative` container, popover absolutely positioned below the trigger). Add a
  minimal `ds-popover-anchor` wrapper rule only if needed for positioning; prefer reusing
  existing layout utilities.
- Props: `open?: boolean` (optional v-model:open), `ariaLabel?: string`.
- Emits: `update:open: [boolean]`.
- Slots: `trigger`, default (popover content).
- Behavior: click trigger toggles; `useDismiss` closes on outside click / Escape. Mirrors
  `DsDropdownMenu` structure.
- Docs: `pages/feedback.html` (existing `ds-popover` example) + `data-vue` snippet.

**DsButtonGroup** — attached cluster of buttons.
- CSS: existing `ds-btn-group`.
- Props: none (slot-driven). Optional `ariaLabel?: string` applied as `aria-label` on the
  group container with `role="group"`.
- Slots: default (a set of `DsButton`/`ds-btn` elements).
- Docs: `pages/buttons.html` + a focused `.ds-btn-group` example. HTML tab only.

### Tier 2 — net-new CSS (Batch 2)

**DsSteps** — horizontal step/progress indicator.
- CSS (new): `.ds-steps` (flex row), `.ds-step-item` (number/label), states `is-active`,
  `is-complete`; connector line between items. Tokens for colors/sizes. (Distinct from the
  `ds-number > .ds-step` sub-part, which is unrelated.)
- Props: `steps: Step[]`, `current: string | number` (active step id or index).
- Slots: none (labels from `steps`).
- Docs: `pages/navigation.html` + a focused example. HTML tab only.

**DsMenubar** — top application menu bar (File / Edit / View …).
- CSS (new): `.ds-menubar` (horizontal bar), `.ds-menubar-item` (top-level trigger) with
  `is-open`/hover state; dropdown panels reuse existing `.ds-menu` / `.ds-menu-item` /
  `.ds-menu-sep`.
- Props: `menus: MenubarMenu[]`, `ariaLabel?: string`.
- Emits: `select: [string]` (selected item id).
- Behavior: one top item open at a time; ArrowLeft/Right move between top menus,
  ArrowUp/Down within an open menu, Enter activates, Escape closes. Reuse `useDismiss` +
  `useRovingTabindex`. `role="menubar"`.
- Docs: `pages/navigation.html` + `data-vue` snippet.

**DsPagination** — page navigation for tables/lists.
- CSS (new): `.ds-pagination` (flex row), `.ds-page` (page button) with `is-active` and
  disabled prev/next; ellipsis span.
- Props: `total: number` (item count), `pageSize: number`, `page: number` (v-model),
  `siblingCount?: number` (default 1).
- Emits: `update:page: [number]`.
- Behavior: compute page list with leading/trailing ellipsis; prev/next disabled at
  bounds. `nav[aria-label]`, `aria-current="page"` on the active page.
- Docs: `pages/data-display.html` + `data-vue` snippet.

**DsDrawer** — slide-in side panel (modal).
- CSS (new): `.ds-drawer` (fixed side panel), `.ds-drawer-head`/`-body`/`-foot`, side
  variants `is-right` (default) / `is-left`; reuse `.ds-overlay` for the backdrop.
- Props: `open: boolean` (v-model), `side?: "right" | "left"` (default `"right"`),
  `title?: string`.
- Emits: `update:open: [boolean]`.
- Slots: default (body), `footer`.
- Behavior: `useFocusTrap` while open, Escape + overlay-click close. Mirrors `DsDialog`.
  `role="dialog"`, `aria-modal="true"`.
- Docs: `pages/feedback.html` + `data-vue` snippet.

### Tier 3 light (Batch 3)

**DsSplitButton** — primary action + caret that opens a menu.
- CSS (new): `.ds-split-btn` (groups a primary `.ds-btn` and a caret `.ds-btn`); the menu
  reuses `.ds-menu`.
- Props: `label: string`, `items: MenuItem[]`, `tone?: Tone`.
- Emits: `click: []` (primary action), `select: [string]` (menu item id).
- Behavior: primary button emits `click`; caret toggles a `ds-menu` (`useDismiss` +
  `useRovingTabindex`).
- Docs: `pages/buttons.html` + `data-vue` snippet.

**DsCommandPalette** — ⌘K modal launcher.
- CSS (new): `.ds-command` (centered modal panel), `.ds-command-input`,
  `.ds-command-list`, `.ds-command-item` with `is-active`; optional `.ds-command-group`
  label; reuse `.ds-overlay`.
- Props: `open: boolean` (v-model), `commands: CommandItem[]`, `placeholder?: string`
  (default `"Type a command…"`).
- Emits: `update:open: [boolean]`, `select: [string]` (command id).
- Behavior: substring filter over `label` (case-insensitive); ArrowUp/Down move the
  active item, Enter selects, Escape closes; `useFocusTrap`; input autofocused on open.
  Groups render a `ds-command-group` header when `group` is present.
- Docs: `pages/patterns.html` + `data-vue` snippet.

### Tier 3 heavy (Batch 4)

**DsCalendar** — single-month date grid (the reusable picker grid).
- CSS (new): `.ds-calendar` (panel), `.ds-calendar-head` (month label + prev/next),
  `.ds-calendar-grid` (7-col), `.ds-calendar-day` with `is-today`, `is-selected`,
  `is-outside` (days from adjacent months).
- Props: `modelValue: string | null` (ISO `YYYY-MM-DD`, v-model), `month?: string`
  (ISO `YYYY-MM`, the displayed month, optional v-model:month).
- Emits: `update:modelValue: [string]`, `update:month: [string]`.
- Behavior: render the month grid **Monday-first** (weekday header row Mon→Sun),
  prev/next month buttons, click a day to select; ArrowKeys move focus by day/week, Enter
  selects. Date math via the built-in `Date` (no library). Single selection only.
- Docs: `pages/forms.html` + `data-vue` snippet.

**DsDatePicker** — text field that opens a calendar in a popover.
- CSS: none new — composes `ds-input` + the popover surface + `DsCalendar`.
- Props: `modelValue: string | null` (ISO, v-model), `placeholder?: string`
  (default `"YYYY-MM-DD"`), `format?: (iso: string) => string` (display formatter;
  default identity / ISO).
- Emits: `update:modelValue: [string | null]`.
- Behavior: read-only-ish input showing the formatted value; clicking opens a popover
  containing `DsCalendar`; selecting a day sets the value and closes. Reuse `DsPopover`
  (Batch 1) for the open/dismiss behavior and `DsCalendar` (this batch) for the grid.
- Docs: `pages/forms.html` + `data-vue` snippet.

## Coverage-gate impact

After each batch, the named interactive components are appended to `DATA_VUE_EXPECTED`
(`tools/coverage-core.mjs`) and given a `data-vue` snippet, so `docsCoverage` stays `ok`.
New primitives get a focused docs example so `exampleCoverage` stays `ok`. Component
`renders` classes must all be real primitives (`rendersCoverage`) — so any new wrapper
class a component emits must exist in CSS. The gate remains warn-only throughout.

## Implementation decomposition (4 plans)

Each batch is an independently-mergeable plan authored via the writing-plans skill, in
order. Later batches depend on earlier (DatePicker depends on Popover + Calendar).

1. **Batch 1 — Tier 1** (DsTooltip, DsPopover, DsButtonGroup): no new CSS; proves the
   per-component recipe end-to-end including the first new `data-vue` (DsPopover).
2. **Batch 2 — Tier 2** (DsSteps, DsMenubar, DsPagination, DsDrawer): net-new CSS
   primitives + full stack.
3. **Batch 3 — Tier 3 light** (DsSplitButton, DsCommandPalette).
4. **Batch 4 — DatePicker + Calendar** (DsCalendar then DsDatePicker): heaviest; date
   math, keyboard grid, single-date MVP.

## Testing

- Per component: a `vue/components/DsX.test.ts` (Vue Test Utils) asserting render +
  key behavior (open/close, selection, keyboard where applicable), matching existing
  component test style; a Storybook story (counted by the gate's `story` assertion).
- Cross-cutting per batch: `npm run build` green, `node tools/coverage.mjs` all `ok`,
  `npm run typecheck` 0 errors, full `npx vitest run` green.
- Manual: dark/light themes, compact density, keyboard focus, reduced motion for the
  interactive components.

## Consciously deferred (YAGNI)

- DatePicker range/multi-select; time picker.
- Tooltip non-top placements; popover collision/flip positioning (simple below-trigger
  placement for v1).
- Command palette fuzzy ranking (substring match is enough for v1).
- Promoting the coverage gate to `--strict` (separate, already-tracked follow-on).
