# Vue Components — Phase E: Cheap A11y + Test Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the low-effort, high-impact accessibility fixes from the deep review (roles, accessible names, keyboard-reachable controls) plus close the test "renders-unstyled" blind spot, without the heavy keyboard-nav rework (deferred to a full-a11y workstream).

**Architecture:** Targeted attribute/markup additions to existing SFCs (no new components, no `<style>`), each locked by a test. Test hardening adds `cssHas` assertions for sub-element classes that DOM-asserting tests currently leave unguarded.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest + @vue/test-utils + happy-dom. No new deps.

## Global Constraints

- Vue 3 SFC `<script setup lang="ts">`, NO `<style>` block. No new CSS classes; do not touch `css/`, `js/ds.js`, `src/`, `pages/`.
- a11y additions are attributes only (role/aria-*) and the chip span→button change; no behavior changes beyond keyboard-reachability of the chip remove control.
- Each component change is covered by a test assertion. `npm test`/`npm run typecheck` stay green; final task runs `npm run build`.
- ESM, two-space indentation. Commit per task.

## Out of scope (deferred to a full-a11y workstream)

DsCombobox listbox keyboard navigation + `aria-activedescendant`; DsSortable keyboard reordering + live announce; DsTabs panel `id`/`aria-controls`/`aria-labelledby` + focus-on-keynav; DsTree `role="none"`/`role="group"` + initial tabindex; DsStatus color-only meaning. (Recorded in the ledger.)

---

### Task 1: Roles + values on DsProgress, DsMeter, DsSpinner

**Files:** Modify `DsProgress.vue`, `DsMeter.vue`, `DsSpinner.vue` + their tests.

**Interfaces:** add ARIA so screen readers announce these (currently invisible).

- [ ] **Step 1: Add failing assertions**

`DsProgress.test.ts` — add:
```ts
it("exposes progressbar role + aria values", () => {
  const w = mount(DsProgress, { props: { value: 40, max: 80 } });
  const el = w.find(".ds-progress");
  expect(el.attributes("role")).toBe("progressbar");
  expect(el.attributes("aria-valuenow")).toBe("40");
  expect(el.attributes("aria-valuemin")).toBe("0");
  expect(el.attributes("aria-valuemax")).toBe("80");
});
```
`DsMeter.test.ts` — add:
```ts
it("exposes meter role + aria values + label name", () => {
  const w = mount(DsMeter, { props: { value: 30, max: 60, label: "CPU" } });
  const el = w.find(".ds-meter");
  expect(el.attributes("role")).toBe("meter");
  expect(el.attributes("aria-valuenow")).toBe("30");
  expect(el.attributes("aria-valuemax")).toBe("60");
  expect(el.attributes("aria-label")).toBe("CPU");
});
```
`DsSpinner.test.ts` — add:
```ts
it("exposes status role + accessible name", () => {
  const w = mount(DsSpinner);
  expect(w.find(".ds-spinner").attributes("role")).toBe("status");
  expect(w.find(".ds-spinner").attributes("aria-label")).toBe("Loading");
});
```

- [ ] **Step 2: Run → FAIL** (`npm test -- DsProgress DsMeter DsSpinner`).

- [ ] **Step 3: Implement**

In `DsProgress.vue`, on the `.ds-progress` element add: `role="progressbar" :aria-valuenow="value" aria-valuemin="0" :aria-valuemax="max"`.
In `DsMeter.vue`, on the `.ds-meter` element add: `role="meter" :aria-valuenow="value" aria-valuemin="0" :aria-valuemax="max" :aria-label="label"`.
In `DsSpinner.vue`, on the `.ds-spinner` element add: `role="status" aria-label="Loading"`.

