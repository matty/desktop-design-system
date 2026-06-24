# Components Batch 1 (Tier 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three Vue components that wrap existing CSS — **DsButtonGroup**, **DsTooltip**, **DsPopover** — each with a Storybook story, a unit test, a docs example, and the coverage gate staying green.

**Architecture:** Each component is a thin `<script setup lang="ts">` SFC over existing `.ds-*` CSS. DsPopover adds open/dismiss behavior via the existing `useDismiss` composable and one small positioning rule for its anchor. Every component is exported from `vue/index.ts`, so `npm run reference:build` re-derives the manifest and the gate tracks it.

**Tech Stack:** Vue 3.5 (`<script setup>`, `defineModel`/`defineProps`/`defineEmits`), Vitest + `@vue/test-utils`, Storybook CSF3, the existing reference/coverage tooling.

## Global Constraints

- SFCs use `<script setup lang="ts">`; typed `defineProps<{…}>()` / `defineEmits<{…}>()`; v-model via `defineModel`/`update:*`. Match existing components (e.g. `DsDropdownMenu.vue`).
- Class grammar: `.ds-*`/`.u-*`/`.is-*`; design values via `tokens.css` custom properties, never hard-coded colors/sizes. Inline `style` only for behavioral positioning where no class fits.
- A component's emitted `.ds-*` classes (`renders`) must all be real primitives — `npm run reference:lint` and the gate's `renders` assertion enforce this.
- Every new component MUST be exported from `vue/index.ts` and have a `DsX.stories.ts` (gate `story` assertion) and a `DsX.test.ts`.
- After any component/CSS/docs change, run `npm run reference:build` and commit the regenerated `reference/manifest.json`, `REFERENCE.md`, `llms.txt`.
- Interactive components (DsPopover here) get a `<template data-vue>` snippet in their docs example AND are added to `DATA_VUE_EXPECTED` in `tools/coverage-core.mjs`. Non-interactive (DsButtonGroup, DsTooltip) do NOT.
- Storybook `title` groups in use: `Foundation` / `Form` / `Display` / `Shell` / `Interactive`.
- Gate stays warn-only. Per-task verification: `npm run typecheck` (0 errors), `npx vitest run` (green), `npm run reference:lint` (clean), `node tools/coverage.mjs` (story/example/renders/docs all `ok`).

---

### Task 1: DsButtonGroup

Pure wrapper over the existing `.ds-btn-group`.

**Files:**
- Create: `vue/components/DsButtonGroup.vue`
- Create: `vue/components/DsButtonGroup.test.ts`
- Create: `vue/components/DsButtonGroup.stories.ts`
- Modify: `vue/index.ts`
- Modify: `pages/buttons.html`
- Regenerate: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`

**Interfaces:**
- Produces: `DsButtonGroup` — props `{ ariaLabel?: string }`, default slot (buttons). Renders `.ds-btn-group` with `role="group"`.

- [ ] **Step 1: Write the failing test**

Create `vue/components/DsButtonGroup.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsButtonGroup from "./DsButtonGroup.vue";

