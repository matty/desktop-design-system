# Vue Components — Phase 2: ds.js-Port Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the five components whose behavior currently lives imperatively in `js/ds.js`, as reactive Vue 3 SFCs: DsCombobox, DsTree, DsContextMenu, DsSplitter, DsSortable.

**Architecture:** Each SFC renders the existing `.ds-*` markup and toggles `.is-*` state classes, with state driven by `v-model` and behavior by the Phase-1 composables. No `<style>` blocks. `js/ds.js` is left untouched.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest + @vue/test-utils + happy-dom, `sortablejs` (added this phase for DsSortable).

## Global Constraints

- Depends on Phase 1 (composables + types + tooling) being complete and green.
- Vue 3 SFCs, `<script setup lang="ts">`, no `<style>` blocks; visuals from existing `.ds-*` / `.is-*` classes only.
- Behavior strategy = Approach A; do NOT modify `js/ds.js`.
- All new code under `vue/components/`; append exports to `vue/index.ts`.
- `npm test`, `npm run typecheck`, and `npm run build` must stay green.
- Two-space indentation; ESM.

---

### Task 1: DsCombobox

**Files:**
- Create: `vue/components/DsCombobox.vue`
- Test: `vue/components/DsCombobox.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `ComboOption` (types), `useDismiss` (Phase 1).
- Produces: `<DsCombobox v-model options multiple checklist filterable placeholder />`. `modelValue: string | string[] | null`; emits `update:modelValue`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsCombobox from "./DsCombobox.vue";

const options = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
  { value: "c", label: "Cherry" }
];

describe("DsCombobox", () => {
  it("opens on button click and lists options", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options } });
    await w.find(".ds-combo-btn").trigger("click");
    expect(w.find(".ds-combo").classes()).toContain("is-open");
    expect(w.findAll(".ds-combo-option")).toHaveLength(3);
  });

  it("single-select emits the value and closes", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options } });
    await w.find(".ds-combo-btn").trigger("click");
    await w.findAll(".ds-combo-option")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual(["b"]);
    expect(w.find(".ds-combo").classes()).not.toContain("is-open");
  });

  it("multiple toggles values in an array", async () => {
    const w = mount(DsCombobox, { props: { modelValue: ["a"], options, multiple: true } });
    await w.find(".ds-combo-btn").trigger("click");
    await w.findAll(".ds-combo-option")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual([["a", "b"]]);
  });

  it("filterable narrows the visible options", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options, filterable: true } });
    await w.find(".ds-combo-btn").trigger("click");
    await w.find(".ds-combo-filter").setValue("ban");
    expect(w.findAll(".ds-combo-option")).toHaveLength(1);
    expect(w.find(".ds-combo-option").text()).toBe("Banana");
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsCombobox`
Expected: FAIL — cannot find `./DsCombobox.vue`.

- [ ] **Step 3: Implement `vue/components/DsCombobox.vue`**

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import type { ComboOption } from "../types";
import { useDismiss } from "../composables/useDismiss";

const props = withDefaults(
  defineProps<{
    modelValue: string | string[] | null;
    options: ComboOption[];
    multiple?: boolean;
    checklist?: boolean;
    filterable?: boolean;
    placeholder?: string;
  }>(),
  { multiple: false, checklist: false, filterable: false, placeholder: "Select…" }
);
const emit = defineEmits<{ "update:modelValue": [string | string[] | null] }>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
const query = ref("");

const isMulti = computed(() => props.multiple || props.checklist);
const selected = computed<string[]>(() =>
  Array.isArray(props.modelValue) ? props.modelValue : props.modelValue ? [props.modelValue] : []
);
const visibleOptions = computed(() =>
  props.filterable && query.value
    ? props.options.filter((o) => o.label.toLowerCase().includes(query.value.toLowerCase()))
    : props.options
);
const selectedOptions = computed(() => props.options.filter((o) => selected.value.includes(o.value)));
const buttonLabel = computed(() => {
  if (props.checklist) return selected.value.length ? `${selected.value.length} selected` : props.placeholder;
  if (!isMulti.value) return selectedOptions.value[0]?.label ?? props.placeholder;
  return props.placeholder;
});
const isPlaceholder = computed(() => selected.value.length === 0 && !isMulti.value);