- [ ] **Step 4: Verify** `npm test -- DsProgress DsMeter DsSpinner` pass; `npm run typecheck` 0.
- [ ] **Step 5: Commit**
```bash
git add vue/components/DsProgress.vue vue/components/DsMeter.vue vue/components/DsSpinner.vue vue/components/DsProgress.test.ts vue/components/DsMeter.test.ts vue/components/DsSpinner.test.ts
git commit -m "vue(a11y): add progressbar/meter/status roles + aria values"
```

---

### Task 2: Accessible names on landmarks/buttons (DsBreadcrumb, DsRail, DsTitlebar, DsNumber)

**Files:** Modify `DsBreadcrumb.vue`, `DsRail.vue`, `DsTitlebar.vue`, `DsNumber.vue` + tests.

**Interfaces:**
- DsBreadcrumb: `<nav aria-label="Breadcrumb">`, current item gets `aria-current="page"`, separator `aria-hidden="true"`.
- DsRail: optional `label?` prop → `<nav :aria-label="label ?? 'Navigation'">`.
- DsTitlebar: window buttons get `aria-label` ("Minimize"/"Maximize"/"Close") in addition to `title`.
- DsNumber: step buttons get `aria-label` ("Increment"/"Decrement") and their SVGs `aria-hidden="true"`.

- [ ] **Step 1: Add failing assertions**

`DsBreadcrumb.test.ts` — add:
```ts
it("labels the nav, marks current, hides separators", () => {
  const w = mount(DsBreadcrumb, { props: { items: [{ label: "A", href: "#" }, { label: "B" }] } });
  expect(w.find("nav.ds-breadcrumb").attributes("aria-label")).toBe("Breadcrumb");
  expect(w.find(".current").attributes("aria-current")).toBe("page");
  expect(w.find(".sep").attributes("aria-hidden")).toBe("true");
});
```
`DsRail.test.ts` — add:
```ts
it("labels the nav landmark (default + custom)", () => {
  expect(mount(DsRail).find("nav.ds-rail").attributes("aria-label")).toBe("Navigation");
  expect(mount(DsRail, { props: { label: "Primary" } }).find("nav").attributes("aria-label")).toBe("Primary");
});
```
`DsTitlebar.test.ts` — add:
```ts
it("labels the window buttons", () => {
  const btns = mount(DsTitlebar, { props: { title: "App" } }).findAll(".ds-winbtns button");
  expect(btns[0].attributes("aria-label")).toBe("Minimize");
  expect(btns[1].attributes("aria-label")).toBe("Maximize");
  expect(btns[2].attributes("aria-label")).toBe("Close");
});
```
`DsNumber.test.ts` — add:
```ts
it("labels the step buttons", () => {
  const btns = mount(DsNumber, { props: { modelValue: 1 } }).findAll(".ds-step button");
  expect(btns[0].attributes("aria-label")).toBe("Increment");
  expect(btns[1].attributes("aria-label")).toBe("Decrement");
});
```

- [ ] **Step 2: Run → FAIL** (`npm test -- DsBreadcrumb DsRail DsTitlebar DsNumber`).

- [ ] **Step 3: Implement**

- `DsBreadcrumb.vue`: `<nav class="ds-breadcrumb" aria-label="Breadcrumb">`; the `<span class="sep">` gets `aria-hidden="true"`; the `<span class="current">` gets `aria-current="page"`.
- `DsRail.vue`: add `defineProps<{ label?: string }>()`; `<nav class="ds-rail" :aria-label="label ?? 'Navigation'">`.
- `DsTitlebar.vue`: add `aria-label="Minimize"`/`"Maximize"`/`"Close"` to the three buttons (keep `title`).
- `DsNumber.vue`: add `aria-label="Increment"` / `aria-label="Decrement"` to the up/down buttons, and `aria-hidden="true"` on each step `<svg>`.

