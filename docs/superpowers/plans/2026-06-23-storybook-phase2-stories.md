# Storybook — Phase 2: Stories for All Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author CSF3 stories for every public component (~47, `DsButton` already done), so each gets an autodocs API page + a Default story and meaningful variant/composed stories, grouped by title.

**Architecture:** Lean stories following the `DsButton.stories.ts` exemplar (CSF3 + `tags:['autodocs']`). Three reusable patterns (simple-slot, variant-args, stateful/composed-render). Sub-components (DsTreeNode, DsTabPanel, DsAccordionItem, DsListItem, DsFact) are demonstrated inside their parent's stories, not given standalone story files. Verification per task is that `build-storybook` compiles the new stories with no errors.

**Tech Stack:** Storybook 10.4.6 (`@storybook/vue3-vite`), Vue 3.5 `<script setup>`, `@storybook/vue3-vite` CSF3 types, `vue-component-meta` autodocs.

## Global Constraints

- Stories are `vue/components/Ds<Name>.stories.ts`, picked up by the SB glob `../vue/**/*.stories.@(ts|js)`. They are NOT unit tests — the unit-test Vitest glob is `vue/**/*.test.ts`, which excludes `.stories.ts` (do not let stories regress unit tests).
- Each story file: `import type { Meta, StoryObj } from "@storybook/vue3-vite"`, import the component from `./Ds<Name>.vue`, `meta` with `component`, `title` (group prefix below), `tags:['autodocs']`; export a `Default` story; add variant/composed stories only where meaningful.
- Title groups: `Foundation/*`, `Form/*`, `Display/*`, `Shell/*`, `Interactive/*`.
- NO `<style>` and NO changes to any component, `css/`, `pages/`, `js/ds.js`, `tools/bundle.mjs`, or `.storybook/` config. Only add `*.stories.ts` files.
- Verification per task: `npm run build-storybook -- -o storybook-static` exits 0 (the new stories compile). Final task also runs `npm test`/`typecheck`/`build` to confirm no regression and checks every public component has a story.
- ESM, two-space indentation. One commit per task.

## Story patterns (apply these; the `DsButton.stories.ts` file is the canonical example)

**Pattern S — simple slot wrapper** (no variant props): a single `Default` story.
```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsCard from "./DsCard.vue";
const meta: Meta<typeof DsCard> = {
  title: "Display/DsCard",
  component: DsCard,
  tags: ["autodocs"],
  render: (args) => ({ components: { DsCard }, setup: () => ({ args }), template: `<DsCard v-bind="args">Card body</DsCard>` })
};
export default meta;
export const Default: StoryObj<typeof DsCard> = {};
```

**Pattern V — variant args**: `argTypes` for the variant props + named stories via `args`.
```ts
const meta: Meta<typeof DsBadge> = {
  title: "Display/DsBadge",
  component: DsBadge,
  tags: ["autodocs"],
  argTypes: { tone: { control: "select", options: [undefined, "info", "success", "warning", "danger"] } },
  render: (args) => ({ components: { DsBadge }, setup: () => ({ args }), template: `<DsBadge v-bind="args">Badge</DsBadge>` })
};
export const Default: StoryObj<typeof DsBadge> = {};
export const Danger: StoryObj<typeof DsBadge> = { args: { tone: "danger" } };
export const Solid: StoryObj<typeof DsBadge> = { args: { solid: true } };
```

**Pattern R — stateful / composed render**: a `render` with `setup()` holding a `ref` for `v-model`, and composing sub-components.
```ts
import { ref } from "vue";
const meta: Meta<typeof DsInput> = { title: "Form/DsInput", component: DsInput, tags: ["autodocs"] };
export const Default: StoryObj<typeof DsInput> = {
  render: () => ({ components: { DsInput }, setup() { const v = ref(""); return { v }; }, template: `<DsInput v-model="v" placeholder="Type…" style="width:240px" />` })
};
```

---

### Task 1: Foundation + Form stories

