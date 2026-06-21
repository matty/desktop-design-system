# Vue Components — Phase D: App-Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the app-shell/layout components (DsTitlebar, DsRail + DsNavItem, DsToolbar, DsStatusbar, DsBreadcrumb) so full desktop window shells can be composed in Vue.

**Architecture:** Vue 3 SFCs following the locked contract: `<script setup lang="ts">`, no `<style>`, real `.ds-*` markup, slots for content, variant props → real `.is-*` (only DsNavItem has one: `is-active`). Two grouped tasks.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest + @vue/test-utils + happy-dom. No new deps.

## Global Constraints

- Vue 3 SFC `<script setup lang="ts">`, NO `<style>` block anywhere in `vue/`.
- A variant prop maps ONLY to an `.is-*` class present in `css/components.css` (DsNavItem `active`→`is-active`, asserted via `cssHas`).
- Markup matches the docs exactly (structures given per component). Sub-element classes used — titlebar: `.ds-titlebar-title`, `.ds-winbtns`, window-button `.is-close`; rail: `.ds-rail-spacer`; toolbar: `.ds-toolbar-title`, `.ds-toolbar-spacer`; statusbar: `.ds-statusbar-spacer`, `.seg`; breadcrumb: `.sep`, `.current` — ALL confirmed present in `css/components.css`.
- No changes to `js/ds.js`, `css/`, `src/`, `pages/`. New code under `vue/components/`; append exports to `vue/index.ts`. ESM, two-space indentation.
- `npm test`/`npm run typecheck` stay green; final task runs `npm run build`.

---

### Task 1: DsTitlebar + DsRail + DsNavItem

**Files:** Create `DsTitlebar.vue`, `DsRail.vue`, `DsNavItem.vue` + three `.test.ts`; modify `vue/index.ts`.

**Interfaces:**
- `<DsTitlebar title?>` → `.ds-titlebar > .ds-titlebar-title (title or default slot) + .ds-winbtns > 3 buttons` (minimize/maximize/close; close has `.is-close`); emits `minimize`/`maximize`/`close`.
- `<DsRail>` → `<nav class="ds-rail"><slot/></nav>`; a `bottom` slot renders a `.ds-rail-spacer` then the bottom slot (pins bottom items).
- `<DsNavItem active? href? label?>` → `<a class="ds-navi" :class="{is-active}" :href><slot name="icon"/><slot>{{label}}</slot></a>`; `aria-current="page"` when active.

- [ ] **Step 1: Tests**

`DsTitlebar.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsTitlebar from "./DsTitlebar.vue";
describe("DsTitlebar", () => {
  it("renders title + three window buttons (last is-close)", () => {
    const w = mount(DsTitlebar, { props: { title: "App" } });
    expect(w.find(".ds-titlebar-title").text()).toBe("App");
    const btns = w.findAll(".ds-winbtns button");
    expect(btns).toHaveLength(3);
    expect(btns[2].classes()).toContain("is-close");
  });
  it("emits minimize/maximize/close", async () => {
    const w = mount(DsTitlebar, { props: { title: "App" } });
    const btns = w.findAll(".ds-winbtns button");
    await btns[0].trigger("click");
    await btns[1].trigger("click");
    await btns[2].trigger("click");
    expect(w.emitted("minimize")).toBeTruthy();
    expect(w.emitted("maximize")).toBeTruthy();
    expect(w.emitted("close")).toBeTruthy();
  });
});
```
`DsRail.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsRail from "./DsRail.vue";
describe("DsRail", () => {
  it("renders nav.ds-rail with slot", () => {
    expect(mount(DsRail, { slots: { default: () => "items" } }).find("nav.ds-rail").text()).toBe("items");
  });
  it("renders a rail-spacer when bottom slot is used", () => {
    const w = mount(DsRail, { slots: { bottom: () => "About" } });
    expect(w.find(".ds-rail-spacer").exists()).toBe(true);
    expect(w.text()).toContain("About");
  });
});
```
`DsNavItem.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsNavItem from "./DsNavItem.vue";
import { cssHas } from "../__support__/css";
describe("DsNavItem", () => {
  it("renders a.ds-navi with label; active maps is-active + aria-current", () => {
    expect(cssHas("is-active")).toBe(true);
    const w = mount(DsNavItem, { props: { label: "Home", active: true } });
    expect(w.find("a.ds-navi").text()).toBe("Home");
    expect(w.find("a").classes()).toContain("is-active");
    expect(w.find("a").attributes("aria-current")).toBe("page");
  });
});
```

