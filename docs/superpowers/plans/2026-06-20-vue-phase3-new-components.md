# Vue Components — Phase 3: Net-New Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the five components whose markup is presentational-only today (no behavior exists), giving them reactive behavior for the first time: DsDropdownMenu, DsTabs/DsTabPanel, DsAccordion/DsAccordionItem, DsDialog, DsToastHost.

**Architecture:** Each SFC renders existing `.ds-*` markup and toggles `.is-*` state classes, driven by `v-model` and the Phase-1 composables. No `<style>` blocks. `js/ds.js` untouched.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest + @vue/test-utils + happy-dom.

## Global Constraints

- Depends on Phase 1 (composables/types/tooling) and Phase 2 (component conventions) being complete and green.
- Vue 3 SFCs, `<script setup lang="ts">`, no `<style>` blocks; visuals from existing `.ds-*` / `.is-*` classes only.
- Behavior strategy = Approach A; do NOT modify `js/ds.js`.
- All new code under `vue/components/`; append exports to `vue/index.ts`.
- `npm test`, `npm run typecheck`, and `npm run build` must stay green.
- Two-space indentation; ESM.

---

### Task 1: DsDropdownMenu

**Files:**
- Create: `vue/components/DsDropdownMenu.vue`
- Test: `vue/components/DsDropdownMenu.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `MenuItem` (types), `useDismiss`, `useRovingTabindex` (Phase 1).
- Produces: `<DsDropdownMenu :items><template #trigger>…</template></DsDropdownMenu>`. Toggling the trigger opens a `.ds-menu`; selecting a leaf emits `select` (id) + runs `item.onSelect` and closes; Esc / outside-click closes.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsDropdownMenu from "./DsDropdownMenu.vue";

const items = [
  { id: "refresh", label: "Refresh" },
  { id: "open", label: "Open folder" },
  { id: "sep", separator: true },
  { id: "del", label: "Delete", danger: true }
];