**Files (create):** `DsIcon.stories.ts`, `DsInput.stories.ts`, `DsTextarea.stories.ts`, `DsNumber.stories.ts`, `DsSwitch.stories.ts`, `DsCheckbox.stories.ts`, `DsRadioGroup.stories.ts`, `DsSlider.stories.ts`, `DsSegmented.stories.ts`, `DsField.stories.ts` (all in `vue/components/`).

Per-component (title `Foundation/*` for DsIcon, else `Form/*`):
- **DsIcon** (Pattern V): `argTypes.name` a `select` of a few real registry names (e.g. `["play","search","settings","trash"]` — pick names that exist in `icons/registry.json`); `Default` renders `<DsIcon name="settings" />`; a `Sizes` story rendering several `:size` values.
- **DsInput** (Pattern R): `Default` (v-model ref, width:240px); `Invalid` (`invalid` + a value); `Mono` (`mono`).
- **DsTextarea** (Pattern R): `Default` (v-model ref, width:280px); `Invalid`.
- **DsNumber** (Pattern R): `Default` (v-model ref number, `:min="0" :max="10"`).
- **DsSwitch** (Pattern R): `Default` (v-model boolean ref).
- **DsCheckbox** (Pattern R): `Default` (v-model boolean ref, slot "Remember me").
- **DsRadioGroup** (Pattern R): `Default` (v-model ref + `:options="[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]"`).
- **DsSlider** (Pattern R): `Default` (v-model number ref, `:min="0" :max="100"`).
- **DsSegmented** (Pattern R): `Default` (v-model ref + options `[{value:'a',label:'A'},{value:'b',label:'B'}]`).
- **DsField** (Pattern R, composed): `Default` wraps a `DsInput` with `label="Email" hint="We never share it"`; an `Error` story with `:error="'Required'"` wrapping a DsInput. Import both DsField + DsInput.

- [ ] **Step 1: Author the 10 story files** following the patterns above (autodocs tag, correct title group, render functions for v-model controls).
- [ ] **Step 2: Verify they compile** — `npm run build-storybook -- -o storybook-static` → exit 0; grep the build log for errors referencing these components (expect none).
- [ ] **Step 3: Confirm unit tests unaffected** — `npm test 2>&1 | tail -3` (147 pass; stories not picked up).
- [ ] **Step 4: Commit**
```bash
git add vue/components/DsIcon.stories.ts vue/components/DsInput.stories.ts vue/components/DsTextarea.stories.ts vue/components/DsNumber.stories.ts vue/components/DsSwitch.stories.ts vue/components/DsCheckbox.stories.ts vue/components/DsRadioGroup.stories.ts vue/components/DsSlider.stories.ts vue/components/DsSegmented.stories.ts vue/components/DsField.stories.ts
git commit -m "storybook: Foundation + Form stories"
```

---

### Task 2: Display stories — group A

**Files (create):** `DsCard.stories.ts`, `DsPanel.stories.ts`, `DsBadge.stories.ts`, `DsPill.stories.ts`, `DsChip.stories.ts`, `DsKbd.stories.ts`, `DsStatus.stories.ts`, `DsAvatar.stories.ts` (title `Display/*`).

- **DsCard** (S): Default slot "Card body".
- **DsPanel** (R/S): Default with `title="Sync"` + body slot text; a `WithActions` story using the `actions` slot (a DsButton or plain text).
- **DsBadge** (V): tone select + `Default`/`Danger`/`Solid` (as in Pattern V example).
- **DsPill** (S): Default slot "v2.4.0".
- **DsChip** (V/R): `Default` slot "Tag"; `Removable` with `removable` (note: remove is a button; story can ignore the emit).
- **DsKbd** (S): Default slot "Ctrl".
- **DsStatus** (V): `argTypes.state` select of `["on","off","busy","error","info","success","warning"]`; `Default` `state="on"` slot "Online"; an `AllStates` render showing each.
- **DsAvatar** (V/R): `Default` slot "JR"; `Sizes` (sm/lg); `Image` with `src` (use a placeholder data-URI or a small inline svg data URL + `alt`).

