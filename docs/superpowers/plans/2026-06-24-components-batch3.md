# Components Batch 3 (Tier 3 light) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add **DsSplitButton** (primary action + caret menu) and **DsCommandPalette** (⌘K modal launcher), each with CSS primitive(s), Vue component, story, unit test, docs example with a Vue snippet, and a green coverage gate.

**Architecture:** DsSplitButton mirrors `DsDropdownMenu.vue` (toggle + `useDismiss`) with a primary button alongside the caret; new `ds-split-btn` primitive, dropdown reuses `.ds-menu`. DsCommandPalette mirrors `DsDialog.vue` (overlay + `useFocusTrap` + `useDismiss`) with a filter input and keyboard-navigable list; new `ds-command` primitive set.

**Tech Stack:** Vue 3.5 (`<script setup>`, typed props/emits/`withDefaults`), Vitest + `@vue/test-utils`, Storybook CSF3, the reference/coverage tooling.

## Global Constraints

- SFCs `<script setup lang="ts">`; typed props/emits. Mirror `DsDropdownMenu.vue` (split button) and `DsDialog.vue` (command palette).
- CSS uses `tokens.css` vars only (`--surface`, `--border*`, `--text*`, `--fz-*`, `--radius*`, `--hover`, `--shadow-dialog`, `--space-*`, `--label-ls`). No hard-coded colors; structural literals OK.
- A component's emitted `.ds-*` classes must be real primitives — every new class needs a CSS rule (`reference:lint` + gate `renders` enforce this).
- Each component: exported from `vue/index.ts`, has `DsX.stories.ts` and `DsX.test.ts`.
- Both components are interactive: each gets a `<template data-vue>` snippet in its docs example AND joins `DATA_VUE_EXPECTED` in `tools/coverage-core.mjs` (update the equality test in `tools/coverage.test.mjs`, kept sorted).
- After each task: `npm run reference:build` (commit regenerated `reference/manifest.json`, `REFERENCE.md`, `llms.txt`), `npm run reference:lint` (clean), `npm run typecheck` (0), `node tools/coverage.mjs` (all `ok`).
- New type `CommandItem` goes in `vue/types.ts`. Storybook `title` groups: `Foundation`/`Form`/`Display`/`Shell`/`Interactive`.
- Gate stays warn-only.

---

### Task 1: DsSplitButton

Primary action button + caret that opens a menu (interactive). New primitive `ds-split-btn` (+ `ds-split-caret`); dropdown reuses `.ds-menu`.

**Files:**
- Modify: `css/components.css`, `vue/index.ts`, `pages/buttons.html`, `tools/coverage-core.mjs`, `tools/coverage.test.mjs`
- Create: `vue/components/DsSplitButton.vue`, `DsSplitButton.test.ts`, `DsSplitButton.stories.ts`
- Regenerate: `reference/*`

**Interfaces:**
- Produces: `DsSplitButton` — props `{ label: string; items: MenuItem[]; variant?: "primary" | "ghost" | "danger" }`, emits `click: []` (primary) and `select: [string]` (menu item id). Renders `.ds-split-btn` > (`.ds-btn` primary + `.ds-btn.ds-split-caret`) + `.ds-menu` when open. `variant` maps to `is-primary`/`is-ghost`/`is-danger` on both buttons (matches `DsButton`).

- [ ] **Step 1: Add the CSS primitive**

```css
.ds-split-btn { position:relative; display:inline-flex; }
.ds-split-btn > .ds-btn:first-child { border-top-right-radius:0; border-bottom-right-radius:0; }
.ds-split-caret { margin-left:-1px; padding:0 7px; border-top-left-radius:0; border-bottom-left-radius:0; }
.ds-split-btn > .ds-menu { top:calc(100% + 4px); right:0; left:auto; }
```

- [ ] **Step 2: Write the failing test**

