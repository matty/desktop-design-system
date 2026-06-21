# Complete the Vue Component Set — Design Spec

> Status: approved design, pre-implementation. Date: 2026-06-21.

## Goal

Build Vue 3 components for every `.ds-*` primitive the docs demonstrate that has real
structure, state, or variants — so entire desktop apps can be built in components
(`<DsButton variant="primary">`) rather than hand-written `.ds-*` markup. This completes
the Vue-first direction: the components become the primary consumption surface; the CSS
remains the styling engine beneath them (unchanged, still the source of styling truth).

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Coverage | Form-control tier + all display/content primitives + app-shell/layout. **Trivial typography/utility classes** (`ds-h1`, `ds-h2`, `ds-sub`, `ds-muted`, `ds-value`, `ds-label`-as-text) stay plain classes — no wrapper components. ~30 new components. |
| API style | **Typed variant/size/tone props** (string-literal unions) mapping to `.is-*` classes; `v-model` for stateful controls; slots for content; `inheritAttrs` passthrough as escape hatch. |
| Form controls | Standalone controls with `v-model` + a **`DsField`** wrapper (label/hint/error, wires `<label for>` + `aria-describedby`). |
| Icons | **`DsIcon`** (renders offline registry SVG via `icons.js` `iconSvg`) + an `icon` slot on icon-bearing components. |
| Variant↔CSS | A variant/state prop exists **only if its `.is-*`/modifier class exists in `components.css`** (validated by test). CSS stays the source of truth. |
| DsTable | **Slot-based wrapper** (renders `.ds-table`; rows via slots) for v1; no data-driven columns/sort. |
| Storybook | **Out of scope** — separate follow-up spec. Tested here with the existing Vitest + `vue-component-meta` stack. |

## Component roster (~30 new)

Final exact split may merge/divide a few during planning; names follow the existing
`Ds*` convention and append to `vue/index.ts`.

- **Foundation:** `DsIcon`, `DsButton` (variant: primary/ghost/danger; size: sm/lg;
  `icon`, `loading`, `disabled`).
- **Form controls + field:** `DsInput`, `DsTextarea`, `DsNumber`, `DsSwitch`,
  `DsCheckbox`, `DsRadioGroup`, `DsSlider`, `DsSegmented`, `DsField`.
- **Display/content:** `DsCard`, `DsPanel`, `DsBadge`, `DsPill`, `DsChip`, `DsKbd`,
  `DsStatus`, `DsAvatar`, `DsAlert`, `DsBanner`, `DsEmpty`, `DsTip`, `DsDivider`,
  `DsSkeleton`, `DsSpinner`, `DsMeter`, `DsProgress`, `DsTable`, `DsDescriptionList`,
  `DsFacts`, `DsList` / `DsListItem`, `DsRow`, `DsSteps`.
- **App-shell/layout:** `DsTitlebar`, `DsRail` / `DsNavItem`, `DsStatusbar`, `DsToolbar`,
  `DsBreadcrumb`.

(Already shipped, not rebuilt: DsCombobox, DsTree, DsContextMenu, DsDropdownMenu, DsTabs/
DsTabPanel, DsAccordion/DsAccordionItem, DsDialog, DsToastHost, DsSplitter, DsSortable.)

## Conventions (uniform across all components)

- Vue 3 SFC, `<script setup lang="ts">`, **no `<style>` block** — visuals come only from
  the existing `.ds-*` / `.is-*` classes; components map props to those classes.
- **Props derived from real CSS state.** For each component, enumerate the family's actual
  `.is-*`/modifier classes in `components.css`; expose them as typed props (unions). Never
  invent a variant without a backing class.
- **`v-model`** for stateful controls (`modelValue` + `update:modelValue`; checkbox/radio
  support the standard array/group patterns; switch is boolean).
- **Slots** for projected content (default + named like `header`/`footer`/`icon`).
- **`inheritAttrs`** so consumers can pass extra classes/attrs to the root as an escape
  hatch (e.g. `u-w-full` for sizing — per the form-control sizing note in the README).
- Shared types in `vue/types.ts` (e.g. `Tone = "info"|"success"|"warn"|"danger"`,
  `Size = "sm"|"md"|"lg"`), reused across components.
- **Icons:** `DsIcon` resolves a name against `icons/registry.json` (warn if missing);
  components expose an `icon` slot so consumers pass `<DsIcon>` or any SVG.
- a11y: appropriate roles/aria per component (`role="alert"` on alerts, `aria-current` on
  active nav item, label association via `DsField`, etc.).

## Form controls + DsField

Each control is standalone and `v-model`-bound. `DsField` wraps a control:
```html
<DsField label="Email" hint="We never share it" :error="errors.email">
  <DsInput v-model="email" type="email" />
</DsField>
```
`DsField` renders the `.ds-field` structure, generates an id, wires `<label for>` and
`aria-describedby` to the slotted control, and shows the error via the existing
`.ds-field-error` markup. Controls remain usable standalone without `DsField`.

## Testing

Existing stack (Vitest + @vue/test-utils + happy-dom; `vue-component-meta`/`vue-tsc`
typecheck). Per component:
- renders the correct base `.ds-*` class and the right `.is-*` for each variant prop;
- **a test asserts every variant-mapped class actually exists in `components.css`** (the
  variant↔CSS invariant);
- `v-model` round-trips for controls; `DsField` wires label/aria;
- no `<style>` blocks anywhere in `vue/`.
- `npm run build` + `npm run typecheck` stay green.

## File structure

```
vue/components/Ds*.vue        ~30 new SFCs (+ sub-components like DsNavItem, DsListItem)
vue/types.ts                  extended with shared Tone/Size unions
vue/index.ts                  barrel: append new exports
```
No new top-level structure. `tools/bundle.mjs` already copies `vue/` recursively, so the
new components ship in `dist/bundle/vue/` automatically.

## Phasing (for the implementation plan)

Independently shippable, like the first Vue phases:
- **A — Foundation:** `DsIcon`, `DsButton`, shared `Tone`/`Size` unions + the
  variant↔CSS test helper.
- **B — Form controls + `DsField`.**
- **C — Display/content primitives.**
- **D — App-shell/layout.**
Each phase: TDD per component, whole-phase review, merge to `main`.

## Non-goals

- Storybook (separate spec next), built to be Storybook-ready but not set up here.
- No new CSS or `.is-*` states; no changes to `components.css`.
- No trivial typography wrapper components.
- `DsTable` is slot-based only (no columns/sort/data-grid).
- Distribution unchanged (copy-in / offline bundle).

## Success criteria

1. Every in-scope `.ds-*` family has a Vue component using typed variant props mapped to
   real `.is-*` classes; trivial typography/utilities intentionally excluded.
2. Form controls work with `v-model`; `DsField` provides label/hint/error with correct
   `<label for>`/`aria-describedby` wiring.
3. `DsIcon` renders registry icons offline; icon-bearing components accept an `icon` slot.
4. No `<style>` blocks in `vue/`; the variant↔CSS invariant test passes (no prop maps to a
   non-existent class).
5. All components export from `vue/index.ts` and ship in the offline bundle; `npm run
   build`, `npm test`, and `npm run typecheck` stay green.