- [ ] **Step 1: Author the 8 story files.**
- [ ] **Step 2: `npm run build-storybook -- -o storybook-static` → exit 0.**
- [ ] **Step 3: Commit** (`git add` the 8 files; `git commit -m "storybook: Display stories (card/panel/badge/pill/chip/kbd/status/avatar)"`).

---

### Task 3: Display stories — group B

**Files (create):** `DsAlert.stories.ts`, `DsBanner.stories.ts`, `DsEmpty.stories.ts`, `DsDivider.stories.ts`, `DsSkeleton.stories.ts`, `DsSpinner.stories.ts`, `DsMeter.stories.ts`, `DsProgress.stories.ts` (title `Display/*`).

- **DsAlert** (V): tone select; `Default` (info) with body slot text; `Danger`; `Dismissible` (`dismissible`). Use the `icon` slot with a `DsIcon` for one story (optional).
- **DsBanner** (V): `Default` slot text; `Warning` (`tone="warning"`).
- **DsEmpty** (S): Default slot "Nothing here yet".
- **DsDivider** (V): `Default` (`<hr>`); `Vertical` (`vertical`); `Labeled` (`label="or"`).
- **DsSkeleton** (S): Default (a sized box via `style="width:200px;height:16px"` passthrough).
- **DsSpinner** (V): `Default`; `Large` (`large`).
- **DsMeter** (V): `Default` `:value="30" :max="60" label="CPU"`.
- **DsProgress** (V): `Default` `:value="64"`.

- [ ] **Step 1: Author the 8 story files.**
- [ ] **Step 2: `npm run build-storybook -- -o storybook-static` → exit 0.**
- [ ] **Step 3: Commit** (`git commit -m "storybook: Display stories (alert/banner/empty/divider/skeleton/spinner/meter/progress)"`).

---

### Task 4: Display group C + Shell stories

**Files (create):** `DsTable.stories.ts`, `DsDescriptionList.stories.ts`, `DsFacts.stories.ts`, `DsList.stories.ts`, `DsRow.stories.ts`, `DsTitlebar.stories.ts`, `DsRail.stories.ts`, `DsToolbar.stories.ts`, `DsStatusbar.stories.ts`, `DsBreadcrumb.stories.ts`.

- **DsTable** (R, Display): `Default` render with slotted `<thead>/<tbody>` rows (a few rows).
- **DsDescriptionList** (R, Display): `Default` render with slotted `<dt>/<dd>` pairs.
- **DsFacts** (R, Display, composed): `Default` render composing `DsFacts` (`:cols="2"`) with several `DsFact` children (`term`/`value`). Import DsFacts + DsFact.
- **DsList** (R, Display, composed): `Default` render composing `DsList` with `DsListItem` children (one `selected`). Import DsList + DsListItem.
- **DsRow** (R/V, Display): `Default` with `title`/`description` + a control in the default slot (a DsSwitch or plain text).
- **DsTitlebar** (V, Shell): `Default` with `title="Demo App"` (emits ignored).
- **DsRail** (R, Shell, composed): `Default` render composing `DsRail` with several `DsNavItem` children (one `active`, with `label`), and a `bottom` slot item. Import DsRail + DsNavItem.
- **DsToolbar** (R, Shell): `Default` with `title="Runs"` + an action (DsButton/text) in the default slot.
- **DsStatusbar** (R, Shell): `Default` with `start`/`end` slot content (`.seg` spans or plain text).
- **DsBreadcrumb** (V, Shell): `Default` `:items="[{label:'Library',href:'#'},{label:'Games',href:'#'},{label:'Elden Ring'}]"`.

- [ ] **Step 1: Author the 10 story files.**
- [ ] **Step 2: `npm run build-storybook -- -o storybook-static` → exit 0.**
- [ ] **Step 3: Commit** (`git commit -m "storybook: Display group C + Shell stories"`).

---

### Task 5: Interactive stories + Phase 2 gate