Create `vue/components/DsSplitButton.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSplitButton from "./DsSplitButton.vue";

const items = [
  { id: "dup", label: "Duplicate" },
  { id: "sep", separator: true },
  { id: "del", label: "Delete", danger: true }
];

describe("DsSplitButton", () => {
  it("renders the primary label and a caret, menu closed", () => {
    const w = mount(DsSplitButton, { props: { label: "Save", items } });
    const btns = w.findAll(".ds-split-btn > .ds-btn");
    expect(btns[0].text()).toBe("Save");
    expect(btns).toHaveLength(2);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("emits click from the primary button without opening the menu", async () => {
    const w = mount(DsSplitButton, { props: { label: "Save", items } });
    await w.findAll(".ds-split-btn > .ds-btn")[0].trigger("click");
    expect(w.emitted("click")).toHaveLength(1);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("opens the menu from the caret and emits select on an item", async () => {
    const w = mount(DsSplitButton, { props: { label: "Save", items } });
    await w.find(".ds-split-caret").trigger("click");
    expect(w.find(".ds-menu").exists()).toBe(true);
    expect(w.findAll(".ds-menu-item")).toHaveLength(2);
    await w.findAll(".ds-menu-item")[1].trigger("click");
    expect(w.emitted("select")!.at(-1)).toEqual(["del"]);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("applies the variant class to both buttons", () => {
    const w = mount(DsSplitButton, { props: { label: "Save", items, variant: "primary" } });
    w.findAll(".ds-split-btn > .ds-btn").forEach((b) => expect(b.classes()).toContain("is-primary"));
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run vue/components/DsSplitButton.test.ts`
Expected: FAIL — cannot resolve `./DsSplitButton.vue`.

- [ ] **Step 4: Implement and export**

Create `vue/components/DsSplitButton.vue`:

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import type { MenuItem } from "../types";
import { useDismiss } from "../composables/useDismiss";

const props = defineProps<{ label: string; items: MenuItem[]; variant?: "primary" | "ghost" | "danger" }>();
const emit = defineEmits<{ click: []; select: [string] }>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
useDismiss({ active: open, root, onDismiss: () => (open.value = false) });

const variantClass = computed(() => (props.variant ? `is-${props.variant}` : ""));

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
  <div ref="root" class="ds-split-btn">
    <button type="button" class="ds-btn" :class="variantClass" @click="emit('click')">{{ label }}</button>
    <button
      type="button"
      class="ds-btn ds-split-caret"
      :class="variantClass"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      aria-label="More actions"
      @click.stop="toggle"
    >▾</button>
    <div v-if="open" class="ds-menu" role="menu" @click.stop>
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
        >{{ item.label }}</div>
      </template>
    </div>
  </div>
</template>
```

In `vue/index.ts`, add `export { default as DsSplitButton } from "./components/DsSplitButton.vue";`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run vue/components/DsSplitButton.test.ts`
Expected: PASS (all four).

- [ ] **Step 6: Add the story**

Create `vue/components/DsSplitButton.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsSplitButton from "./DsSplitButton.vue";

const items = [
  { id: "dup", label: "Duplicate" },
  { id: "exp", label: "Export…" },
  { id: "s1", separator: true },
  { id: "del", label: "Delete", danger: true }
];

const meta: Meta<typeof DsSplitButton> = {
  title: "Interactive/DsSplitButton",
  component: DsSplitButton,
  tags: ["autodocs"],
  args: { label: "Save", items },
  argTypes: { variant: { control: "select", options: [undefined, "primary", "ghost", "danger"] } },
  render: (args) => ({ components: { DsSplitButton }, setup: () => ({ args }), template: `<DsSplitButton v-bind="args" />` })
};
export default meta;
type Story = StoryObj<typeof DsSplitButton>;

export const Default: Story = {};
export const Primary: Story = { args: { variant: "primary" } };
```

- [ ] **Step 7: Add the docs example + Vue snippet**

In `pages/buttons.html`, add (open menu shown statically):

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-split-btn">
      <button class="ds-btn is-primary">Save</button>
      <button class="ds-btn is-primary ds-split-caret" aria-haspopup="menu" aria-label="More actions">▾</button>
      <div class="ds-menu" role="menu">
        <div class="ds-menu-item" role="menuitem">Save as…</div>
        <div class="ds-menu-item" role="menuitem">Save a copy</div>
      </div>
    </div>
  </div>
  <template data-vue>