useDismiss({ active: open, root, onDismiss: () => (open.value = false) });

function toggleOpen() {
  open.value = !open.value;
  if (open.value && props.filterable) query.value = "";
}
function pick(opt: ComboOption) {
  if (opt.disabled) return;
  if (isMulti.value) {
    const set = new Set(selected.value);
    set.has(opt.value) ? set.delete(opt.value) : set.add(opt.value);
    emit("update:modelValue", [...set]);
  } else {
    emit("update:modelValue", opt.value);
    open.value = false;
  }
}
function removeChip(value: string) {
  emit("update:modelValue", selected.value.filter((v) => v !== value));
}
function isSelected(opt: ComboOption) {
  return selected.value.includes(opt.value);
}
</script>

<template>
  <div
    ref="root"
    class="ds-combo"
    :class="{
      'is-open': open,
      'is-multi': multiple && !checklist,
      'is-checklist': checklist,
      'is-filterable': filterable
    }"
  >
    <button type="button" class="ds-combo-btn" :aria-expanded="open" @click.stop="toggleOpen">
      <template v-if="multiple && !checklist">
        <span v-for="opt in selectedOptions" :key="opt.value" class="ds-chip">
          {{ opt.label }}
          <span class="ds-chip-x" @click.stop="removeChip(opt.value)">×</span>
        </span>
      </template>
      <span v-else class="ds-combo-value" :class="{ 'is-placeholder': isPlaceholder }">{{ buttonLabel }}</span>
      <span class="ds-combo-chev" aria-hidden="true">▾</span>
    </button>
    <div class="ds-combo-menu" :hidden="!open" role="listbox">
      <input
        v-if="filterable"
        class="ds-combo-filter"
        :value="query"
        placeholder="Filter…"
        @click.stop
        @input="query = ($event.target as HTMLInputElement).value"
      />
      <div
        v-for="opt in visibleOptions"
        :key="opt.value"
        class="ds-combo-option"
        :class="{ 'is-selected': isSelected(opt) }"
        role="option"
        :aria-selected="isSelected(opt)"
        :aria-disabled="opt.disabled || undefined"
        @click.stop="pick(opt)"
      >
        {{ opt.label }}
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Append the export to `vue/index.ts`**

Add to the end of `vue/index.ts`:
```ts
export { default as DsCombobox } from "./components/DsCombobox.vue";
```

- [ ] **Step 5: Run test + typecheck**

Run: `npm test -- DsCombobox`
Expected: 4 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add vue/components/DsCombobox.vue vue/components/DsCombobox.test.ts vue/index.ts
git commit -m "vue: add DsCombobox (reactive port of ds-combo)"
```

---

### Task 2: DsTree

**Files:**
- Create: `vue/components/DsTreeNode.vue` (recursive row renderer)
- Create: `vue/components/DsTree.vue`
- Test: `vue/components/DsTree.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `TreeNode` (types).
- Produces: `<DsTree :nodes v-model:selected v-model:expanded />`. `selected: string | null`, `expanded: string[]`. Emits `update:selected`, `update:expanded`. Arrow Up/Down move row focus; Right/Left expand/collapse; Enter/Space select (DOM-row navigation mirroring `js/ds.js`).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsTree from "./DsTree.vue";

const nodes = [
  { id: "1", label: "Root", children: [{ id: "1a", label: "Child A" }, { id: "1b", label: "Child B" }] },
  { id: "2", label: "Leaf" }
];