**Files (create):** `DsCombobox.stories.ts`, `DsTree.stories.ts`, `DsContextMenu.stories.ts`, `DsDropdownMenu.stories.ts`, `DsTabs.stories.ts`, `DsAccordion.stories.ts`, `DsDialog.stories.ts`, `DsToastHost.stories.ts`, `DsSplitter.stories.ts`, `DsSortable.stories.ts` (title `Interactive/*`). These are Pattern R (stateful/composed). NO `play` functions yet — those are Phase 3.

- **DsCombobox** (R): `Single` (v-model ref + `:options`); `Multiple` (`multiple`, array ref); `Filterable` (`filterable`). Each `style="width:240px"`.
- **DsTree** (R): `Default` render with `:nodes` (a small tree) + `v-model:selected`/`v-model:expanded` refs.
- **DsContextMenu** (R): `Default` render wrapping a `.ds-card` target with `:items`; note in story description "right-click the box".
- **DsDropdownMenu** (R): `Default` render with `:items` + `#trigger` slot ("Actions ▾").
- **DsTabs** (R, composed): `Default` render composing `DsTabs` (`v-model` ref + `:tabs`) with `DsTabPanel` children. Import DsTabs + DsTabPanel.
- **DsAccordion** (R, composed): `Single` (v-model ref) + `DsAccordionItem` children; `Multiple` (`multiple`, array ref). Import DsAccordion + DsAccordionItem.
- **DsDialog** (R): `Default` render with an `open` ref + a DsButton to open it, `v-model:open`, title + body slot + foot slot (Cancel/Delete). Import DsDialog + DsButton.
- **DsToastHost** (R): `Default` render mounting `<DsToastHost />` + a DsButton whose click calls `useToast().toast({ message:'Saved', tone:'success' })`. Import DsToastHost + DsButton + useToast.
- **DsSplitter** (R): `Default` render with a `size` ref + `#first`/`#second` slots inside a fixed-height container.
- **DsSortable** (R): `Default` render with a list ref + `#item` slot.

- [ ] **Step 1: Author the 10 interactive story files** (render functions with refs/composition as above).
- [ ] **Step 2: Full Phase 2 gate**
  - `npm run build-storybook -- -o storybook-static` → exit 0 (ALL stories compile).
  - `npm test 2>&1 | tail -3` → 147 pass (unaffected).
  - `npm run typecheck` → exit 0.
  - `npm run build` → exit 0.
  - **Coverage check:** every public component has a story. Run:
    ```bash
    for f in vue/components/Ds*.vue; do b=$(basename "$f" .vue); case "$b" in DsTreeNode|DsTabPanel|DsAccordionItem|DsListItem|DsFact) continue;; esac; [ -f "vue/components/$b.stories.ts" ] || echo "MISSING story: $b"; done; echo "coverage check done"
    ```
    Expected: only "coverage check done" (no MISSING lines).
- [ ] **Step 3: Commit** (`git commit -m "storybook: Interactive stories + Phase 2 coverage gate"`).

---

## Self-Review

- **Spec coverage (Phase 2):** Foundation+Form (T1), Display A/B/C (T2/T3/T4), Shell (T4), Interactive (T5) — every public component gets a story; sub-components shown in parent stories; autodocs via the `tags:['autodocs']` + the docgen configured in Phase 1. `play` interaction tests deliberately deferred to Phase 3.
- **Placeholder scan:** none — the three story patterns carry the full boilerplate and each component lists its concrete stories/args; the implementer applies the pattern (the `DsButton.stories.ts` exemplar is in-repo).
- **Consistency:** all stories use `@storybook/vue3-vite` CSF3 types, `tags:['autodocs']`, the title groups, and `vue/components/` co-location. v-model stories use a `ref` in `setup()`. The coverage check enumerates the exact sub-components excluded.
- **Verification model:** stories are docs artifacts, so the gate is `build-storybook` compiling them (+ the coverage check), not unit tests — explicitly noted (no TDD red/green for stories).
