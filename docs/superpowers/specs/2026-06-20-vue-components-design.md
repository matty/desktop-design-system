# Vue 3 Component Layer — High-Value Tier (Design Spec)

> Status: approved design, pre-implementation. Date: 2026-06-20.

## Goal

Add a Vue 3 component layer for the **interactive, high-value** primitives of the
design language, so the author's Vue desktop apps can consume reactive components
instead of re-wiring the imperative `js/ds.js` runtime by hand each time. The CSS
language remains the single source of truth; Vue is a thin behavioral layer over it,
exactly like the existing Vite/Electron/Tauri adapters (per `AGENTS.md`).

## Why this is worth doing (verdict)

`js/ds.js` wires behavior **imperatively** — on load it runs
`document.querySelectorAll('.ds-combo')` etc. and mutates DOM/`classList` directly.
This actively fights Vue: Vue owns the DOM, so those listeners get clobbered on
re-render, teardown is manual, there is no `v-model`, and state lives in the DOM
rather than the component. The high-value primitives fall into two groups, both of
which justify a Vue component:

- **Behavior exists in `ds.js` but is imperative** → Vue reimplements it reactively:
  Combobox, Tree, Context-menu, Splitter, Sortable.
- **No behavior exists today** (markup is presentational; each app rewrites it) → Vue
  provides it for the first time: Tabs, Dropdown menu, Dialog, Toast, Accordion.

Pure-CSS primitives (badge, card, status, alert, etc.) are intentionally excluded — a
Vue wrapper there is just `<span class="ds-badge"><slot/></span>` and adds indirection
without value.

## Locked decisions