<DsSplitButton label="Save" variant="primary" :items="items" @click="onSave" @select="onPick" />
  </template>
  <div class="example-caption">Primary action plus a menu with <code>.ds-split-btn</code>.</div>
</div>
```

- [ ] **Step 8: Add to the gate's interactive set**

In `tools/coverage-core.mjs`, add `"DsSplitButton"` to `DATA_VUE_EXPECTED`. Update the `coverage.test.mjs` equality assertion (sorted).

- [ ] **Step 9: Regenerate + verify**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && npx vitest run tools/coverage.test.mjs && node tools/coverage.mjs`
Expected: lint clean; typecheck 0; coverage tests pass; gate all `ok`.

- [ ] **Step 10: Commit**

```bash
git add css/components.css vue/components/DsSplitButton.vue vue/components/DsSplitButton.test.ts vue/components/DsSplitButton.stories.ts vue/index.ts tools/coverage-core.mjs tools/coverage.test.mjs pages/buttons.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsSplitButton + ds-split-btn primitive + gate tracking"
```

---

### Task 2: DsCommandPalette

⌘K modal launcher (interactive). New primitive `ds-command` (+ parts); reuses `.ds-overlay`.

**Files:**
- Modify: `css/components.css`, `vue/types.ts`, `vue/index.ts`, `pages/patterns.html`, `tools/coverage-core.mjs`, `tools/coverage.test.mjs`
- Create: `vue/components/DsCommandPalette.vue`, `DsCommandPalette.test.ts`, `DsCommandPalette.stories.ts`
- Regenerate: `reference/*`

**Interfaces:**
- Produces: type `CommandItem { id: string; label: string; hint?: string; group?: string }`; `DsCommandPalette` — props `{ open: boolean; commands: CommandItem[]; placeholder?: string }` (default placeholder `"Type a command…"`), emits `update:open: [boolean]` and `select: [string]`. Renders (teleported) `.ds-overlay` > `.ds-command` > (`.ds-command-input` + `.ds-command-list` > `.ds-command-item`(`.is-active`)[> `.ds-command-hint`]). Substring filter on `label`; ArrowUp/Down move the active item; Enter selects; Escape/outside-click close; input autofocus on open. (`group` field is part of the type for forward-compat but not rendered as headers in v1.)

- [ ] **Step 1: Add the CSS primitive**

```css
.ds-command { align-self:start; margin-top:12vh; width:min(560px,92vw); display:flex; flex-direction:column; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); box-shadow:var(--shadow-dialog); overflow:hidden; }
.ds-command-input { width:100%; padding:14px 16px; border:0; border-bottom:1px solid var(--border-soft); background:transparent; color:var(--text); font-size:var(--fz-md); outline:none; }
.ds-command-list { max-height:320px; overflow:auto; padding:6px; }
.ds-command-item { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:var(--radius-sm); font-size:var(--fz-base); color:var(--text-2); cursor:default; }
.ds-command-item.is-active { background:var(--hover); color:var(--text); }
.ds-command-hint { margin-left:auto; font-size:var(--fz-xs); color:var(--text-3); }
```

- [ ] **Step 2: Add the type**

In `vue/types.ts`, add:

```ts
export interface CommandItem { id: string; label: string; hint?: string; group?: string }
```

- [ ] **Step 3: Write the failing test**