describe("DsDropdownMenu", () => {
  it("is closed initially", () => {
    const w = mount(DsDropdownMenu, {
      props: { items },
      slots: { trigger: () => h("span", "Menu") }
    });
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("opens on trigger click and renders items + separator", async () => {
    const w = mount(DsDropdownMenu, {
      props: { items },
      slots: { trigger: () => h("span", "Menu") }
    });
    await w.find(".ds-dropdown-btn").trigger("click");
    expect(w.find(".ds-menu").exists()).toBe(true);
    expect(w.findAll(".ds-menu-item")).toHaveLength(3);
    expect(w.find(".ds-menu-sep").exists()).toBe(true);
  });

  it("selecting a leaf emits select and closes", async () => {
    const w = mount(DsDropdownMenu, {
      props: { items },
      slots: { trigger: () => h("span", "Menu") }
    });
    await w.find(".ds-dropdown-btn").trigger("click");
    await w.findAll(".ds-menu-item")[0].trigger("click");
    expect(w.emitted("select")![0]).toEqual(["refresh"]);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsDropdownMenu`
Expected: FAIL — cannot find `./DsDropdownMenu.vue`.

- [ ] **Step 3: Implement `vue/components/DsDropdownMenu.vue`**

```vue
<script setup lang="ts">
import { ref } from "vue";
import type { MenuItem } from "../types";
import { useDismiss } from "../composables/useDismiss";
import { useRovingTabindex } from "../composables/useRovingTabindex";

const props = defineProps<{ items: MenuItem[] }>();
const emit = defineEmits<{ select: [string] }>();

const root = ref<HTMLElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const open = ref(false);

useDismiss({ active: open, root, onDismiss: () => (open.value = false) });
useRovingTabindex(menu, open, {
  selector: ".ds-menu-item",
  onActivate: (el) => el.click()
});

function toggle() {
  open.value = !open.value;
}
function choose(item: MenuItem) {
  if (item.disabled || item.separator) return;
  item.onSelect?.();
  emit("select", item.id);
  open.value = false;
}
</script>

<template>
  <div ref="root" class="ds-dropdown" :class="{ 'is-open': open }">
    <button type="button" class="ds-dropdown-btn" :aria-expanded="open" @click.stop="toggle">
      <slot name="trigger" />
    </button>
    <div v-if="open" ref="menu" class="ds-menu" role="menu">
      <template v-for="item in items" :key="item.id">
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
</template>
```

- [ ] **Step 4: Append the export to `vue/index.ts`**

```ts
export { default as DsDropdownMenu } from "./components/DsDropdownMenu.vue";
```

- [ ] **Step 5: Run test + typecheck**

Run: `npm test -- DsDropdownMenu`
Expected: 3 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add vue/components/DsDropdownMenu.vue vue/components/DsDropdownMenu.test.ts vue/index.ts
git commit -m "vue: add DsDropdownMenu"
```

---

### Task 2: DsTabs + DsTabPanel

**Files:**
- Create: `vue/components/DsTabs.vue`
- Create: `vue/components/DsTabPanel.vue`
- Test: `vue/components/DsTabs.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `TabItem` (types).
- Produces: `<DsTabs v-model :tabs>` renders `.ds-tabs` › `.ds-tab.is-active`; default slot holds `<DsTabPanel id="…">` children that show only when active. `modelValue: string` (active tab id); emits `update:modelValue`. ArrowLeft/Right move the active tab. DsTabs provides the active id to panels via `provide`/`inject` under the key `dsActiveTab`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsTabs from "./DsTabs.vue";
import DsTabPanel from "./DsTabPanel.vue";

const tabs = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "advanced", label: "Advanced" }
];

function wrap(active: string) {
  return mount(DsTabs, {
    props: { modelValue: active, tabs },
    slots: {
      default: () => [
        h(DsTabPanel, { id: "general" }, () => "G body"),
        h(DsTabPanel, { id: "appearance" }, () => "A body"),
        h(DsTabPanel, { id: "advanced" }, () => "Adv body")
      ]
    }
  });
}

describe("DsTabs", () => {
  it("marks the active tab and shows only its panel", () => {
    const w = wrap("appearance");
    const active = w.findAll(".ds-tab").filter((t) => t.classes().includes("is-active"));
    expect(active).toHaveLength(1);
    expect(active[0].text()).toBe("Appearance");
    expect(w.text()).toContain("A body");
    expect(w.text()).not.toContain("G body");
  });

  it("clicking a tab emits update:modelValue", async () => {
    const w = wrap("general");
    await w.findAll(".ds-tab")[2].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual(["advanced"]);
  });

  it("ArrowRight moves to the next tab", async () => {
    const w = wrap("general");
    await w.find(".ds-tabs").trigger("keydown", { key: "ArrowRight" });
    expect(w.emitted("update:modelValue")![0]).toEqual(["appearance"]);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsTabs`
Expected: FAIL — cannot find `./DsTabs.vue`.

- [ ] **Step 3: Implement `vue/components/DsTabs.vue`**

```vue
<script setup lang="ts">
import { computed, provide, type ComputedRef } from "vue";
import type { TabItem } from "../types";

const props = defineProps<{ modelValue: string; tabs: TabItem[] }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

const active = computed(() => props.modelValue);
provide<ComputedRef<string>>("dsActiveTab", active);

function select(tab: TabItem) {
  if (tab.disabled) return;
  emit("update:modelValue", tab.id);
}
function onKeydown(e: KeyboardEvent) {
  const idx = props.tabs.findIndex((t) => t.id === props.modelValue);
  if (idx < 0) return;
  let next = idx;
  if (e.key === "ArrowRight") next = (idx + 1) % props.tabs.length;
  else if (e.key === "ArrowLeft") next = (idx - 1 + props.tabs.length) % props.tabs.length;
  else return;
  e.preventDefault();
  emit("update:modelValue", props.tabs[next].id);
}
</script>

<template>
  <div>
    <div class="ds-tabs" role="tablist" @keydown="onKeydown">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="ds-tab"
        :class="{ 'is-active': tab.id === active }"
        role="tab"
        :aria-selected="tab.id === active"
        :tabindex="tab.id === active ? 0 : -1"
        :disabled="tab.disabled || undefined"
        @click="select(tab)"
      >
        {{ tab.label }}
      </button>
    </div>
    <slot />
  </div>
</template>
```

- [ ] **Step 4: Implement `vue/components/DsTabPanel.vue`**

```vue
<script setup lang="ts">
import { inject, computed, type ComputedRef } from "vue";

const props = defineProps<{ id: string }>();
const active = inject<ComputedRef<string>>("dsActiveTab");
const show = computed(() => active?.value === props.id);
</script>

<template>
  <div v-if="show" role="tabpanel">
    <slot />
  </div>
</template>
```

- [ ] **Step 5: Append exports to `vue/index.ts`**

```ts
export { default as DsTabs } from "./components/DsTabs.vue";
export { default as DsTabPanel } from "./components/DsTabPanel.vue";
```

- [ ] **Step 6: Run test + typecheck**

Run: `npm test -- DsTabs`
Expected: 3 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add vue/components/DsTabs.vue vue/components/DsTabPanel.vue vue/components/DsTabs.test.ts vue/index.ts
git commit -m "vue: add DsTabs + DsTabPanel"
```

---

### Task 3: DsAccordion + DsAccordionItem

**Files:**
- Create: `vue/components/DsAccordion.vue`
- Create: `vue/components/DsAccordionItem.vue`
- Test: `vue/components/DsAccordion.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Produces: `<DsAccordion v-model :multiple>` with `<DsAccordionItem id title>` children. `modelValue: string | string[]` (open id, or id[] when `multiple`). Emits `update:modelValue`. DsAccordion provides `{ isOpen(id), toggle(id) }` via `provide` under key `dsAccordion`. Renders `.ds-accordion` › `.ds-acc` (with `.is-open`) › `.ds-acc-body`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsAccordion from "./DsAccordion.vue";
import DsAccordionItem from "./DsAccordionItem.vue";

function wrap(modelValue: string | string[], multiple = false) {
  return mount(DsAccordion, {
    props: { modelValue, multiple },
    slots: {
      default: () => [
        h(DsAccordionItem, { id: "one", title: "One" }, () => "Body one"),
        h(DsAccordionItem, { id: "two", title: "Two" }, () => "Body two")
      ]
    }
  });
}

describe("DsAccordion", () => {
  it("opens the item matching modelValue and hides its body otherwise", () => {
    const w = wrap("one");
    const items = w.findAll(".ds-acc");
    expect(items[0].classes()).toContain("is-open");
    expect(items[1].classes()).not.toContain("is-open");
    expect(items[0].find(".ds-acc-body").exists()).toBe(true);
    expect(items[1].find(".ds-acc-body").exists()).toBe(false);
  });

  it("single mode emits the new id when another header is clicked", async () => {
    const w = wrap("one");
    await w.findAll(".ds-acc-head")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual(["two"]);
  });

  it("single mode toggling the open item emits empty string", async () => {
    const w = wrap("one");
    await w.findAll(".ds-acc-head")[0].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual([""]);
  });

  it("multiple mode accumulates ids", async () => {
    const w = wrap(["one"], true);
    await w.findAll(".ds-acc-head")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual([["one", "two"]]);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsAccordion`
Expected: FAIL — cannot find `./DsAccordion.vue`.

- [ ] **Step 3: Implement `vue/components/DsAccordion.vue`**

```vue
<script setup lang="ts">
import { provide } from "vue";

const props = withDefaults(
  defineProps<{ modelValue: string | string[]; multiple?: boolean }>(),
  { multiple: false }
);
const emit = defineEmits<{ "update:modelValue": [string | string[]] }>();

function isOpen(id: string): boolean {
  return Array.isArray(props.modelValue)
    ? props.modelValue.includes(id)
    : props.modelValue === id;
}
function toggle(id: string): void {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : [];
    const set = new Set(current);
    set.has(id) ? set.delete(id) : set.add(id);
    emit("update:modelValue", [...set]);
  } else {
    emit("update:modelValue", props.modelValue === id ? "" : id);
  }
}

provide("dsAccordion", { isOpen, toggle });
</script>

<template>
  <div class="ds-accordion">
    <slot />
  </div>
</template>
```

- [ ] **Step 4: Implement `vue/components/DsAccordionItem.vue`**

```vue
<script setup lang="ts">
import { inject, computed } from "vue";

interface AccordionApi {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
}

const props = defineProps<{ id: string; title: string }>();
const api = inject<AccordionApi>("dsAccordion");
const open = computed(() => api?.isOpen(props.id) ?? false);
</script>

<template>
  <div class="ds-acc" :class="{ 'is-open': open }">
    <button
      type="button"
      class="ds-acc-head"
      :aria-expanded="open"
      @click="api?.toggle(id)"
    >
      {{ title }}
    </button>
    <div v-if="open" class="ds-acc-body">
      <slot />
    </div>
  </div>
</template>
```

- [ ] **Step 5: Append exports to `vue/index.ts`**

```ts
export { default as DsAccordion } from "./components/DsAccordion.vue";
export { default as DsAccordionItem } from "./components/DsAccordionItem.vue";
```

- [ ] **Step 6: Run test + typecheck**

Run: `npm test -- DsAccordion`
Expected: 4 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add vue/components/DsAccordion.vue vue/components/DsAccordionItem.vue vue/components/DsAccordion.test.ts vue/index.ts
git commit -m "vue: add DsAccordion + DsAccordionItem"
```

---

### Task 4: DsDialog

**Files:**
- Create: `vue/components/DsDialog.vue`
- Test: `vue/components/DsDialog.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `useFocusTrap`, `useDismiss` (Phase 1).
- Produces: `<DsDialog v-model:open title>` with slots `body` (default) and `foot`. `open: boolean`; emits `update:open`. Teleports to `body`, renders `.ds-overlay` › `.ds-dialog` (head/body/foot), traps focus, closes on Esc / backdrop click, locks `document.body` scroll while open.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import DsDialog from "./DsDialog.vue";

describe("DsDialog", () => {
  it("renders nothing while closed", () => {
    mount(DsDialog, { props: { open: false, title: "Hi" }, attachTo: document.body });
    expect(document.querySelector(".ds-dialog")).toBeNull();
  });

  it("teleports an overlay + dialog with the title when open", async () => {
    mount(DsDialog, {
      props: { open: true, title: "Delete this file?" },
      slots: { default: () => "Body text" },
      attachTo: document.body
    });
    await nextTick();
    expect(document.querySelector(".ds-overlay")).not.toBeNull();
    expect(document.querySelector(".ds-dialog-head")?.textContent).toContain("Delete this file?");
    expect(document.querySelector(".ds-dialog-body")?.textContent).toContain("Body text");
  });

  it("locks body scroll while open", async () => {
    mount(DsDialog, { props: { open: true, title: "x" }, attachTo: document.body });
    await nextTick();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("Escape emits update:open false", async () => {
    const w = mount(DsDialog, { props: { open: true, title: "x" }, attachTo: document.body });
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(w.emitted("update:open")![0]).toEqual([false]);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsDialog`
Expected: FAIL — cannot find `./DsDialog.vue`.

- [ ] **Step 3: Implement `vue/components/DsDialog.vue`**

```vue
<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useDismiss } from "../composables/useDismiss";

const props = defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ "update:open": [boolean] }>();

const dialog = ref<HTMLElement | null>(null);
const openRef = ref(props.open);
watch(
  () => props.open,
  (v) => (openRef.value = v)
);

function close() {
  emit("update:open", false);
}

useFocusTrap(dialog, openRef);
useDismiss({ active: openRef, root: dialog, onDismiss: close });

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
      <div ref="dialog" class="ds-dialog" role="dialog" aria-modal="true">
        <div class="ds-dialog-head">
          <h3>{{ title }}</h3>
        </div>
        <div class="ds-dialog-body">
          <slot />
        </div>
        <div v-if="$slots.foot" class="ds-dialog-foot">
          <slot name="foot" :close="close" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 4: Append the export to `vue/index.ts`**

```ts
export { default as DsDialog } from "./components/DsDialog.vue";
```

- [ ] **Step 5: Run test + typecheck**

Run: `npm test -- DsDialog`
Expected: 4 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add vue/components/DsDialog.vue vue/components/DsDialog.test.ts vue/index.ts
git commit -m "vue: add DsDialog (teleport + focus-trap + dismiss + scroll lock)"
```

---

### Task 5: DsToastHost

**Files:**
- Create: `vue/components/DsToastHost.vue`
- Test: `vue/components/DsToastHost.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `useToast` (Phase 1 — shared reactive queue).
- Produces: `<DsToastHost />` — placed once near the app root; renders `.ds-toast-stack` › `.ds-toast` per active toast (tone class `is-<tone>`), each with a dismiss control. Reads/writes the shared queue via `useToast()`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import DsToastHost from "./DsToastHost.vue";
import { useToast } from "../composables/useToast";

describe("DsToastHost", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
    const { toasts, dismiss } = useToast();
    [...toasts].forEach((t) => dismiss(t.id));
  });

  it("renders a toast pushed via useToast", async () => {
    const w = mount(DsToastHost);
    useToast().toast({ message: "Saved", tone: "success", timeout: 0 });
    await nextTick();
    expect(w.findAll(".ds-toast")).toHaveLength(1);
    expect(w.find(".ds-toast").classes()).toContain("is-success");
    expect(w.find(".ds-toast").text()).toContain("Saved");
  });

  it("dismiss button removes the toast", async () => {
    const w = mount(DsToastHost);
    useToast().toast({ message: "Bye", timeout: 0 });
    await nextTick();
    await w.find(".ds-toast-close").trigger("click");
    expect(w.findAll(".ds-toast")).toHaveLength(0);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsToastHost`
Expected: FAIL — cannot find `./DsToastHost.vue`.

- [ ] **Step 3: Implement `vue/components/DsToastHost.vue`**

```vue
<script setup lang="ts">
import { useToast } from "../composables/useToast";

const { toasts, dismiss } = useToast();
</script>

<template>
  <div class="ds-toast-stack">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="ds-toast"
      :class="`is-${t.tone ?? 'info'}`"
      role="status"
    >
      <span class="ds-toast-msg">{{ t.message }}</span>
      <button type="button" class="ds-toast-close" aria-label="Dismiss" @click="dismiss(t.id)">×</button>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Append the export to `vue/index.ts`**

```ts
export { default as DsToastHost } from "./components/DsToastHost.vue";
```

- [ ] **Step 5: Run test + typecheck**

Run: `npm test -- DsToastHost`
Expected: 2 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 6: Full Phase-3 gate + commit**

Run: `npm test`
Expected: all suites pass (Phases 1–3).
Run: `npm run typecheck`
Expected: exits 0.
Run: `npm run build`
Expected: unaffected — exit 0.
```bash
git add vue/components/DsToastHost.vue vue/components/DsToastHost.test.ts vue/index.ts
git commit -m "vue: add DsToastHost (renders shared toast queue)"
```

---

## Self-Review

- **Spec coverage (Phase 3 portion):** DsDropdownMenu (Task 1), DsTabs/DsTabPanel (Task 2), DsAccordion/DsAccordionItem (Task 3), DsDialog (Task 4), DsToastHost (Task 5). All five net-new components covered. With Phases 1–2 this completes all 10 high-value components + 5 composables.
- **Placeholder scan:** none — every step has full code or an exact command.
- **Type consistency:** `MenuItem`/`TabItem` from `../types`; `useDismiss`/`useFocusTrap`/`useRovingTabindex`/`useToast` signatures match Phase 1. `v-model` pairs consistent (`modelValue`/`update:modelValue`, `open`/`update:open`). Provide/inject keys (`dsActiveTab`, `dsAccordion`) are defined and consumed within the same task.