| Decision | Choice |
| --- | --- |
| Distribution | Ship inside the existing offline release zip (`dist/bundle/vue/`); consumers unzip and copy `vue/` into their app. No npm package / submodule. |
| Scope | High-value interactive tier only (10 components). Thin tier deferred. |
| Format / language | Vue 3 SFC, `<script setup lang="ts">`, raw `.vue` source (consumer's build compiles). |
| Styling | Apply existing `.ds-*` / `.is-*` classes; **no `<style>` blocks**. Consumer imports `tokens.css` + `base.css` + `components.css`. |
| Behavior strategy | Approach A — reimplement behavior idiomatically in Vue. `ds.js` is left untouched for the plain-HTML docs/site path. |
| DsSortable | Wraps `sortablejs` (consumer runs `npm i sortablejs`), matching current docs behavior. |
| Testing | Vitest + @vue/test-utils + happy-dom + `vue-tsc`; one behavior test per component (TDD). First test setup in the repo. |
| Docs (v1) | `vue/README.md` with copy-in instructions and per-component usage examples. No live playground. |

## Architecture

New top-level `vue/` directory:

```
vue/
  components/
    DsCombobox.vue        DsTree.vue            DsContextMenu.vue
    DsDropdownMenu.vue    DsTabs.vue            DsTabPanel.vue
    DsAccordion.vue       DsAccordionItem.vue   DsDialog.vue
    DsToastHost.vue       DsSplitter.vue        DsSortable.vue
  composables/
    useDismiss.ts         (outside-click + Escape close)
    useFocusTrap.ts       (reactive port of window.dsFocusTrap)
    useRovingTabindex.ts  (reactive port of window.dsRovingTabindex)
    useAnnounce.ts        (aria-live announcer, port of window.dsAnnounce)
    useToast.ts           (programmatic toast queue)
  types.ts                shared TS types (see Data model)
  index.ts                barrel re-exports of all components + composables + types
  README.md               copy-in + per-component usage
```

The `composables/` are reactive TypeScript ports of the focus-trap, roving-tabindex,
and live-region primitives currently in `js/ds.js`. Writing them once here keeps the
per-component SFCs small and prevents behavior duplication across components.

### Unit boundaries

Each component is independently understandable and testable:

- **What it does**: one interactive primitive (e.g. a combobox).
- **How you use it**: typed props + `v-model` + slots; documented in README.
- **What it depends on**: shared composables, `types.ts`, and the existing CSS classes
  — nothing else. `DsSortable` additionally depends on `sortablejs`.

## Components & contracts

Conventions across all components: `<script setup lang="ts">`, typed `defineProps` /
`defineEmits`, no `<style>`, render existing `.ds-*` markup, toggle `.is-*` state
classes, keyboard a11y matching `ds.js` where a precedent exists.

1. **DsCombobox** — `v-model` (value or value[]). Props: `options: ComboOption[]`,
   `multiple`, `checklist`, `filterable`, `placeholder`. Emits `update:modelValue`.
   Renders `.ds-combo` + `.ds-combo-btn/-menu/-option`, chips for multi, filter input
   for filterable. Outside-click/Esc via `useDismiss`. Replaces the `.ds-combo` logic
   in `ds.js`.
2. **DsTree** — `v-model:selected` (id) + `v-model:expanded` (id[]). Props:
   `nodes: TreeNode[]`. Arrow-key navigation, expand/collapse, roving tabindex,
   `role="tree"`. Mirrors the `.ds-tree` keyboard contract in `ds.js`.
3. **DsContextMenu** — wraps a trigger slot; props `items: MenuItem[]` (supports
   nested submenus via `MenuItem.children`). Opens at cursor on `contextmenu`,
   viewport-flips, focus-trap + roving tabindex, Esc closes and restores focus.
   Reactive replacement for the `data-ds-context` template-clone mechanism.
4. **DsDropdownMenu** — trigger slot + `items: MenuItem[]`. Toggle open/close,
   outside-click/Esc, keyboard nav. (No behavior exists today; new.)
5. **DsTabs** / **DsTabPanel** — `DsTabs` holds `v-model` (active tab id) and renders
   `.ds-tabs`/`.ds-tab.is-active`; `DsTabPanel` (slotted) shows when active. Arrow-key
   tab nav. (Docs markup is presentational only today; new behavior.)
6. **DsAccordion** / **DsAccordionItem** — `DsAccordion` `v-model` = open id or id[]
   (`multiple` prop). Renders `.ds-accordion`/`.ds-acc` with `.is-open` toggling.
7. **DsDialog** — `v-model:open`. `<Teleport to="body">`, `.ds-overlay` backdrop +
   `.ds-dialog`, `useFocusTrap` + `useDismiss`, scroll-lock, focus restore on close.
   Slots: `head`, `body` (default), `foot`. (New behavior; only the shell + a manual
   `dsFocusTrap` helper exist today.)
8. **DsToastHost** + `useToast()` — host placed near app root renders `.ds-toast-stack`;
   `useToast()` exposes `toast(opts)`/`dismiss(id)`. Announces via `useAnnounce`.
   Mirrors `.ds-toast` + `dsAnnounce`.
9. **DsSplitter** — `v-model:size` (px). Wraps `.ds-resizable` panes, drag + arrow-key
   resize, dblclick reset, emits `ds:resize` parity. Port of the `[data-ds-splitter]`
   logic in `ds.js`.
10. **DsSortable** — `v-model` (list array). Wraps `sortablejs`; reorders the bound
    array on drop. Props: `handle?`, `animation?`. Uses `ds-drop-placeholder` /
    `is-dragging` classes for parity with `ds.js`.

## Data model (`vue/types.ts`)

```ts
export interface ComboOption { value: string; label: string; disabled?: boolean }
export interface TreeNode { id: string; label: string; children?: TreeNode[] }
export interface MenuItem {
  id: string; label?: string; danger?: boolean; separator?: boolean;
  disabled?: boolean; children?: MenuItem[]; onSelect?: () => void;
}
export interface TabItem { id: string; label: string; disabled?: boolean }
export interface ToastOptions {
  id?: string; message: string; tone?: 'info' | 'success' | 'warn' | 'danger';
  timeout?: number; assertive?: boolean;
}
```

## Distribution & build

- Extend `tools/bundle.mjs` to copy `vue/` → `dist/bundle/vue/` (recursive), alongside
  the existing CSS/icons/fonts copy steps.
- Add a "Use the Vue components" section to the bundle README (`tools/bundle-readme.md`)
  describing: unzip → copy `vue/` → import `tokens.css`/`base.css`/`components.css` →
  `npm i sortablejs` (only if using `DsSortable`) → `import { DsCombobox } from './vue'`.
- Ships as **raw `.vue` source**; the consumer's own Vite/Vue build compiles it.
- `dist/` stays gitignored. No new **runtime** dependency is added to this repo
  (`sortablejs` is a consumer-side install; `vue` is a dev/peer concern for typecheck
  and tests only).

## Testing

First automated test setup in the repo, scoped to `vue/`:

- **Tooling**: Vitest + `@vue/test-utils` + `happy-dom`, plus `vue-tsc --noEmit` for type
  checking. Add `vue` (+ types), `vitest`, `@vue/test-utils`, `happy-dom`, `vue-tsc`,
  `sortablejs` (+ types) as devDependencies. Add `test` and `typecheck` npm scripts.
- **Approach (TDD)**: one behavior test per component covering the core contract —
  `v-model` round-trip, open/close, and key handling (e.g. Esc closes DsDialog; arrow
  keys move selection in DsTree). Red-green per component.
- **Type safety**: `vue-tsc` must pass clean over `vue/`.
- The existing icon/build verification (`npm run build`, `icons:check`) is unaffected and
  must still pass.

## Out of scope (v1)

- Thin tier: switch, checkbox, radio, segmented, slider, number (cheap `v-model`
  wrappers; revisit as a follow-up tier).
- Live in-docs Vue playground (the docs site is static HTML; a runtime Vue demo is a
  separate, larger project).
- Any change to `js/ds.js` — it remains the behavior layer for the plain-HTML docs site.
- npm-package / submodule distribution.

## Success criteria

1. All 10 high-value components usable in a Vue 3 + Vite + TS app by copying `vue/` and
   importing the existing CSS.
2. `v-model` works for every stateful component; keyboard a11y matches `ds.js` where a
   precedent exists.
3. No `<style>` blocks anywhere in `vue/`; visuals come entirely from the existing CSS
   (themes, density, reduced-motion keep working for free).
4. `vue/` is present in the offline bundle and documented in the bundle README.
5. `vitest` suite green; `vue-tsc` typecheck clean; `npm run build` + `icons:check` still pass.
```
