# Components Batch 2 (Tier 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four net-new-CSS desktop components — **DsSteps**, **DsPagination**, **DsDrawer**, **DsMenubar** — each with CSS primitive(s), Vue component, Storybook story, unit test, docs example, and the coverage gate staying green.

**Architecture:** Each adds a focused primitive to `css/components.css` (tokens only) and a `<script setup>` SFC. DsDrawer mirrors `DsDialog.vue` (overlay + focus trap + dismiss). DsMenubar mirrors `DsDropdownMenu.vue` but coordinates multiple top-level menus with cross-menu keyboard nav. DsPagination and DsSteps are computed-render components.

**Tech Stack:** Vue 3.5 (`<script setup>`, `defineModel`/`defineProps`/`defineEmits`/`withDefaults`), Vitest + `@vue/test-utils`, Storybook CSF3, the reference/coverage tooling.

## Global Constraints

- SFCs `<script setup lang="ts">`; typed props/emits; v-model via `defineModel`/`update:*`. Mirror `DsDialog.vue` (drawer) and `DsDropdownMenu.vue` (menubar).
- CSS uses `tokens.css` custom properties only (e.g. `--space-*`, `--radius*`, `--border*`, `--surface*`, `--fill*`, `--accent*`, `--text*`, `--fz-*`, `--fw-*`, `--hover`, `--overlay-bg`, `--shadow-dialog`, `--rail`). No hard-coded colors. Structural literals (px sizes, z-index) are fine.
- A component's emitted `.ds-*` classes (`renders`) must all be real primitives — `reference:lint` + the gate's `renders` assertion enforce this, so every new class needs a CSS rule.
- Each component: exported from `vue/index.ts`, has `DsX.stories.ts` and `DsX.test.ts`.
- After each task: `npm run reference:build` (commit regenerated `reference/manifest.json`, `REFERENCE.md`, `llms.txt`), `npm run reference:lint` (clean), `npm run typecheck` (0), `node tools/coverage.mjs` (story/example/renders/docs all `ok`).
- Interactive components (DsPagination, DsDrawer, DsMenubar) get a `<template data-vue>` snippet in their docs example AND join `DATA_VUE_EXPECTED` in `tools/coverage-core.mjs` (update the equality test in `tools/coverage.test.mjs`). DsSteps is non-interactive (no snippet).
- Storybook `title` groups: `Foundation` / `Form` / `Display` / `Shell` / `Interactive`.
- Gate stays warn-only. New shared types go in `vue/types.ts`.

---

### Task 1: DsSteps

Horizontal step indicator (display-only). New primitive `ds-steps` (distinct from the `ds-number > .ds-step` sub-part).

**Files:**
- Modify: `css/components.css`, `vue/types.ts`, `vue/index.ts`, `pages/navigation.html`
- Create: `vue/components/DsSteps.vue`, `DsSteps.test.ts`, `DsSteps.stories.ts`
- Regenerate: `reference/*`

**Interfaces:**
- Produces: type `Step { id: string; label: string }`; `DsSteps` props `{ steps: Step[]; current: string | number }`. `current` is the active step id or zero-based index. Renders `.ds-steps` > `.ds-step-item`(`.is-active`/`.is-complete`) > `.ds-step-num`.

- [ ] **Step 1: Add the CSS primitive**

In `css/components.css`, add:

```css
.ds-steps { display:flex; align-items:center; gap:var(--space-3); list-style:none; margin:0; padding:0; }
.ds-step-item { display:flex; align-items:center; gap:var(--space-3); color:var(--text-3); font-size:var(--fz-sm); }
.ds-step-num { width:22px; height:22px; flex:none; border:1px solid var(--border-strong); border-radius:var(--radius-pill); display:grid; place-items:center; font-size:var(--fz-xs); }
.ds-step-item.is-active { color:var(--text); }
.ds-step-item.is-active .ds-step-num { border-color:var(--accent); color:var(--accent); }
.ds-step-item.is-complete .ds-step-num { background:var(--accent); border-color:var(--accent); color:var(--accent-ink); }
.ds-step-item + .ds-step-item::before { content:""; width:24px; height:1px; background:var(--border); }
```

- [ ] **Step 2: Add the type**

In `vue/types.ts`, add:

```ts
export interface Step { id: string; label: string }
```

- [ ] **Step 3: Write the failing test**