Create `vue/components/DsCommandPalette.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import DsCommandPalette from "./DsCommandPalette.vue";

const commands = [
  { id: "new", label: "New File" },
  { id: "open", label: "Open Folder" },
  { id: "save", label: "Save All", hint: "Ctrl+S" }
];

describe("DsCommandPalette", () => {
  it("renders nothing when closed", () => {
    const w = mount(DsCommandPalette, { props: { open: false, commands }, attachTo: document.body });
    expect(document.querySelector(".ds-command")).toBeNull();
    w.unmount();
  });

  it("renders the input and all commands when open", () => {
    const w = mount(DsCommandPalette, { props: { open: true, commands }, attachTo: document.body });
    expect(document.querySelector(".ds-command-input")).not.toBeNull();
    expect(document.querySelectorAll(".ds-command-item")).toHaveLength(3);
    w.unmount();
  });

  it("filters commands by substring", async () => {
    const w = mount(DsCommandPalette, { props: { open: true, commands }, attachTo: document.body });
    const input = document.querySelector(".ds-command-input") as HTMLInputElement;
    input.value = "open";
    input.dispatchEvent(new Event("input"));
    await nextTick();
    const items = document.querySelectorAll(".ds-command-item");
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain("Open Folder");
    w.unmount();
  });

  it("ArrowDown + Enter selects the active command and closes", async () => {
    const w = mount(DsCommandPalette, { props: { open: true, commands }, attachTo: document.body });
    const panel = document.querySelector(".ds-command") as HTMLElement;
    panel.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await nextTick();
    panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await nextTick();
    expect(w.emitted("select")!.at(-1)).toEqual(["open"]);
    expect(w.emitted("update:open")!.at(-1)).toEqual([false]);
    w.unmount();
  });

  it("clicking a command emits select", async () => {
    const w = mount(DsCommandPalette, { props: { open: true, commands }, attachTo: document.body });
    (document.querySelectorAll(".ds-command-item")[2] as HTMLElement).click();
    await nextTick();
    expect(w.emitted("select")!.at(-1)).toEqual(["save"]);
    w.unmount();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run vue/components/DsCommandPalette.test.ts`
Expected: FAIL — cannot resolve `./DsCommandPalette.vue`.

- [ ] **Step 5: Implement and export**

Create `vue/components/DsCommandPalette.vue`:

```vue
<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import type { CommandItem } from "../types";
import { useFocusTrap } from "../composables/useFocusTrap";
import { useDismiss } from "../composables/useDismiss";

const props = withDefaults(
  defineProps<{ open: boolean; commands: CommandItem[]; placeholder?: string }>(),
  { placeholder: "Type a command…" }
);
const emit = defineEmits<{ "update:open": [boolean]; select: [string] }>();

const panel = ref<HTMLElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const openRef = ref(props.open);
const query = ref("");
const activeIndex = ref(0);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return q ? props.commands.filter((c) => c.label.toLowerCase().includes(q)) : props.commands;
});

watch(
  () => props.open,
  (v) => {
    openRef.value = v;
    if (v) {
      query.value = "";
      activeIndex.value = 0;
      nextTick(() => input.value?.focus());
    }
  }
);
watch(filtered, () => (activeIndex.value = 0));

function close() {
  emit("update:open", false);
}
function choose(c: CommandItem) {
  emit("select", c.id);
  close();
}

useFocusTrap(panel, openRef);
useDismiss({ active: openRef, root: panel, onDismiss: close });

function onKey(e: KeyboardEvent) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const c = filtered.value[activeIndex.value];
    if (c) choose(c);
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="ds-overlay">
      <div ref="panel" class="ds-command" role="dialog" aria-modal="true" @keydown="onKey">
        <input
          ref="input"
          v-model="query"
          class="ds-command-input"
          :placeholder="placeholder"
          role="combobox"
          aria-expanded="true"
          aria-controls="ds-command-list"
          aria-label="Command"
        />
        <div id="ds-command-list" class="ds-command-list" role="listbox">
          <div
            v-for="(c, i) in filtered"
            :key="c.id"
            class="ds-command-item"
            :class="{ 'is-active': i === activeIndex }"
            role="option"
            :aria-selected="i === activeIndex"
            @click="choose(c)"
            @mousemove="activeIndex = i"
          >
            {{ c.label }}<span v-if="c.hint" class="ds-command-hint">{{ c.hint }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

In `vue/index.ts`, add `export { default as DsCommandPalette } from "./components/DsCommandPalette.vue";`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run vue/components/DsCommandPalette.test.ts`
Expected: PASS (all five). If the keydown tests don't trip the handler, ensure the dispatched `KeyboardEvent` targets the `.ds-command` panel (which carries `@keydown`) and bubbles.