- [ ] **Step 4: Verify** `npm test -- DsBreadcrumb DsRail DsTitlebar DsNumber` pass; typecheck 0.
- [ ] **Step 5: Commit**
```bash
git add vue/components/DsBreadcrumb.vue vue/components/DsRail.vue vue/components/DsTitlebar.vue vue/components/DsNumber.vue vue/components/DsBreadcrumb.test.ts vue/components/DsRail.test.ts vue/components/DsTitlebar.test.ts vue/components/DsNumber.test.ts
git commit -m "vue(a11y): accessible names for breadcrumb/rail/titlebar/number controls"
```

---

### Task 3: Keyboard-reachable chip remove + menu/group names + accordion summary cleanup

**Files:** Modify `DsChip.vue`, `DsCombobox.vue`, `DsDropdownMenu.vue`, `DsContextMenu.vue`, `DsRadioGroup.vue`, `DsSegmented.vue`, `DsAccordionItem.vue` + relevant tests.

**Interfaces:**
- Chip remove control becomes a real `<button type="button" aria-label="Remove">` (keyboard-reachable) in `DsChip` and in `DsCombobox`'s chips. Keep the `.ds-chip-x` class so styling is unchanged.
- `DsDropdownMenu`, `DsContextMenu`, `DsRadioGroup`, `DsSegmented`: add an optional `ariaLabel?: string` prop applied as `aria-label` on the menu/group element (so the group/menu has an accessible name when provided).
- `DsAccordionItem`: remove the redundant `aria-expanded` from `<summary>` (native `<details>` conveys state); add `aria-hidden="true"` to the chevron `<svg>`.

- [ ] **Step 1: Add/adjust failing assertions**

`DsChip.test.ts` — change the remove test to assert a real button with a label:
```ts
it("remove control is a labelled button that emits remove", async () => {
  const w = mount(DsChip, { props: { removable: true }, slots: { default: () => "Tag" } });
  const btn = w.find("button.ds-chip-x");
  expect(btn.exists()).toBe(true);
  expect(btn.attributes("aria-label")).toBe("Remove");
  await btn.trigger("click");
  expect(w.emitted("remove")).toBeTruthy();
});
```
`DsDropdownMenu.test.ts` — add:
```ts
it("applies ariaLabel to the menu", async () => {
  const w = mount(DsDropdownMenu, { props: { items: [{ id: "a", label: "A" }], ariaLabel: "Actions" }, slots: { trigger: () => "M" } });
  await w.find(".ds-dropdown-btn").trigger("click");
  expect(w.find(".ds-menu").attributes("aria-label")).toBe("Actions");
});
```
`DsAccordion.test.ts` — add:
```ts
it("summary has no redundant aria-expanded", () => {
  const w = mount(DsAccordion, { props: { modelValue: "one" }, slots: { default: () => h(DsAccordionItem, { id: "one", title: "One" }, () => "B") } });
  expect(w.find("summary").attributes("aria-expanded")).toBeUndefined();
});
```
(Ensure `h`, `DsAccordionItem` are imported in that test.) For DsContextMenu/DsRadioGroup/DsSegmented add a one-line `aria-label` assertion mirroring the dropdown one (open/mount with `ariaLabel` and assert it on the `.ds-menu`/`.ds-segmented`/`[role=radiogroup]`).

- [ ] **Step 2: Run → FAIL** for the changed suites.

- [ ] **Step 3: Implement**

- `DsChip.vue`: change `<span v-if="removable" class="ds-chip-x" @click>×</span>` to `<button v-if="removable" type="button" class="ds-chip-x" aria-label="Remove" @click="emit('remove')">×</button>`.
- `DsCombobox.vue`: the chip remove element (the `.ds-chip-x` inside multi-mode chips) likewise becomes a `<button type="button" class="ds-chip-x" aria-label="Remove" @click.stop="removeChip(opt.value)">×</button>`.
- `DsDropdownMenu.vue` / `DsContextMenu.vue`: add `ariaLabel?: string` prop; bind `:aria-label="ariaLabel"` on the `.ds-menu`.
- `DsRadioGroup.vue`: add `ariaLabel?: string`; bind `:aria-label="ariaLabel"` on the `[role=radiogroup]` element.
- `DsSegmented.vue`: add `ariaLabel?: string`; bind `:aria-label="ariaLabel"` on the `.ds-segmented` `[role=group]`.
- `DsAccordionItem.vue`: remove `:aria-expanded="..."` from `<summary>`; add `aria-hidden="true"` to the chevron `<svg>`.