Create `vue/components/DsSteps.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSteps from "./DsSteps.vue";

const steps = [
  { id: "a", label: "Account" },
  { id: "b", label: "Profile" },
  { id: "c", label: "Done" }
];

describe("DsSteps", () => {
  it("renders all steps with numbers and labels", () => {
    const w = mount(DsSteps, { props: { steps, current: 1 } });
    expect(w.findAll(".ds-step-item")).toHaveLength(3);
    expect(w.findAll(".ds-step-num").map((n) => n.text())).toEqual(["1", "2", "3"]);
    expect(w.text()).toContain("Profile");
  });

  it("marks complete/active by numeric current", () => {
    const w = mount(DsSteps, { props: { steps, current: 1 } });
    const items = w.findAll(".ds-step-item");
    expect(items[0].classes()).toContain("is-complete");
    expect(items[1].classes()).toContain("is-active");
    expect(items[2].classes()).not.toContain("is-active");
  });

  it("accepts a step id as current", () => {
    const w = mount(DsSteps, { props: { steps, current: "c" } });
    const items = w.findAll(".ds-step-item");
    expect(items[2].classes()).toContain("is-active");
    expect(items[0].classes()).toContain("is-complete");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run vue/components/DsSteps.test.ts`
Expected: FAIL — cannot resolve `./DsSteps.vue`.

- [ ] **Step 5: Implement and export**

Create `vue/components/DsSteps.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { Step } from "../types";

const props = defineProps<{ steps: Step[]; current: string | number }>();

const activeIndex = computed(() =>
  typeof props.current === "number"
    ? props.current
    : props.steps.findIndex((s) => s.id === props.current)
);

function stepClass(i: number) {
  if (i < activeIndex.value) return "is-complete";
  if (i === activeIndex.value) return "is-active";
  return "";
}
</script>

<template>
  <ol class="ds-steps">
    <li v-for="(step, i) in steps" :key="step.id" class="ds-step-item" :class="stepClass(i)">
      <span class="ds-step-num">{{ i + 1 }}</span>{{ step.label }}
    </li>
  </ol>
</template>
```

In `vue/index.ts`, add `export { default as DsSteps } from "./components/DsSteps.vue";`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run vue/components/DsSteps.test.ts`
Expected: PASS.

- [ ] **Step 7: Add the story**

Create `vue/components/DsSteps.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsSteps from "./DsSteps.vue";

const steps = [
  { id: "a", label: "Account" },
  { id: "b", label: "Profile" },
  { id: "c", label: "Done" }
];

const meta: Meta<typeof DsSteps> = {
  title: "Display/DsSteps",
  component: DsSteps,
  tags: ["autodocs"],
  args: { steps, current: 1 },
  render: (args) => ({ components: { DsSteps }, setup: () => ({ args }), template: `<DsSteps v-bind="args" />` })
};
export default meta;
type Story = StoryObj<typeof DsSteps>;

export const Default: Story = {};
export const FirstStep: Story = { args: { current: 0 } };
export const Complete: Story = { args: { current: 2 } };
```

- [ ] **Step 8: Add the docs example**

In `pages/navigation.html`, add (preview div `class` last attribute):

```html
<div class="example">
  <div class="example-preview">
    <ol class="ds-steps">
      <li class="ds-step-item is-complete"><span class="ds-step-num">1</span>Account</li>
      <li class="ds-step-item is-active"><span class="ds-step-num">2</span>Profile</li>
      <li class="ds-step-item"><span class="ds-step-num">3</span>Done</li>
    </ol>
  </div>
  <div class="example-caption">Step indicator with <code>.ds-steps</code>.</div>
</div>
```

- [ ] **Step 9: Regenerate + verify**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && node tools/coverage.mjs`
Expected: lint clean; typecheck 0; gate all `ok`.

- [ ] **Step 10: Commit**

```bash
git add css/components.css vue/types.ts vue/components/DsSteps.vue vue/components/DsSteps.test.ts vue/components/DsSteps.stories.ts vue/index.ts pages/navigation.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsSteps step indicator + ds-steps primitive"
```

---

### Task 2: DsPagination

Page navigation (interactive). New primitive `ds-pagination`.