- [ ] **Step 2: Run → FAIL** (`npm test -- DsTitlebar DsRail DsNavItem`).

- [ ] **Step 3: Implement**

`DsTitlebar.vue`:
```vue
<script setup lang="ts">
defineProps<{ title?: string }>();
const emit = defineEmits<{ minimize: []; maximize: []; close: [] }>();
</script>
<template>
  <div class="ds-titlebar">
    <div class="ds-titlebar-title"><slot>{{ title }}</slot></div>
    <div class="ds-winbtns">
      <button title="Minimize" @click="emit('minimize')"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg></button>
      <button title="Maximize" @click="emit('maximize')"><svg viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" rx="2"/></svg></button>
      <button class="is-close" title="Close" @click="emit('close')"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg></button>
    </div>
  </div>
</template>
```
`DsRail.vue`:
```vue
<script setup lang="ts">
import { useSlots } from "vue";
const slots = useSlots();
</script>
<template>
  <nav class="ds-rail">
    <slot />
    <template v-if="slots.bottom">
      <div class="ds-rail-spacer"></div>
      <slot name="bottom" />
    </template>
  </nav>
</template>
```
`DsNavItem.vue`:
```vue
<script setup lang="ts">
defineProps<{ active?: boolean; href?: string; label?: string }>();
</script>
<template>
  <a class="ds-navi" :class="{ 'is-active': active }" :href="href" :aria-current="active ? 'page' : undefined">
    <slot name="icon" />
    <slot>{{ label }}</slot>
  </a>
</template>
```

- [ ] **Step 4: Append exports** (`DsTitlebar`, `DsRail`, `DsNavItem`).
- [ ] **Step 5: Verify** `npm test -- DsTitlebar DsRail DsNavItem` pass; `npm run typecheck` 0.
- [ ] **Step 6: Commit**
```bash
git add vue/components/DsTitlebar.vue vue/components/DsRail.vue vue/components/DsNavItem.vue vue/components/DsTitlebar.test.ts vue/components/DsRail.test.ts vue/components/DsNavItem.test.ts vue/index.ts
git commit -m "vue: add DsTitlebar + DsRail + DsNavItem"
```

---

### Task 2: DsToolbar + DsStatusbar + DsBreadcrumb + Phase D gate

**Files:** Create `DsToolbar.vue`, `DsStatusbar.vue`, `DsBreadcrumb.vue` + three `.test.ts`; modify `vue/index.ts`.

**Interfaces:**
- `<DsToolbar title?>` → `.ds-toolbar > .ds-toolbar-title (title or `start` slot) + .ds-toolbar-spacer + default slot (end actions)`.
- `<DsStatusbar>` → `.ds-statusbar > `start` slot + .ds-statusbar-spacer + `end` slot` (segments are `.seg`, supplied by the consumer as slot content).
- `<DsBreadcrumb :items>` where `items: { label: string; href?: string }[]` → `<nav class="ds-breadcrumb">`, each item an `<a :href>` (last item a `<span class="current">`), with `<span class="sep">/</span>` between.

- [ ] **Step 1: Tests**