- [ ] **Step 4: Verify** the changed suites pass; `npm run typecheck` 0.
- [ ] **Step 5: Commit**
```bash
git add vue/components/DsChip.vue vue/components/DsCombobox.vue vue/components/DsDropdownMenu.vue vue/components/DsContextMenu.vue vue/components/DsRadioGroup.vue vue/components/DsSegmented.vue vue/components/DsAccordionItem.vue vue/components/DsChip.test.ts vue/components/DsDropdownMenu.test.ts vue/components/DsContextMenu.test.ts vue/components/DsRadioGroup.test.ts vue/components/DsSegmented.test.ts vue/components/DsAccordion.test.ts
git commit -m "vue(a11y): keyboard-reachable chip remove; menu/group names; accordion summary cleanup"
```

---

### Task 4: Test hardening — cssHas for sub-element classes + Phase E gate

**Files:** Modify the listed `*.test.ts` to assert sub-element classes against the CSS (close the "renders-unstyled" blind spot).

**Interfaces:** add `import { cssHas } from "../__support__/css"` (if not present) and existence assertions for each sub-element class the test already locates by DOM selector.

- [ ] **Step 1: Add assertions**

Add `cssHas` existence checks for these classes in their test files (one `expect(cssHas("X")).toBe(true)` per class):
- `DsBreadcrumb.test.ts`: `sep`, `current`
- `DsAccordion.test.ts`: `ds-acc-body`, `chev`
- `DsToastHost.test.ts`: `ds-toast-body`, `ds-toast-stack`, `ds-toast-close`
- `DsTree.test.ts`: `ds-tree-label`, `ds-tree-row`, `ds-tree-twisty`
- `DsCombobox.test.ts`: `ds-combo-check`, `ds-combo-chev`, `ds-combo-menu`
- `DsMeter.test.ts`: `track`, `fill`
- `DsFacts.test.ts`: `k`, `v`
- `DsSwitch.test.ts`: `ds-track`

(For each, confirm the class is actually present in `css/components.css` — they are; if any is genuinely absent, that is a real bug to report, not to assert true.)

- [ ] **Step 2: Run the changed suites** — they should pass (all these classes exist in CSS). If any `cssHas` returns false, STOP and report it as a real unstyled-class bug.

- [ ] **Step 3: Full Phase E gate**

Run: `npm test` → all suites pass (report totals).
Run: `npm run typecheck` → exits 0.
Run: `npm run build` → exit 0 (expected ds.js/docs.js/sortable warnings only).

- [ ] **Step 4: Commit**
```bash
git add vue/components/DsBreadcrumb.test.ts vue/components/DsAccordion.test.ts vue/components/DsToastHost.test.ts vue/components/DsTree.test.ts vue/components/DsCombobox.test.ts vue/components/DsMeter.test.ts vue/components/DsFacts.test.ts vue/components/DsSwitch.test.ts
git commit -m "vue(test): assert sub-element classes against CSS (close renders-unstyled blind spot)"
```

---

## Self-Review

- **Spec coverage (Phase E cheap tier):** display roles (T1), landmark/button names (T2), chip-button + menu/group names + accordion cleanup (T3), test hardening (T4). Matches the deep-review "cheap a11y + test hardening" scope; heavy keyboard work explicitly deferred.
- **Placeholder scan:** none — every step has concrete code/assertions or exact commands.
- **Type consistency:** new `ariaLabel?: string` props are optional and bound only when provided; `DsRail` `label?` defaults to "Navigation". Chip control stays `.ds-chip-x` (styling unchanged) but becomes a `<button>`. No new CSS classes introduced.