**Files:**
- Modify: `css/components.css`, `vue/index.ts`, `pages/data-display.html`, `tools/coverage-core.mjs`, `tools/coverage.test.mjs`
- Create: `vue/components/DsPagination.vue`, `DsPagination.test.ts`, `DsPagination.stories.ts`
- Regenerate: `reference/*`

**Interfaces:**
- Produces: `DsPagination` — props `{ total: number; pageSize: number; siblingCount?: number }` (default `siblingCount: 1`), `defineModel<number>("page")` (`v-model:page`, default 1). Emits `update:page`. Renders `.ds-pagination` > `.ds-page`(`.is-active`) + `.ds-pagination-ellipsis`.

- [ ] **Step 1: Add the CSS primitive**

```css
.ds-pagination { display:flex; align-items:center; gap:var(--space-1); }
.ds-page { min-width:28px; height:28px; padding:0 var(--space-2); display:inline-grid; place-items:center; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--fill); color:var(--text-2); font-size:var(--fz-sm); cursor:default; }
.ds-page:hover:not(:disabled) { background:var(--fill-hover); color:var(--text); }
.ds-page.is-active { background:var(--accent); border-color:var(--accent); color:var(--accent-ink); }
.ds-page:disabled { opacity:.4; }
.ds-pagination-ellipsis { padding:0 var(--space-2); color:var(--text-3); }
```

- [ ] **Step 2: Write the failing test**

Create `vue/components/DsPagination.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsPagination from "./DsPagination.vue";

describe("DsPagination", () => {
  it("renders prev, pages, next and marks the active page", () => {
    const w = mount(DsPagination, { props: { total: 50, pageSize: 10, page: 2 } });
    const active = w.find(".ds-page.is-active");
    expect(active.text()).toBe("2");
    expect(active.attributes("aria-current")).toBe("page");
  });

  it("emits update:page on a page click", async () => {
    const w = mount(DsPagination, { props: { total: 50, pageSize: 10, page: 1 } });
    const pages = w.findAll(".ds-page").filter((b) => b.text() === "3");
    await pages[0].trigger("click");
    expect(w.emitted("update:page")!.at(-1)).toEqual([3]);
  });

  it("disables prev on first and next on last page", () => {
    const first = mount(DsPagination, { props: { total: 30, pageSize: 10, page: 1 } });
    expect(first.findAll(".ds-page")[0].attributes("disabled")).toBeDefined();
    const last = mount(DsPagination, { props: { total: 30, pageSize: 10, page: 3 } });
    const btns = last.findAll(".ds-page");
    expect(btns[btns.length - 1].attributes("disabled")).toBeDefined();
  });

  it("inserts an ellipsis for large page counts", () => {
    const w = mount(DsPagination, { props: { total: 200, pageSize: 10, page: 10 } });
    expect(w.find(".ds-pagination-ellipsis").exists()).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run vue/components/DsPagination.test.ts`
Expected: FAIL — cannot resolve `./DsPagination.vue`.

- [ ] **Step 4: Implement and export**

Create `vue/components/DsPagination.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ total: number; pageSize: number; siblingCount?: number }>(),
  { siblingCount: 1 }
);
const page = defineModel<number>("page", { default: 1 });

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

const items = computed<(number | "…")[]>(() => {
  const last = pageCount.value;
  const cur = page.value;
  const sib = props.siblingCount;
  const out: (number | "…")[] = [1];
  const start = Math.max(2, cur - sib);
  const end = Math.min(last - 1, cur + sib);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < last - 1) out.push("…");
  if (last > 1) out.push(last);
  return out;
});

function go(p: number) {
  if (p >= 1 && p <= pageCount.value && p !== page.value) page.value = p;
}
</script>

<template>
  <nav class="ds-pagination" aria-label="Pagination">
    <button type="button" class="ds-page" :disabled="page <= 1" aria-label="Previous page" @click="go(page - 1)">‹</button>
    <template v-for="(it, i) in items" :key="i">
      <span v-if="it === '…'" class="ds-pagination-ellipsis">…</span>
      <button
        v-else
        type="button"
        class="ds-page"
        :class="{ 'is-active': it === page }"
        :aria-current="it === page ? 'page' : undefined"
        @click="go(it as number)"
      >{{ it }}</button>
    </template>
    <button type="button" class="ds-page" :disabled="page >= pageCount" aria-label="Next page" @click="go(page + 1)">›</button>
  </nav>
</template>
```