`DsToolbar.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsToolbar from "./DsToolbar.vue";
describe("DsToolbar", () => {
  it("renders .ds-toolbar with title, spacer, and end slot", () => {
    const w = mount(DsToolbar, { props: { title: "Runs" }, slots: { default: () => "[btn]" } });
    expect(w.find(".ds-toolbar-title").text()).toBe("Runs");
    expect(w.find(".ds-toolbar-spacer").exists()).toBe(true);
    expect(w.find(".ds-toolbar").text()).toContain("[btn]");
  });
});
```
`DsStatusbar.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsStatusbar from "./DsStatusbar.vue";
describe("DsStatusbar", () => {
  it("renders .ds-statusbar with spacer between start and end slots", () => {
    const w = mount(DsStatusbar, { slots: { start: () => "left", end: () => "right" } });
    expect(w.find(".ds-statusbar-spacer").exists()).toBe(true);
    expect(w.text()).toContain("left");
    expect(w.text()).toContain("right");
  });
});
```
`DsBreadcrumb.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsBreadcrumb from "./DsBreadcrumb.vue";
const items = [{ label: "Library", href: "#" }, { label: "Games", href: "#" }, { label: "Elden Ring" }];
describe("DsBreadcrumb", () => {
  it("renders links + separators; last item is .current (no link)", () => {
    const w = mount(DsBreadcrumb, { props: { items } });
    expect(w.findAll("nav.ds-breadcrumb a")).toHaveLength(2);
    expect(w.findAll(".sep")).toHaveLength(2);
    expect(w.find(".current").text()).toBe("Elden Ring");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`DsToolbar.vue`:
```vue
<script setup lang="ts">
defineProps<{ title?: string }>();
</script>
<template>
  <div class="ds-toolbar">
    <div v-if="title || $slots.start" class="ds-toolbar-title"><slot name="start">{{ title }}</slot></div>
    <div class="ds-toolbar-spacer"></div>
    <slot />
  </div>
</template>
```
`DsStatusbar.vue`:
```vue
<script setup lang="ts"></script>
<template>
  <div class="ds-statusbar">
    <slot name="start" />
    <div class="ds-statusbar-spacer"></div>
    <slot name="end" />
  </div>
</template>
```
`DsBreadcrumb.vue`:
```vue
<script setup lang="ts">
defineProps<{ items: { label: string; href?: string }[] }>();
</script>
<template>
  <nav class="ds-breadcrumb">
    <template v-for="(item, i) in items" :key="i">
      <span v-if="i > 0" class="sep">/</span>
      <span v-if="i === items.length - 1" class="current">{{ item.label }}</span>
      <a v-else :href="item.href">{{ item.label }}</a>
    </template>
  </nav>
</template>
```

- [ ] **Step 4: Append exports** (`DsToolbar`, `DsStatusbar`, `DsBreadcrumb`).

- [ ] **Step 5: Full Phase D gate**

Run: `npm test` → all suites pass (report totals).
Run: `npm run typecheck` → exits 0.
Run: `npm run build` → exit 0 (expected ds.js/docs.js/sortable warnings only).

- [ ] **Step 6: Commit**
```bash
git add vue/components/DsToolbar.vue vue/components/DsStatusbar.vue vue/components/DsBreadcrumb.vue vue/components/DsToolbar.test.ts vue/components/DsStatusbar.test.ts vue/components/DsBreadcrumb.test.ts vue/index.ts
git commit -m "vue: add DsToolbar + DsStatusbar + DsBreadcrumb (Phase D complete)"
```

---

## Self-Review

- **Spec coverage (Phase D):** DsTitlebar/DsRail/DsNavItem (T1), DsToolbar/DsStatusbar/DsBreadcrumb (T2). The app-shell set; completes the buildout.
- **Placeholder scan:** none — every component has full SFC + test code.
- **Type consistency:** only DsNavItem has a variant (`active`→`is-active`, cssHas-asserted). All sub-element classes (`.ds-titlebar-title`/`.ds-winbtns`/`.is-close`/`.ds-rail-spacer`/`.ds-toolbar-title`/`.ds-toolbar-spacer`/`.ds-statusbar-spacer`/`.sep`/`.current`) confirmed present in `components.css`. Window buttons emit minimize/maximize/close. Breadcrumb renders last item as `.current` (no link) with `.sep` separators — matches `pages/system.html`.