describe("DsButtonGroup", () => {
  it("renders a role=group with slotted buttons", () => {
    const w = mount(DsButtonGroup, {
      slots: { default: () => [h("button", { class: "ds-btn" }, "A"), h("button", { class: "ds-btn" }, "B")] }
    });
    const g = w.find(".ds-btn-group");
    expect(g.exists()).toBe(true);
    expect(g.attributes("role")).toBe("group");
    expect(w.findAll(".ds-btn")).toHaveLength(2);
  });

  it("applies ariaLabel", () => {
    const w = mount(DsButtonGroup, { props: { ariaLabel: "Text style" }, slots: { default: () => "x" } });
    expect(w.find(".ds-btn-group").attributes("aria-label")).toBe("Text style");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run vue/components/DsButtonGroup.test.ts`
Expected: FAIL — cannot resolve `./DsButtonGroup.vue`.

- [ ] **Step 3: Implement the component and export it**

Create `vue/components/DsButtonGroup.vue`:

```vue
<script setup lang="ts">
defineProps<{ ariaLabel?: string }>();
</script>

<template>
  <div class="ds-btn-group" role="group" :aria-label="ariaLabel"><slot /></div>
</template>
```

In `vue/index.ts`, add (keep alphabetical-ish with the other component exports):

```ts
export { default as DsButtonGroup } from "./components/DsButtonGroup.vue";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run vue/components/DsButtonGroup.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the Storybook story**

Create `vue/components/DsButtonGroup.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsButtonGroup from "./DsButtonGroup.vue";

const meta: Meta<typeof DsButtonGroup> = {
  title: "Foundation/DsButtonGroup",
  component: DsButtonGroup,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsButtonGroup },
    setup: () => ({ args }),
    template: `<DsButtonGroup v-bind="args"><button class="ds-btn">Left</button><button class="ds-btn">Middle</button><button class="ds-btn">Right</button></DsButtonGroup>`
  })
};
export default meta;
type Story = StoryObj<typeof DsButtonGroup>;

export const Default: Story = {};
export const Labelled: Story = { args: { ariaLabel: "Alignment" } };
```

- [ ] **Step 6: Add the docs example**

In `pages/buttons.html`, add inside the relevant section (preview div's `class` must be the LAST attribute):

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-btn-group" role="group" aria-label="Alignment">
      <button class="ds-btn">Left</button>
      <button class="ds-btn">Center</button>
      <button class="ds-btn">Right</button>
    </div>
  </div>
  <div class="example-caption">Attached cluster with <code>.ds-btn-group</code>.</div>
</div>
```

- [ ] **Step 7: Regenerate reference, then verify gate + types**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && node tools/coverage.mjs`
Expected: lint clean; typecheck 0 errors; gate `story`/`example`/`renders`/`docs` all `ok` (DsButtonGroup now has a story; `ds-btn-group` now has an example; `renders` for DsButtonGroup = `ds-btn-group` which is a real primitive).

- [ ] **Step 8: Commit**

```bash
git add vue/components/DsButtonGroup.vue vue/components/DsButtonGroup.test.ts vue/components/DsButtonGroup.stories.ts vue/index.ts pages/buttons.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsButtonGroup wrapper over ds-btn-group + story/docs"
```

---

### Task 2: DsTooltip

Pure wrapper over the existing CSS-only `.ds-tip` (text via `data-tip`, hover, top placement).

**Files:**
- Create: `vue/components/DsTooltip.vue`
- Create: `vue/components/DsTooltip.test.ts`
- Create: `vue/components/DsTooltip.stories.ts`
- Modify: `vue/index.ts`
- Regenerate: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`

**Interfaces:**
- Produces: `DsTooltip` — props `{ text: string; placement?: "top" }`, default slot (trigger). Renders a `.ds-tip` span with `:data-tip="text"`.

Note: `ds-tip` already has a docs example on `pages/feedback.html` (from the example-backlog work), so `exampleCoverage` for `ds-tip` is already satisfied — no new docs example is required for this task.

- [ ] **Step 1: Write the failing test**

Create `vue/components/DsTooltip.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsTooltip from "./DsTooltip.vue";

describe("DsTooltip", () => {
  it("wraps the trigger in .ds-tip and sets data-tip", () => {
    const w = mount(DsTooltip, { props: { text: "Save changes" }, slots: { default: () => h("button", "Save") } });
    const tip = w.find(".ds-tip");
    expect(tip.exists()).toBe(true);
    expect(tip.attributes("data-tip")).toBe("Save changes");
    expect(w.find("button").text()).toBe("Save");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run vue/components/DsTooltip.test.ts`
Expected: FAIL — cannot resolve `./DsTooltip.vue`.

- [ ] **Step 3: Implement the component and export it**

Create `vue/components/DsTooltip.vue`:

```vue
<script setup lang="ts">
// placement is reserved; the ds-tip CSS currently supports top only.
defineProps<{ text: string; placement?: "top" }>();
</script>

<template>
  <span class="ds-tip" :data-tip="text"><slot /></span>
</template>
```

In `vue/index.ts`, add:

```ts
export { default as DsTooltip } from "./components/DsTooltip.vue";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run vue/components/DsTooltip.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the Storybook story**

Create `vue/components/DsTooltip.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsTooltip from "./DsTooltip.vue";

const meta: Meta<typeof DsTooltip> = {
  title: "Display/DsTooltip",
  component: DsTooltip,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsTooltip },
    setup: () => ({ args }),
    template: `<div style="padding:40px"><DsTooltip v-bind="args"><button class="ds-btn">Hover me</button></DsTooltip></div>`
  })
};
export default meta;
type Story = StoryObj<typeof DsTooltip>;

export const Default: Story = { args: { text: "Saves to the cloud" } };
```

- [ ] **Step 6: Regenerate reference, then verify gate + types**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && node tools/coverage.mjs`
Expected: lint clean; typecheck 0; gate all `ok` (DsTooltip has a story; `ds-tip` example already exists; `renders` = `ds-tip`, a real primitive).

- [ ] **Step 7: Commit**

```bash
git add vue/components/DsTooltip.vue vue/components/DsTooltip.test.ts vue/components/DsTooltip.stories.ts vue/index.ts reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsTooltip wrapper over ds-tip + story"
```

---

### Task 3: DsPopover

Trigger + dismissible floating `.ds-popover` surface. Adds one small positioning rule for the anchor. Interactive — gets a `data-vue` snippet and joins `DATA_VUE_EXPECTED`.

**Files:**
- Modify: `css/components.css` (anchor positioning)
- Create: `vue/components/DsPopover.vue`
- Create: `vue/components/DsPopover.test.ts`
- Create: `vue/components/DsPopover.stories.ts`
- Modify: `vue/index.ts`
- Modify: `tools/coverage-core.mjs` (`DATA_VUE_EXPECTED`)
- Modify: `tools/coverage.test.mjs` (update the expected-set assertion)
- Modify: `pages/feedback.html` (anchor example + `data-vue`)
- Regenerate: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`

**Interfaces:**
- Produces: `DsPopover` — `defineModel<boolean>("open")` (optional `v-model:open`), props `{ ariaLabel?: string }`, slots `trigger` + default. Renders `.ds-popover-anchor` > (`.ds-btn` trigger + `.ds-popover` content). Closes on outside-click / Escape via `useDismiss`.

- [ ] **Step 1: Add the anchor positioning CSS**

In `css/components.css`, near the existing `.ds-popover` rule (~line 423), add:

```css
.ds-popover-anchor { position:relative; display:inline-block; }
.ds-popover-anchor .ds-popover { position:absolute; top:calc(100% + 6px); left:0; z-index:50; min-width:180px; }
```

- [ ] **Step 2: Write the failing test**

Create `vue/components/DsPopover.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsPopover from "./DsPopover.vue";

describe("DsPopover", () => {
  it("is closed initially", () => {
    const w = mount(DsPopover, { slots: { trigger: () => "Open", default: () => "Body" } });
    expect(w.find(".ds-popover").exists()).toBe(false);
  });

  it("toggles open on trigger click and shows content", async () => {
    const w = mount(DsPopover, { slots: { trigger: () => "Open", default: () => h("p", "Body") } });
    await w.find("button").trigger("click");
    expect(w.find(".ds-popover").exists()).toBe(true);
    expect(w.find(".ds-popover").text()).toContain("Body");
  });

  it("applies ariaLabel to the popover", async () => {
    const w = mount(DsPopover, { props: { ariaLabel: "Details" }, slots: { trigger: () => "x", default: () => "y" } });
    await w.find("button").trigger("click");
    expect(w.find(".ds-popover").attributes("aria-label")).toBe("Details");
  });

  it("supports v-model:open (controlled)", async () => {
    const w = mount(DsPopover, { props: { open: true }, slots: { trigger: () => "x", default: () => "y" } });
    expect(w.find(".ds-popover").exists()).toBe(true);
    await w.find("button").trigger("click");
    expect(w.emitted("update:open")!.at(-1)).toEqual([false]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run vue/components/DsPopover.test.ts`
Expected: FAIL — cannot resolve `./DsPopover.vue`.

- [ ] **Step 4: Implement the component and export it**

Create `vue/components/DsPopover.vue`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useDismiss } from "../composables/useDismiss";

const open = defineModel<boolean>("open", { default: false });
defineProps<{ ariaLabel?: string }>();

const root = ref<HTMLElement | null>(null);
useDismiss({ active: open, root, onDismiss: () => (open.value = false) });

function toggle() {
  open.value = !open.value;
}
</script>

<template>
  <div ref="root" class="ds-popover-anchor" :class="{ 'is-open': open }">
    <button type="button" class="ds-btn" :aria-expanded="open" @click.stop="toggle">
      <slot name="trigger" />
    </button>
    <div v-if="open" class="ds-popover" role="dialog" :aria-label="ariaLabel">
      <slot />
    </div>
  </div>
</template>
```

The component renders only `ds-popover-anchor`, `ds-btn`, and `ds-popover` — all real primitives after Step 1. (The single trigger button is selected in tests via `w.find("button")`.)

In `vue/index.ts`, add:

```ts
export { default as DsPopover } from "./components/DsPopover.vue";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run vue/components/DsPopover.test.ts`
Expected: PASS (all four cases).

- [ ] **Step 6: Add the Storybook story**

Create `vue/components/DsPopover.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsPopover from "./DsPopover.vue";

const meta: Meta<typeof DsPopover> = {
  title: "Interactive/DsPopover",
  component: DsPopover,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsPopover },
    setup: () => ({ args }),
    template: `<div style="padding:40px"><DsPopover v-bind="args"><template #trigger>Options</template><div>Popover content here.</div></DsPopover></div>`
  })
};
export default meta;
type Story = StoryObj<typeof DsPopover>;

export const Default: Story = { args: { ariaLabel: "Options" } };
```

- [ ] **Step 7: Add the docs example with a Vue snippet**

In `pages/feedback.html`, add a focused anchor example (preview div `class` last attribute). This covers the new `ds-popover-anchor` primitive and provides the Vue tab:

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-popover-anchor is-open">
      <button class="ds-btn" aria-expanded="true">Options</button>
      <div class="ds-popover" role="dialog" aria-label="Options">Quitting saves your work automatically.</div>
    </div>
  </div>
  <template data-vue>
<DsPopover aria-label="Options">
  <template #trigger>Options</template>
  <div>Quitting saves your work automatically.</div>
</DsPopover>
  </template>
  <div class="example-caption">Trigger + floating surface with <code>.ds-popover-anchor</code> / <code>.ds-popover</code>.</div>
</div>
```

- [ ] **Step 8: Add DsPopover to the gate's interactive set**

In `tools/coverage-core.mjs`, add `"DsPopover"` to the `DATA_VUE_EXPECTED` set.

In `tools/coverage.test.mjs`, update the `DATA_VUE_EXPECTED` equality assertion to include `"DsPopover"` (keep the array sorted in the expectation).

- [ ] **Step 9: Regenerate reference, then verify everything**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && npx vitest run tools/coverage.test.mjs && node tools/coverage.mjs`
Expected: lint clean; typecheck 0; coverage tests pass; gate `story`/`example`/`renders`/`docs` all `ok` — DsPopover has a story, a `data-vue` snippet (so the now-tracked `DsPopover` in `DATA_VUE_EXPECTED` is satisfied), `ds-popover-anchor` has an example, and `renders` (`ds-popover-anchor`, `ds-btn`, `ds-popover`) are all real primitives/subParts.

- [ ] **Step 10: Commit**

```bash
git add css/components.css vue/components/DsPopover.vue vue/components/DsPopover.test.ts vue/components/DsPopover.stories.ts vue/index.ts tools/coverage-core.mjs tools/coverage.test.mjs pages/feedback.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsPopover (trigger + floating surface) + gate data-vue tracking"
```

---

### Task 4: Batch verification

**Files:** none (verification only)

- [ ] **Step 1: Full unit suite + typecheck**

Run: `npx vitest run && npm run typecheck`
Expected: all tests pass (3 new component test files included); 0 type errors.

- [ ] **Step 2: Full build + gate**

Run: `npm run build && node tools/coverage.mjs`
Expected: build exit 0; gate `story`/`example`/`renders`/`docs` all `ok`, "coverage:check passed — all layers aligned."

- [ ] **Step 3: Confirm the three components are exported and storied**

Run: `node -e "const m=require('./reference/manifest.json'); const want=['DsButtonGroup','DsTooltip','DsPopover']; const have=new Set(m.components.map(c=>c.name)); console.log(want.map(n=>n+':'+have.has(n)).join(' '))"`
Expected: `DsButtonGroup:true DsTooltip:true DsPopover:true`.

---

## Notes for the implementer

- Match `DsDropdownMenu.vue` for the popover trigger/dismiss shape; it is the closest sibling.
- Do not flip the gate to `--strict`.
- `defineModel<boolean>("open", { default: false })` gives DsPopover an optional `v-model:open` while still working uncontrolled — Batch 4's DatePicker relies on controlling it.
- If `npm run reference:lint` flags an unknown class, a component emits a `.ds-*` class with no CSS rule — add a (possibly no-op) rule or use an existing class. Never invent grammar.
- Commit the regenerated `reference/*` artifacts in the same commit as the source change, or `reference:check` in `build` fails on drift.