In `vue/index.ts`, add `export { default as DsPagination } from "./components/DsPagination.vue";`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run vue/components/DsPagination.test.ts`
Expected: PASS (all four).

- [ ] **Step 6: Add the story**

Create `vue/components/DsPagination.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsPagination from "./DsPagination.vue";

const meta: Meta<typeof DsPagination> = {
  title: "Interactive/DsPagination",
  component: DsPagination,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsPagination },
    setup: () => { const page = ref(args.page ?? 1); return { args, page }; },
    template: `<DsPagination v-bind="args" v-model:page="page" />`
  })
};
export default meta;
type Story = StoryObj<typeof DsPagination>;

export const Default: Story = { args: { total: 50, pageSize: 10, page: 1 } };
export const Many: Story = { args: { total: 200, pageSize: 10, page: 10 } };
```

- [ ] **Step 7: Add the docs example + Vue snippet**

In `pages/data-display.html`, add:

```html
<div class="example">
  <div class="example-preview">
    <nav class="ds-pagination" aria-label="Pagination">
      <button class="ds-page" aria-label="Previous page">‹</button>
      <button class="ds-page">1</button>
      <button class="ds-page is-active" aria-current="page">2</button>
      <button class="ds-page">3</button>
      <span class="ds-pagination-ellipsis">…</span>
      <button class="ds-page">9</button>
      <button class="ds-page" aria-label="Next page">›</button>
    </nav>
  </div>
  <template data-vue>
<DsPagination :total="90" :page-size="10" v-model:page="page" />
  </template>
  <div class="example-caption">Page navigation with <code>.ds-pagination</code>.</div>
</div>
```

- [ ] **Step 8: Add to the gate's interactive set**

In `tools/coverage-core.mjs`, add `"DsPagination"` to `DATA_VUE_EXPECTED`. In `tools/coverage.test.mjs`, update the `DATA_VUE_EXPECTED` equality assertion (sorted) to include it.

- [ ] **Step 9: Regenerate + verify**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && npx vitest run tools/coverage.test.mjs && node tools/coverage.mjs`
Expected: lint clean; typecheck 0; coverage tests pass; gate all `ok`.

- [ ] **Step 10: Commit**

```bash
git add css/components.css vue/components/DsPagination.vue vue/components/DsPagination.test.ts vue/components/DsPagination.stories.ts vue/index.ts tools/coverage-core.mjs tools/coverage.test.mjs pages/data-display.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsPagination + ds-pagination primitive + gate tracking"
```

---

### Task 3: DsDrawer

Slide-in modal side panel (interactive). Mirrors `DsDialog.vue`. New primitive `ds-drawer`.

**Files:**
- Modify: `css/components.css`, `vue/index.ts`, `pages/feedback.html`, `tools/coverage-core.mjs`, `tools/coverage.test.mjs`
- Create: `vue/components/DsDrawer.vue`, `DsDrawer.test.ts`, `DsDrawer.stories.ts`
- Regenerate: `reference/*`

**Interfaces:**
- Produces: `DsDrawer` — props `{ open: boolean; side?: "right" | "left"; title?: string }` (default `side: "right"`), emit `update:open`, slots default + `footer`. Renders (teleported) `.ds-overlay` > `.ds-drawer`(`.is-right`/`.is-left`) > `.ds-drawer-head`/`-body`/`-foot`.

- [ ] **Step 1: Add the CSS primitive**

```css
.ds-drawer { position:fixed; top:0; bottom:0; width:min(380px,90vw); display:flex; flex-direction:column; background:var(--surface); box-shadow:var(--shadow-dialog); z-index:101; }
.ds-drawer.is-right { right:0; border-left:1px solid var(--border); }
.ds-drawer.is-left { left:0; border-right:1px solid var(--border); }
.ds-drawer-head { padding:16px 18px; border-bottom:1px solid var(--border-soft); font-size:var(--fz-md); font-weight:var(--fw-semibold); }
.ds-drawer-body { flex:1; overflow:auto; padding:16px 18px; color:var(--text-2); font-size:var(--fz-sm); }
.ds-drawer-foot { display:flex; justify-content:flex-end; gap:8px; padding:13px 18px; border-top:1px solid var(--border-soft); background:var(--rail); }
```

- [ ] **Step 2: Write the failing test**