describe("DsTree", () => {
  it("renders only top-level rows when nothing is expanded", () => {
    const w = mount(DsTree, { props: { nodes, selected: null, expanded: [] } });
    expect(w.findAll(".ds-tree-row")).toHaveLength(2);
  });

  it("clicking the twisty emits update:expanded", async () => {
    const w = mount(DsTree, { props: { nodes, selected: null, expanded: [] } });
    await w.find(".ds-tree-twisty").trigger("click");
    expect(w.emitted("update:expanded")![0]).toEqual([["1"]]);
  });

  it("shows children when expanded", () => {
    const w = mount(DsTree, { props: { nodes, selected: null, expanded: ["1"] } });
    expect(w.findAll(".ds-tree-row")).toHaveLength(4);
  });

  it("clicking a row emits update:selected", async () => {
    const w = mount(DsTree, { props: { nodes, selected: null, expanded: [] } });
    await w.findAll(".ds-tree-row")[1].trigger("click");
    expect(w.emitted("update:selected")![0]).toEqual(["2"]);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsTree`
Expected: FAIL — cannot find `./DsTree.vue`.

- [ ] **Step 3: Implement `vue/components/DsTreeNode.vue`**

```vue
<script setup lang="ts">
import type { TreeNode } from "../types";

defineProps<{
  node: TreeNode;
  selected: string | null;
  expandedSet: Set<string>;
}>();
const emit = defineEmits<{ select: [TreeNode]; toggle: [TreeNode] }>();
</script>

<template>
  <li
    class="ds-tree-item"
    :class="{
      'is-leaf': !node.children || node.children.length === 0,
      'is-expanded': expandedSet.has(node.id),
      'is-selected': selected === node.id
    }"
  >
    <div
      class="ds-tree-row"
      role="treeitem"
      :aria-selected="selected === node.id"
      :aria-expanded="node.children && node.children.length ? expandedSet.has(node.id) : undefined"
      tabindex="-1"
      @click="emit('select', node)"
    >
      <span
        v-if="node.children && node.children.length"
        class="ds-tree-twisty"
        aria-hidden="true"
        @click.stop="emit('toggle', node)"
      >▸</span>
      <span class="ds-tree-label">{{ node.label }}</span>
    </div>
    <ul v-if="node.children && node.children.length && expandedSet.has(node.id)">
      <DsTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected="selected"
        :expanded-set="expandedSet"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </ul>
  </li>
</template>
```

- [ ] **Step 4: Implement `vue/components/DsTree.vue`**

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import type { TreeNode } from "../types";
import DsTreeNode from "./DsTreeNode.vue";

const props = withDefaults(
  defineProps<{ nodes: TreeNode[]; selected?: string | null; expanded?: string[] }>(),
  { selected: null, expanded: () => [] }
);
const emit = defineEmits<{ "update:selected": [string]; "update:expanded": [string[]] }>();

const root = ref<HTMLElement | null>(null);
const expandedSet = computed(() => new Set(props.expanded ?? []));

function select(node: TreeNode) {
  emit("update:selected", node.id);
}
function toggle(node: TreeNode) {
  const set = new Set(expandedSet.value);
  set.has(node.id) ? set.delete(node.id) : set.add(node.id);
  emit("update:expanded", [...set]);
}

function rows(): HTMLElement[] {
  const el = root.value;
  if (!el) return [];
  return Array.from(el.querySelectorAll<HTMLElement>(".ds-tree-row")).filter(
    (r) => r.offsetParent !== null
  );
}
function focusRow(r: HTMLElement) {
  rows().forEach((x) => (x.tabIndex = x === r ? 0 : -1));
  r.focus();
}
function onKeydown(e: KeyboardEvent) {
  const list = rows();
  const row = (e.target as HTMLElement).closest<HTMLElement>(".ds-tree-row");
  if (!row) return;
  const idx = list.indexOf(row);
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (list[idx + 1]) focusRow(list[idx + 1]);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (list[idx - 1]) focusRow(list[idx - 1]);
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    row.click();
  }
}
</script>

<template>
  <ul ref="root" class="ds-tree" role="tree" @keydown="onKeydown">
    <DsTreeNode
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :selected="selected"
      :expanded-set="expandedSet"
      @select="select"
      @toggle="toggle"
    />
  </ul>
</template>
```

- [ ] **Step 5: Append the export to `vue/index.ts`**

```ts
export { default as DsTree } from "./components/DsTree.vue";
```

- [ ] **Step 6: Run test + typecheck**

Run: `npm test -- DsTree`
Expected: 4 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add vue/components/DsTree.vue vue/components/DsTreeNode.vue vue/components/DsTree.test.ts vue/index.ts
git commit -m "vue: add DsTree (reactive port of ds-tree)"
```

---

### Task 3: DsContextMenu

**Files:**
- Create: `vue/components/DsContextMenu.vue`
- Test: `vue/components/DsContextMenu.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `MenuItem` (types), `useFocusTrap`, `useRovingTabindex`, `useDismiss` (Phase 1).
- Produces: `<DsContextMenu :items><slot/></DsContextMenu>`. Right-click on the default slot opens a `.ds-menu.ds-context-menu` at the cursor (viewport-flipped), focus-trapped + roving tabindex; Esc / outside-click closes; selecting a leaf emits `select` and runs `item.onSelect`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsContextMenu from "./DsContextMenu.vue";

const items = [
  { id: "cut", label: "Cut" },
  { id: "copy", label: "Copy" },
  { id: "sep", separator: true },
  { id: "del", label: "Delete", danger: true }
];

describe("DsContextMenu", () => {
  it("is closed until contextmenu fires", () => {
    const w = mount(DsContextMenu, {
      props: { items },
      slots: { default: () => h("div", { class: "target" }, "Right click me") },
      attachTo: document.body
    });
    expect(document.querySelector(".ds-context-menu")).toBeNull();
    w.unmount();
  });

  it("opens at the cursor on contextmenu and renders items", async () => {
    const w = mount(DsContextMenu, {
      props: { items },
      slots: { default: () => h("div", { class: "target" }, "Right click me") },
      attachTo: document.body
    });
    await w.find(".target").trigger("contextmenu", { clientX: 10, clientY: 20 });
    const menu = document.querySelector(".ds-context-menu");
    expect(menu).not.toBeNull();
    expect(menu!.querySelectorAll(".ds-menu-item").length).toBe(3);
    expect(menu!.querySelector(".ds-menu-sep")).not.toBeNull();
    w.unmount();
  });

  it("selecting a leaf emits select with the id and closes", async () => {
    const w = mount(DsContextMenu, {
      props: { items },
      slots: { default: () => h("div", { class: "target" }, "x") },
      attachTo: document.body
    });
    await w.find(".target").trigger("contextmenu", { clientX: 5, clientY: 5 });
    (document.querySelectorAll(".ds-menu-item")[0] as HTMLElement).click();
    expect(w.emitted("select")![0]).toEqual(["cut"]);
    expect(document.querySelector(".ds-context-menu")).toBeNull();
    w.unmount();
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsContextMenu`
Expected: FAIL — cannot find `./DsContextMenu.vue`.

- [ ] **Step 3: Implement `vue/components/DsContextMenu.vue`**

```vue
<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import type { MenuItem } from "../types";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useRovingTabindex } from "../composables/useRovingTabindex";
import { useDismiss } from "../composables/useDismiss";

const props = defineProps<{ items: MenuItem[] }>();
const emit = defineEmits<{ select: [string] }>();

const open = ref(false);
const x = ref(0);
const y = ref(0);
const menu = ref<HTMLElement | null>(null);

const renderItems = computed(() => props.items);

useFocusTrap(menu, open);
useRovingTabindex(menu, open, {
  selector: ":scope > .ds-menu-item",
  onActivate: (el) => el.click()
});
useDismiss({ active: open, root: menu, onDismiss: () => (open.value = false) });

async function onContext(e: MouseEvent) {
  e.preventDefault();
  open.value = true;
  await nextTick();
  const el = menu.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const px = e.clientX + r.width > window.innerWidth ? e.clientX - r.width : e.clientX;
  const py = e.clientY + r.height > window.innerHeight ? e.clientY - r.height : e.clientY;
  x.value = Math.max(4, px);
  y.value = Math.max(4, py);
}
function choose(item: MenuItem) {
  if (item.disabled || item.separator) return;
  if (item.children && item.children.length) return;
  item.onSelect?.();
  emit("select", item.id);
  open.value = false;
}
</script>

<template>
  <div style="display: contents" @contextmenu="onContext">
    <slot />
  </div>
  <Teleport to="body">
    <div
      v-if="open"
      ref="menu"
      class="ds-menu ds-context-menu"
      role="menu"
      :style="{ position: 'fixed', left: x + 'px', top: y + 'px' }"
    >
      <template v-for="item in renderItems" :key="item.id">
        <div v-if="item.separator" class="ds-menu-sep"></div>
        <div
          v-else
          class="ds-menu-item"
          :class="{ 'is-danger': item.danger, 'has-submenu': item.children && item.children.length }"
          role="menuitem"
          tabindex="-1"
          :aria-disabled="item.disabled || undefined"
          @click="choose(item)"
        >
          {{ item.label }}
        </div>
      </template>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 4: Append the export to `vue/index.ts`**

```ts
export { default as DsContextMenu } from "./components/DsContextMenu.vue";
```

- [ ] **Step 5: Run test + typecheck**

Run: `npm test -- DsContextMenu`
Expected: 3 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add vue/components/DsContextMenu.vue vue/components/DsContextMenu.test.ts vue/index.ts
git commit -m "vue: add DsContextMenu (reactive port of data-ds-context)"
```

---

### Task 4: DsSplitter

**Files:**
- Create: `vue/components/DsSplitter.vue`
- Test: `vue/components/DsSplitter.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Produces: `<DsSplitter v-model:size :horizontal :min :max>` with named slots `first` and `second`. `size: number` (px of the first pane). Drag the separator or use Arrow keys to resize; emits `update:size`. Renders `.ds-resizable` › `.ds-pane-first` / separator (`[data-ds-splitter]`) / `.ds-pane-second`, mirroring `js/ds.js`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsSplitter from "./DsSplitter.vue";

describe("DsSplitter", () => {
  it("renders two panes and a separator", () => {
    const w = mount(DsSplitter, {
      props: { size: 200 },
      slots: { first: () => h("div", "L"), second: () => h("div", "R") }
    });
    expect(w.find(".ds-pane-first").exists()).toBe(true);
    expect(w.find("[data-ds-splitter]").exists()).toBe(true);
    expect(w.find(".ds-pane-second").exists()).toBe(true);
  });

  it("applies the size as flex-basis on the first pane", () => {
    const w = mount(DsSplitter, {
      props: { size: 180 },
      slots: { first: () => h("div"), second: () => h("div") }
    });
    expect((w.find(".ds-pane-first").element as HTMLElement).style.flexBasis).toBe("180px");
  });

  it("ArrowRight increases size (vertical splitter) and emits update:size", async () => {
    const w = mount(DsSplitter, {
      props: { size: 100, min: 0, max: 1000 },
      slots: { first: () => h("div"), second: () => h("div") }
    });
    await w.find("[data-ds-splitter]").trigger("keydown", { key: "ArrowRight" });
    const ev = w.emitted("update:size")!;
    expect(ev[ev.length - 1][0]).toBe(116);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsSplitter`
Expected: FAIL — cannot find `./DsSplitter.vue`.

- [ ] **Step 3: Implement `vue/components/DsSplitter.vue`**

```vue
<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ size: number; horizontal?: boolean; min?: number; max?: number; step?: number }>(),
  { horizontal: false, min: 0, max: Number.POSITIVE_INFINITY, step: 16 }
);
const emit = defineEmits<{ "update:size": [number] }>();

const basis = computed(() => `${props.size}px`);

function clamp(px: number): number {
  return Math.min(props.max, Math.max(props.min, px));
}
function setSize(px: number) {
  emit("update:size", Math.round(clamp(px)));
}

let startPos = 0;
let startSize = 0;
function onMove(e: MouseEvent) {
  const p = props.horizontal ? e.clientY : e.clientX;
  setSize(startSize + (p - startPos));
}
function onUp() {
  document.removeEventListener("mousemove", onMove);
  document.removeEventListener("mouseup", onUp);
  document.body.style.userSelect = "";
}
function onDown(e: MouseEvent) {
  e.preventDefault();
  startPos = props.horizontal ? e.clientY : e.clientX;
  startSize = props.size;
  document.body.style.userSelect = "none";
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
}
function onKeydown(e: KeyboardEvent) {
  const dec = props.horizontal ? "ArrowUp" : "ArrowLeft";
  const inc = props.horizontal ? "ArrowDown" : "ArrowRight";
  if (e.key === dec) {
    e.preventDefault();
    setSize(props.size - props.step);
  } else if (e.key === inc) {
    e.preventDefault();
    setSize(props.size + props.step);
  }
}
</script>

<template>
  <div class="ds-resizable" :class="{ 'is-horizontal': horizontal }">
    <div class="ds-pane-first" :style="{ flexBasis: basis }">
      <slot name="first" />
    </div>
    <div
      data-ds-splitter
      role="separator"
      tabindex="0"
      :aria-orientation="horizontal ? 'horizontal' : 'vertical'"
      :aria-valuenow="size"
      :aria-valuemin="min"
      :aria-valuemax="Number.isFinite(max) ? max : undefined"
      @mousedown="onDown"
      @keydown="onKeydown"
    ></div>
    <div class="ds-pane-second">
      <slot name="second" />
    </div>
  </div>
</template>
```

- [ ] **Step 4: Append the export to `vue/index.ts`**

```ts
export { default as DsSplitter } from "./components/DsSplitter.vue";
```

- [ ] **Step 5: Run test + typecheck**

Run: `npm test -- DsSplitter`
Expected: 3 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add vue/components/DsSplitter.vue vue/components/DsSplitter.test.ts vue/index.ts
git commit -m "vue: add DsSplitter (reactive port of data-ds-splitter)"
```

---

### Task 5: DsSortable

**Files:**
- Modify: `package.json` (add `sortablejs` + `@types/sortablejs` devDependencies)
- Create: `vue/components/DsSortable.vue`
- Test: `vue/components/DsSortable.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `sortablejs`.
- Produces: `<DsSortable v-model :handle :animation><template #item="{ item }">…</template></DsSortable>`. `modelValue: T[]`; on drop, emits `update:modelValue` with the reordered array. Uses `ds-drop-placeholder` / `is-dragging` classes for parity with `js/ds.js`.

> NOTE on testing: happy-dom does not implement real drag-and-drop. The test verifies render + that Sortable is initialized and that `onEnd` reorders the bound array (invoked directly), not native pointer dragging.

- [ ] **Step 1: Add dependencies**

Add to `devDependencies` in `package.json`:
```json
    "sortablejs": "^1.15.6",
    "@types/sortablejs": "^1.15.8"
```
Run: `npm install`
Expected: completes; `node_modules/sortablejs` exists.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

const onEndHandlers: Array<(e: { oldIndex: number; newIndex: number }) => void> = [];
vi.mock("sortablejs", () => ({
  default: {
    create: (_el: HTMLElement, opts: { onEnd: (e: { oldIndex: number; newIndex: number }) => void }) => {
      onEndHandlers.push(opts.onEnd);
      return { destroy: () => {} };
    }
  }
}));

import DsSortable from "./DsSortable.vue";

describe("DsSortable", () => {
  it("renders one element per item via the item slot", () => {
    const w = mount(DsSortable, {
      props: { modelValue: ["a", "b", "c"] },
      slots: { item: (p: { item: string }) => p.item }
    });
    expect(w.findAll("[data-ds-sortable] > *")).toHaveLength(3);
  });

  it("reorders the bound array on drag end", () => {
    const w = mount(DsSortable, {
      props: { modelValue: ["a", "b", "c"] },
      slots: { item: (p: { item: string }) => p.item }
    });
    onEndHandlers[onEndHandlers.length - 1]({ oldIndex: 0, newIndex: 2 });
    expect(w.emitted("update:modelValue")![0]).toEqual([["b", "c", "a"]]);
  });
}
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- DsSortable`
Expected: FAIL — cannot find `./DsSortable.vue`.

- [ ] **Step 4: Implement `vue/components/DsSortable.vue`**

```vue
<script setup lang="ts" generic="T">
import { onMounted, onBeforeUnmount, ref } from "vue";
import Sortable from "sortablejs";

const props = withDefaults(
  defineProps<{ modelValue: T[]; handle?: string; animation?: number }>(),
  { animation: 150 }
);
const emit = defineEmits<{ "update:modelValue": [T[]] }>();

const list = ref<HTMLElement | null>(null);
let instance: { destroy: () => void } | null = null;

function reorder(oldIndex: number, newIndex: number) {
  const next = props.modelValue.slice();
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  emit("update:modelValue", next);
}

onMounted(() => {
  if (!list.value) return;
  instance = Sortable.create(list.value, {
    animation: props.animation,
    handle: props.handle,
    ghostClass: "ds-drop-placeholder",
    chosenClass: "is-dragging",
    dragClass: "is-dragging",
    onEnd: (e: Sortable.SortableEvent) => {
      if (e.oldIndex != null && e.newIndex != null && e.oldIndex !== e.newIndex) {
        reorder(e.oldIndex, e.newIndex);
      }
    }
  });
});
onBeforeUnmount(() => instance?.destroy());
</script>

<template>
  <div ref="list" data-ds-sortable>
    <div v-for="(item, i) in modelValue" :key="i">
      <slot name="item" :item="item" :index="i" />
    </div>
  </div>
</template>
```

- [ ] **Step 5: Append the export to `vue/index.ts`**

```ts
export { default as DsSortable } from "./components/DsSortable.vue";
```

- [ ] **Step 6: Run test + typecheck**

Run: `npm test -- DsSortable`
Expected: 2 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 7: Full Phase-2 gate + commit**

Run: `npm test`
Expected: all suites pass (Phase 1 + the 5 new component suites).
Run: `npm run typecheck`
Expected: exits 0.
Run: `npm run build`
Expected: unaffected — exit 0.
```bash
git add package.json package-lock.json vue/components/DsSortable.vue vue/components/DsSortable.test.ts vue/index.ts
git commit -m "vue: add DsSortable (sortablejs-backed reactive reorder)"
```

---

## Self-Review

- **Spec coverage (Phase 2 portion):** DsCombobox (Task 1), DsTree (Task 2), DsContextMenu (Task 3), DsSplitter (Task 4), DsSortable + `sortablejs` dep (Task 5). All five `ds.js`-port components covered.
- **Placeholder scan:** none — every step has full code or an exact command. The DsSortable test note explains the happy-dom DnD limitation rather than leaving a gap.
- **Type consistency:** `ComboOption`, `TreeNode`, `MenuItem` imported from `../types` (Phase 1 Task 2). Composable signatures (`useDismiss`/`useFocusTrap`/`useRovingTabindex`) match Phase 1 Interfaces. `v-model` prop/emit pairs are consistent (`modelValue`/`update:modelValue`, `selected`/`update:selected`, `expanded`/`update:expanded`, `size`/`update:size`).