- [ ] **Step 7: Add the story**

Create `vue/components/DsCommandPalette.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsCommandPalette from "./DsCommandPalette.vue";

const commands = [
  { id: "new", label: "New File", hint: "Ctrl+N" },
  { id: "open", label: "Open Folder…" },
  { id: "save", label: "Save All", hint: "Ctrl+S" },
  { id: "find", label: "Find in Files", hint: "Ctrl+Shift+F" }
];

const meta: Meta<typeof DsCommandPalette> = {
  title: "Interactive/DsCommandPalette",
  component: DsCommandPalette,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsCommandPalette },
    setup: () => { const open = ref(false); return { args, open, commands }; },
    template: `<button class="ds-btn" @click="open = true">Open palette (⌘K)</button>
      <DsCommandPalette v-bind="args" :open="open" :commands="commands" @update:open="open = $event" @select="open = false" />`
  })
};
export default meta;
type Story = StoryObj<typeof DsCommandPalette>;

export const Default: Story = {};
```

- [ ] **Step 8: Add the docs example + Vue snippet**

In `pages/patterns.html`, add a static example (the palette shown inline without the fixed overlay):

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-command" style="margin-top:0; box-shadow:none;">
      <input class="ds-command-input" placeholder="Type a command…" value="" aria-label="Command" />
      <div class="ds-command-list" role="listbox">
        <div class="ds-command-item is-active" role="option">New File<span class="ds-command-hint">Ctrl+N</span></div>
        <div class="ds-command-item" role="option">Open Folder…</div>
        <div class="ds-command-item" role="option">Save All<span class="ds-command-hint">Ctrl+S</span></div>
      </div>
    </div>
  </div>
  <template data-vue>
<DsCommandPalette v-model:open="open" :commands="commands" @select="run" />
  </template>
  <div class="example-caption">Command launcher with <code>.ds-command</code>.</div>
</div>
```

- [ ] **Step 9: Add to the gate's interactive set**

In `tools/coverage-core.mjs`, add `"DsCommandPalette"` to `DATA_VUE_EXPECTED`. Update the `coverage.test.mjs` equality assertion (sorted).

- [ ] **Step 10: Regenerate + verify**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && npx vitest run tools/coverage.test.mjs && node tools/coverage.mjs`
Expected: lint clean; typecheck 0; coverage tests pass; gate all `ok`.

- [ ] **Step 11: Commit**

```bash
git add css/components.css vue/types.ts vue/components/DsCommandPalette.vue vue/components/DsCommandPalette.test.ts vue/components/DsCommandPalette.stories.ts vue/index.ts tools/coverage-core.mjs tools/coverage.test.mjs pages/patterns.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsCommandPalette + ds-command primitive + gate tracking"
```

---

### Task 3: Batch verification

**Files:** none.

- [ ] **Step 1:** `npx vitest run && npm run typecheck` — all green, 0 type errors.
- [ ] **Step 2:** `npm run build && node tools/coverage.mjs` — build exit 0; gate `story`/`example`/`renders`/`docs` all `ok`.
- [ ] **Step 3:** `node -e "const m=require('./reference/manifest.json'); const want=['DsSplitButton','DsCommandPalette']; const have=new Set(m.components.map(c=>c.name)); console.log(want.map(n=>n+':'+have.has(n)).join(' '))"` — both `true`.

---

## Notes for the implementer

- DsSplitButton mirrors `DsDropdownMenu.vue`; DsCommandPalette mirrors `DsDialog.vue` (overlay + focus trap + dismiss). Read those first.
- DsCommandPalette tests dispatch real DOM events because Teleport renders into `document.body`; mount with `attachTo: document.body` and `w.unmount()` each test for isolation.
- Verify every CSS token used exists in `css/tokens.css`; if a name differs, use the real one.
- Commit regenerated `reference/*` artifacts with each task's source change.
- Gate stays warn-only; do not add `--strict`. Do not commit the impl report into git.