Create `vue/components/DsDrawer.test.ts` (mirrors DsDialog test style; uses `attachTo` so Teleport renders into the document):

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsDrawer from "./DsDrawer.vue";

describe("DsDrawer", () => {
  it("renders nothing when closed", () => {
    const w = mount(DsDrawer, { props: { open: false }, attachTo: document.body });
    expect(document.querySelector(".ds-drawer")).toBeNull();
    w.unmount();
  });

  it("renders the panel, title and slots when open", () => {
    const w = mount(DsDrawer, {
      props: { open: true, title: "Filters" },
      slots: { default: () => "Body content", footer: () => "Foot" },
      attachTo: document.body
    });
    const panel = document.querySelector(".ds-drawer");
    expect(panel).not.toBeNull();
    expect(panel!.classList.contains("is-right")).toBe(true);
    expect(document.querySelector(".ds-drawer-head")!.textContent).toContain("Filters");
    expect(document.querySelector(".ds-drawer-body")!.textContent).toContain("Body content");
    expect(document.querySelector(".ds-drawer-foot")!.textContent).toContain("Foot");
    w.unmount();
  });

  it("honors side=left", () => {
    const w = mount(DsDrawer, { props: { open: true, side: "left" }, attachTo: document.body });
    expect(document.querySelector(".ds-drawer")!.classList.contains("is-left")).toBe(true);
    w.unmount();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run vue/components/DsDrawer.test.ts`
Expected: FAIL — cannot resolve `./DsDrawer.vue`.

- [ ] **Step 4: Implement and export**

Create `vue/components/DsDrawer.vue`:

```vue
<script setup lang="ts">
import { ref, watch, onBeforeUnmount, useId } from "vue";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useDismiss } from "../composables/useDismiss";

const props = withDefaults(
  defineProps<{ open: boolean; side?: "right" | "left"; title?: string }>(),
  { side: "right" }
);
const emit = defineEmits<{ "update:open": [boolean] }>();

const titleId = useId();
const drawer = ref<HTMLElement | null>(null);
const openRef = ref(props.open);
watch(() => props.open, (v) => (openRef.value = v));

function close() {
  emit("update:open", false);
}

useFocusTrap(drawer, openRef);
useDismiss({ active: openRef, root: drawer, onDismiss: close });

watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? "hidden" : "";
  },
  { immediate: true }
);
onBeforeUnmount(() => {
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ds-overlay">
      <div
        ref="drawer"
        class="ds-drawer"
        :class="`is-${side}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
      >
        <div v-if="title" :id="titleId" class="ds-drawer-head">{{ title }}</div>
        <div class="ds-drawer-body"><slot /></div>
        <div v-if="$slots.footer" class="ds-drawer-foot"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>
```

In `vue/index.ts`, add `export { default as DsDrawer } from "./components/DsDrawer.vue";`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run vue/components/DsDrawer.test.ts`
Expected: PASS.

- [ ] **Step 6: Add the story**

Create `vue/components/DsDrawer.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsDrawer from "./DsDrawer.vue";

const meta: Meta<typeof DsDrawer> = {
  title: "Shell/DsDrawer",
  component: DsDrawer,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsDrawer },
    setup: () => { const open = ref(false); return { args, open }; },
    template: `<button class="ds-btn" @click="open = true">Open drawer</button>
      <DsDrawer v-bind="args" :open="open" @update:open="open = $event" title="Filters">
        <p>Drawer body content.</p>
        <template #footer><button class="ds-btn" @click="open = false">Close</button></template>
      </DsDrawer>`
  })
};
export default meta;
type Story = StoryObj<typeof DsDrawer>;

export const Right: Story = { args: { side: "right" } };
export const Left: Story = { args: { side: "left" } };
```

- [ ] **Step 7: Add the docs example + Vue snippet**

In `pages/feedback.html`, add a static example (the drawer rendered inline for the preview — neutralize fixed positioning with inline `style` on the `.ds-drawer` child, NOT on `.example-preview`):

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-drawer is-right" role="dialog" aria-modal="true" style="position:static; width:320px; box-shadow:none; border:1px solid var(--border);">
      <div class="ds-drawer-head">Filters</div>
      <div class="ds-drawer-body">Status, owner and date range controls.</div>
      <div class="ds-drawer-foot"><button class="ds-btn">Reset</button><button class="ds-btn is-primary">Apply</button></div>
    </div>
  </div>
  <template data-vue>
<DsDrawer v-model:open="open" title="Filters">
  Status, owner and date range controls.
  <template #footer><button class="ds-btn is-primary">Apply</button></template>
</DsDrawer>
  </template>
  <div class="example-caption">Slide-in side panel with <code>.ds-drawer</code>.</div>
</div>
```

- [ ] **Step 8: Add to the gate's interactive set**

In `tools/coverage-core.mjs`, add `"DsDrawer"` to `DATA_VUE_EXPECTED`. Update the `coverage.test.mjs` equality assertion (sorted).

- [ ] **Step 9: Regenerate + verify**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && npx vitest run tools/coverage.test.mjs && node tools/coverage.mjs`
Expected: lint clean; typecheck 0; coverage tests pass; gate all `ok`.

- [ ] **Step 10: Commit**

```bash
git add css/components.css vue/components/DsDrawer.vue vue/components/DsDrawer.test.ts vue/components/DsDrawer.stories.ts vue/index.ts tools/coverage-core.mjs tools/coverage.test.mjs pages/feedback.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsDrawer slide-in panel + ds-drawer primitive + gate tracking"
```

---

### Task 4: DsMenubar

Top application menu bar with cross-menu keyboard nav (interactive). New primitive `ds-menubar`; dropdowns reuse `.ds-menu`.

**Files:**
- Modify: `css/components.css`, `vue/types.ts`, `vue/index.ts`, `pages/navigation.html`, `tools/coverage-core.mjs`, `tools/coverage.test.mjs`
- Create: `vue/components/DsMenubar.vue`, `DsMenubar.test.ts`, `DsMenubar.stories.ts`
- Regenerate: `reference/*`

**Interfaces:**
- Produces: type `MenubarMenu { id: string; label: string; items: MenuItem[] }`; `DsMenubar` props `{ menus: MenubarMenu[]; ariaLabel?: string }`, emit `select: [string]`. Renders `.ds-menubar`[role=menubar] > `.ds-menubar-item`(`.is-open`) each containing a reused `.ds-menu` when open.

- [ ] **Step 1: Add the CSS primitive**

```css
.ds-menubar { display:flex; align-items:center; gap:2px; }
.ds-menubar-item { position:relative; padding:5px 9px; border-radius:var(--radius-sm); font-size:var(--fz-base); color:var(--text-2); cursor:default; }
.ds-menubar-item:hover, .ds-menubar-item.is-open { background:var(--hover); color:var(--text); }
.ds-menubar-item > .ds-menu { top:calc(100% + 4px); left:0; }
```

- [ ] **Step 2: Add the type**

In `vue/types.ts`, add (after `MenuItem`):

```ts
export interface MenubarMenu { id: string; label: string; items: MenuItem[] }
```

- [ ] **Step 3: Write the failing test**

Create `vue/components/DsMenubar.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsMenubar from "./DsMenubar.vue";

const menus = [
  { id: "file", label: "File", items: [ { id: "new", label: "New" }, { id: "open", label: "Open" } ] },
  { id: "edit", label: "Edit", items: [ { id: "undo", label: "Undo" }, { id: "sep", separator: true }, { id: "cut", label: "Cut" } ] }
];

describe("DsMenubar", () => {
  it("renders top-level items as a menubar", () => {
    const w = mount(DsMenubar, { props: { menus } });
    expect(w.find("[role=menubar]").exists()).toBe(true);
    expect(w.findAll(".ds-menubar-item")).toHaveLength(2);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("opens a menu on click and renders its items", async () => {
    const w = mount(DsMenubar, { props: { menus } });
    await w.findAll(".ds-menubar-item")[0].trigger("click");
    expect(w.find(".ds-menu").exists()).toBe(true);
    expect(w.findAll(".ds-menu-item")).toHaveLength(2);
  });

  it("clicking a leaf item emits select and closes", async () => {
    const w = mount(DsMenubar, { props: { menus } });
    await w.findAll(".ds-menubar-item")[0].trigger("click");
    await w.findAll(".ds-menu-item")[1].trigger("click");
    expect(w.emitted("select")!.at(-1)).toEqual(["open"]);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("only one menu is open at a time", async () => {
    const w = mount(DsMenubar, { props: { menus } });
    await w.findAll(".ds-menubar-item")[0].trigger("click");
    await w.findAll(".ds-menubar-item")[1].trigger("click");
    expect(w.findAll(".ds-menu")).toHaveLength(1);
    expect(w.findAll(".ds-menu-item").map((i) => i.text())).toEqual(["Undo", "Cut"]);
  });

  it("Escape closes the open menu", async () => {
    const w = mount(DsMenubar, { props: { menus } });
    await w.findAll(".ds-menubar-item")[0].trigger("click");
    await w.find("[role=menubar]").trigger("keydown", { key: "Escape" });
    expect(w.find(".ds-menu").exists()).toBe(false);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run vue/components/DsMenubar.test.ts`
Expected: FAIL — cannot resolve `./DsMenubar.vue`.

- [ ] **Step 5: Implement and export**

Create `vue/components/DsMenubar.vue`. The keyboard handler below is a working starting point; **the tests in Step 3 plus the WAI-ARIA menubar pattern are the contract — adjust the handler if a test fails or a keyboard interaction misbehaves**:

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import type { MenubarMenu, MenuItem } from "../types";
import { useDismiss } from "../composables/useDismiss";

const props = defineProps<{ menus: MenubarMenu[]; ariaLabel?: string }>();
const emit = defineEmits<{ select: [string] }>();

const root = ref<HTMLElement | null>(null);
const openId = ref<string | null>(null);
const active = computed(() => openId.value !== null);

useDismiss({ active, root, onDismiss: () => (openId.value = null) });

function toggle(id: string) {
  openId.value = openId.value === id ? null : id;
}
function choose(item: MenuItem) {
  if (item.disabled || item.separator) return;
  item.onSelect?.();
  emit("select", item.id);
  openId.value = null;
}

function topItems(): HTMLElement[] {
  return Array.from(root.value?.querySelectorAll<HTMLElement>(".ds-menubar-item") ?? []);
}
function openMenuItems(): HTMLElement[] {
  return Array.from(root.value?.querySelectorAll<HTMLElement>(".ds-menubar-item.is-open .ds-menu-item") ?? []);
}

function onKey(e: KeyboardEvent) {
  const tops = topItems();
  const topIndex = tops.findIndex((el) => el.contains(document.activeElement) || el === document.activeElement);

  if (e.key === "Escape") {
    openId.value = null;
    tops[topIndex >= 0 ? topIndex : 0]?.focus();
    return;
  }
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    if (topIndex < 0) return;
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (topIndex + dir + tops.length) % tops.length;
    tops[next].focus();
    if (openId.value) openId.value = props.menus[next].id;
    return;
  }
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    const mItems = openMenuItems();
    if (!mItems.length) {
      if (e.key === "ArrowDown" && topIndex >= 0) {
        e.preventDefault();
        openId.value = props.menus[topIndex].id;
      }
      return;
    }
    e.preventDefault();
    const cur = mItems.findIndex((el) => el === document.activeElement);
    const dir = e.key === "ArrowDown" ? 1 : -1;
    const next = (cur + dir + mItems.length) % mItems.length;
    mItems[next].focus();
  }
}
</script>

<template>
  <div ref="root" class="ds-menubar" role="menubar" :aria-label="ariaLabel" @keydown="onKey">
    <div
      v-for="menu in menus"
      :key="menu.id"
      class="ds-menubar-item"
      :class="{ 'is-open': openId === menu.id }"
      role="menuitem"
      tabindex="0"
      aria-haspopup="true"
      :aria-expanded="openId === menu.id"
      @click="toggle(menu.id)"
    >
      {{ menu.label }}
      <div v-if="openId === menu.id" class="ds-menu" role="menu" :aria-label="menu.label" @click.stop>
        <template v-for="item in menu.items" :key="item.id">
          <div v-if="item.separator" class="ds-menu-sep"></div>
          <div
            v-else
            class="ds-menu-item"
            :class="{ 'is-danger': item.danger }"
            role="menuitem"
            tabindex="-1"
            :aria-disabled="item.disabled || undefined"
            @click="choose(item)"
          >
            {{ item.label }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
```

In `vue/index.ts`, add `export { default as DsMenubar } from "./components/DsMenubar.vue";`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run vue/components/DsMenubar.test.ts`
Expected: PASS (all five). If a keyboard test fails, fix the handler — do not weaken the test.

- [ ] **Step 7: Add the story**

Create `vue/components/DsMenubar.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsMenubar from "./DsMenubar.vue";

const menus = [
  { id: "file", label: "File", items: [ { id: "new", label: "New" }, { id: "open", label: "Open…" }, { id: "s1", separator: true }, { id: "quit", label: "Quit" } ] },
  { id: "edit", label: "Edit", items: [ { id: "undo", label: "Undo" }, { id: "redo", label: "Redo" } ] },
  { id: "view", label: "View", items: [ { id: "zoom", label: "Zoom In" }, { id: "full", label: "Full Screen" } ] }
];

const meta: Meta<typeof DsMenubar> = {
  title: "Shell/DsMenubar",
  component: DsMenubar,
  tags: ["autodocs"],
  args: { menus, ariaLabel: "Main" },
  render: (args) => ({ components: { DsMenubar }, setup: () => ({ args }), template: `<DsMenubar v-bind="args" />` })
};
export default meta;
type Story = StoryObj<typeof DsMenubar>;

export const Default: Story = {};
```

- [ ] **Step 8: Add the docs example + Vue snippet**

In `pages/navigation.html`, add (the open menu shown statically; `.ds-menu` inside `.ds-menubar-item` for the preview):

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-menubar" role="menubar" aria-label="Main">
      <div class="ds-menubar-item is-open" role="menuitem" tabindex="0" aria-haspopup="true" aria-expanded="true">File
        <div class="ds-menu" role="menu" aria-label="File">
          <div class="ds-menu-item" role="menuitem">New</div>
          <div class="ds-menu-item" role="menuitem">Open…</div>
          <div class="ds-menu-sep"></div>
          <div class="ds-menu-item" role="menuitem">Quit</div>
        </div>
      </div>
      <div class="ds-menubar-item" role="menuitem" tabindex="0">Edit</div>
      <div class="ds-menubar-item" role="menuitem" tabindex="0">View</div>
    </div>
  </div>
  <template data-vue>
<DsMenubar :menus="menus" aria-label="Main" @select="onSelect" />
  </template>
  <div class="example-caption">Application menu bar with <code>.ds-menubar</code> (dropdowns reuse <code>.ds-menu</code>).</div>
</div>
```

- [ ] **Step 9: Add to the gate's interactive set**

In `tools/coverage-core.mjs`, add `"DsMenubar"` to `DATA_VUE_EXPECTED`. Update the `coverage.test.mjs` equality assertion (sorted).

- [ ] **Step 10: Regenerate + verify**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && npx vitest run tools/coverage.test.mjs && node tools/coverage.mjs`
Expected: lint clean; typecheck 0; coverage tests pass; gate all `ok`.

- [ ] **Step 11: Commit**

```bash
git add css/components.css vue/types.ts vue/components/DsMenubar.vue vue/components/DsMenubar.test.ts vue/components/DsMenubar.stories.ts vue/index.ts tools/coverage-core.mjs tools/coverage.test.mjs pages/navigation.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsMenubar app menu bar + ds-menubar primitive + gate tracking"
```

---

### Task 5: Batch verification

**Files:** none.

- [ ] **Step 1:** Run `npx vitest run && npm run typecheck` — all green, 0 type errors.
- [ ] **Step 2:** Run `npm run build && node tools/coverage.mjs` — build exit 0; gate `story`/`example`/`renders`/`docs` all `ok`.
- [ ] **Step 3:** Run `node -e "const m=require('./reference/manifest.json'); const want=['DsSteps','DsPagination','DsDrawer','DsMenubar']; const have=new Set(m.components.map(c=>c.name)); console.log(want.map(n=>n+':'+have.has(n)).join(' '))"` — all `true`.

---

## Notes for the implementer

- DsDrawer mirrors `DsDialog.vue`; DsMenubar mirrors `DsDropdownMenu.vue` (extended to multiple menus). Read those before implementing.
- For DsMenubar, the Step 3 tests are the contract for behavior; the provided keyboard handler is a starting point — adjust it to pass the tests and behave per the WAI-ARIA menubar pattern, never weaken a test.
- Verify every token referenced in new CSS exists in `css/tokens.css` (`--hover`, `--rail`, `--shadow-dialog`, `--overlay-bg`, etc.); if a name differs, use the real one.
- Commit regenerated `reference/*` artifacts with each task's source change.
- Gate stays warn-only; do not add `--strict`.
