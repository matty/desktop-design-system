# Vue Components — Phase C: Display/Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the display/content components (~21) as Vue 3 SFCs following the locked contract from Phases A/B.

**Architecture:** Trivial presentational wrappers: `<script setup lang="ts">`, no `<style>`, typed variant/tone props mapped only to real `.is-*` classes (verified by the `cssHas` helper), slots for content, `DsIcon`/icon slots for icons. Grouped into 7 multi-component tasks.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest + @vue/test-utils + happy-dom. No new deps.

## Global Constraints

- Vue 3 SFC `<script setup lang="ts">`, NO `<style>` block anywhere in `vue/`.
- A variant/tone prop maps ONLY to an `.is-*` class present in `css/components.css`. Each variant test asserts existence via `cssHas` (`import { cssHas } from "../__support__/css"`).
- Use the shared `Tone` union (`import type { Tone } from "../types"`) where a family has tone classes; restrict to the subset the CSS actually has (e.g. banner only has `is-warning`) via `Extract<Tone, ...>`.
- Markup matches the docs (structures given per component below). No invented classes; neutral grouping wrappers without a CSS rule are allowed only where needed and must be noted.
- Each component: append its export to `vue/index.ts`. No changes to `js/ds.js`, `css/`, `src/`, `pages/`. ESM, two-space indentation.
- One commit per task (a task = a group of related components + their tests). `npm test`/`npm run typecheck` stay green; final task runs `npm run build`.

## Per-component contract (applies to all)

Follow the `DsButton` exemplar: typed props via `defineProps`/`withDefaults`, variant booleans/unions → `:class` object of `.is-*`, `<slot />` for content, no `<style>`. Each component gets a focused test: renders the base `.ds-*` class + (where it has variants) asserts each variant maps to a `cssHas`-confirmed `.is-*`, + its one behavior (emit) if any.

---

### Task 1: DsCard + DsPanel

**Files:** Create `vue/components/DsCard.vue`, `DsPanel.vue`, `DsCard.test.ts`, `DsPanel.test.ts`; modify `vue/index.ts`.

**Interfaces:** `<DsCard>` → `<div class="ds-card"><slot/></div>` (no variants). `<DsPanel title?>` → `.ds-panel` > optional `.ds-panel-head` (title `<h3>` and/or `header` slot + `actions` slot) > `.ds-panel-body` > default slot.

- [ ] **Step 1: Tests**

`DsCard.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsCard from "./DsCard.vue";
describe("DsCard", () => {
  it("renders .ds-card with slot", () => {
    expect(mount(DsCard, { slots: { default: () => "Body" } }).find(".ds-card").text()).toBe("Body");
  });
});
```
`DsPanel.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsPanel from "./DsPanel.vue";
describe("DsPanel", () => {
  it("renders head with title and body with slot", () => {
    const w = mount(DsPanel, { props: { title: "Sync" }, slots: { default: () => "B" } });
    expect(w.find(".ds-panel-head").text()).toContain("Sync");
    expect(w.find(".ds-panel-body").text()).toBe("B");
  });
  it("omits head when no title/header slot", () => {
    const w = mount(DsPanel, { slots: { default: () => "B" } });
    expect(w.find(".ds-panel-head").exists()).toBe(false);
  });
});
```

- [ ] **Step 2: Run → FAIL** (`npm test -- DsCard DsPanel`).

- [ ] **Step 3: Implement**

`DsCard.vue`:
```vue
<script setup lang="ts"></script>
<template>
  <div class="ds-card"><slot /></div>
</template>
```
`DsPanel.vue`:
```vue
<script setup lang="ts">
import { useSlots } from "vue";
defineProps<{ title?: string }>();
const slots = useSlots();
</script>
<template>
  <div class="ds-panel">
    <div v-if="title || slots.header || slots.actions" class="ds-panel-head">
      <slot name="header"><h3 v-if="title">{{ title }}</h3></slot>
      <slot name="actions" />
    </div>
    <div class="ds-panel-body"><slot /></div>
  </div>
</template>
```

- [ ] **Step 4: Append exports**
```ts
export { default as DsCard } from "./components/DsCard.vue";
export { default as DsPanel } from "./components/DsPanel.vue";
```
- [ ] **Step 5: Verify** `npm test -- DsCard DsPanel` pass; `npm run typecheck` 0.
- [ ] **Step 6: Commit**
```bash
git add vue/components/DsCard.vue vue/components/DsPanel.vue vue/components/DsCard.test.ts vue/components/DsPanel.test.ts vue/index.ts
git commit -m "vue: add DsCard + DsPanel"
```

---

### Task 2: DsBadge + DsPill + DsKbd

**Files:** Create the three `.vue` + three `.test.ts`; modify `vue/index.ts`.

**Interfaces:** `<DsBadge tone? solid?>` → `<span class="ds-badge">` (+`is-info/success/warning/danger`, `is-solid`), icon slot + default. `<DsPill>` → `<span class="ds-pill"><slot/></span>`. `<DsKbd>` → `<kbd class="ds-kbd"><slot/></kbd>`.

- [ ] **Step 1: Tests**

`DsBadge.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsBadge from "./DsBadge.vue";
import { cssHas } from "../__support__/css";
describe("DsBadge", () => {
  it("renders .ds-badge with slot", () => {
    expect(mount(DsBadge, { slots: { default: () => "New" } }).find(".ds-badge").text()).toBe("New");
  });
  it("maps tone + solid to real classes", () => {
    for (const c of ["is-info", "is-success", "is-warning", "is-danger", "is-solid"]) expect(cssHas(c)).toBe(true);
    expect(mount(DsBadge, { props: { tone: "danger" } }).find(".ds-badge").classes()).toContain("is-danger");
    expect(mount(DsBadge, { props: { solid: true } }).find(".ds-badge").classes()).toContain("is-solid");
  });
});
```
`DsPill.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsPill from "./DsPill.vue";
describe("DsPill", () => {
  it("renders .ds-pill with slot", () => {
    expect(mount(DsPill, { slots: { default: () => "v1" } }).find(".ds-pill").text()).toBe("v1");
  });
});
```
`DsKbd.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsKbd from "./DsKbd.vue";
describe("DsKbd", () => {
  it("renders kbd.ds-kbd with slot", () => {
    expect(mount(DsKbd, { slots: { default: () => "Ctrl" } }).find("kbd.ds-kbd").text()).toBe("Ctrl");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`DsBadge.vue`:
```vue
<script setup lang="ts">
import { computed } from "vue";
import type { Tone } from "../types";
const props = withDefaults(defineProps<{ tone?: Tone; solid?: boolean }>(), { solid: false });
const classes = computed(() => ({
  "is-info": props.tone === "info",
  "is-success": props.tone === "success",
  "is-warning": props.tone === "warning",
  "is-danger": props.tone === "danger",
  "is-solid": props.solid
}));
</script>
<template>
  <span class="ds-badge" :class="classes"><slot name="icon" /><slot /></span>
</template>
```
`DsPill.vue`:
```vue
<script setup lang="ts"></script>
<template><span class="ds-pill"><slot /></span></template>
```
`DsKbd.vue`:
```vue
<script setup lang="ts"></script>
<template><kbd class="ds-kbd"><slot /></kbd></template>
```

- [ ] **Step 4: Append exports** (`DsBadge`, `DsPill`, `DsKbd`).
- [ ] **Step 5: Verify** `npm test -- DsBadge DsPill DsKbd` pass; typecheck 0.
- [ ] **Step 6: Commit** `git commit -m "vue: add DsBadge + DsPill + DsKbd"` (add the 6 files + index).

---

### Task 3: DsChip + DsStatus + DsAvatar

**Files:** three `.vue` + three `.test.ts`; modify `vue/index.ts`.

**Interfaces:**
- `<DsChip removable?>` → `<span class="ds-chip"><slot/><span v-if="removable" class="ds-chip-x" @click>×</span></span>`; emits `remove`.
- `<DsStatus state?>` → `<span class="ds-status" :class="is-{state}"><span class="ds-dot"></span><slot/></span>`; state ∈ on/off/busy/error/info/success/warning.
- `<DsAvatar size? src? alt?>` → `<span class="ds-avatar">` (+`is-sm`/`is-lg`); renders `<img>` if `src` else default slot (initials).

- [ ] **Step 1: Tests**

`DsChip.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsChip from "./DsChip.vue";
describe("DsChip", () => {
  it("renders .ds-chip with slot; no x unless removable", () => {
    expect(mount(DsChip, { slots: { default: () => "Tag" } }).find(".ds-chip-x").exists()).toBe(false);
  });
  it("emits remove when x clicked", async () => {
    const w = mount(DsChip, { props: { removable: true }, slots: { default: () => "Tag" } });
    await w.find(".ds-chip-x").trigger("click");
    expect(w.emitted("remove")).toBeTruthy();
  });
});
```
`DsStatus.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsStatus from "./DsStatus.vue";
import { cssHas } from "../__support__/css";
describe("DsStatus", () => {
  it("renders .ds-status with a dot + slot and maps state", () => {
    for (const c of ["is-on", "is-off", "is-busy", "is-error", "is-success", "is-warning", "is-info"]) expect(cssHas(c)).toBe(true);
    const w = mount(DsStatus, { props: { state: "on" }, slots: { default: () => "Online" } });
    expect(w.find(".ds-status").classes()).toContain("is-on");
    expect(w.find(".ds-dot").exists()).toBe(true);
    expect(w.find(".ds-status").text()).toContain("Online");
  });
});
```
`DsAvatar.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsAvatar from "./DsAvatar.vue";
import { cssHas } from "../__support__/css";
describe("DsAvatar", () => {
  it("renders .ds-avatar with initials slot and maps size", () => {
    for (const c of ["is-sm", "is-lg"]) expect(cssHas(c)).toBe(true);
    expect(mount(DsAvatar, { props: { size: "lg" }, slots: { default: () => "JR" } }).find(".ds-avatar").classes()).toContain("is-lg");
  });
  it("renders an img when src is given", () => {
    expect(mount(DsAvatar, { props: { src: "x.png", alt: "Jordan" } }).find("img").attributes("src")).toBe("x.png");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`DsChip.vue`:
```vue
<script setup lang="ts">
withDefaults(defineProps<{ removable?: boolean }>(), { removable: false });
const emit = defineEmits<{ remove: [] }>();
</script>
<template>
  <span class="ds-chip"><slot /><span v-if="removable" class="ds-chip-x" @click="emit('remove')">×</span></span>
</template>
```
`DsStatus.vue`:
```vue
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ state?: "on" | "off" | "busy" | "error" | "info" | "success" | "warning" }>();
const classes = computed(() => (props.state ? { [`is-${props.state}`]: true } : {}));
</script>
<template>
  <span class="ds-status" :class="classes"><span class="ds-dot"></span><slot /></span>
</template>
```
`DsAvatar.vue`:
```vue
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ size?: "sm" | "lg"; src?: string; alt?: string }>();
const classes = computed(() => ({ "is-sm": props.size === "sm", "is-lg": props.size === "lg" }));
</script>
<template>
  <span class="ds-avatar" :class="classes">
    <img v-if="src" :src="src" :alt="alt" />
    <slot v-else />
  </span>
</template>
```

- [ ] **Step 4: Append exports** (`DsChip`, `DsStatus`, `DsAvatar`).
- [ ] **Step 5: Verify** pass; typecheck 0.
- [ ] **Step 6: Commit** `git commit -m "vue: add DsChip + DsStatus + DsAvatar"`.

---

### Task 4: DsAlert + DsBanner + DsEmpty

**Files:** three `.vue` + three `.test.ts`; modify `vue/index.ts`.

**Interfaces:**
- `<DsAlert tone? dismissible?>` → `<div class="ds-alert" :class="is-{tone}"><span class="ds-alert-ico"><slot name="icon"/></span><div><slot/></div><button v-if="dismissible" @click emit close>…</button></div>`; tone ∈ info/success/warning/danger.
- `<DsBanner tone?>` → `<div class="ds-banner" :class="is-warning when tone='warning'"><span class="ds-banner-ico"><slot name="icon"/></span><slot/><span class="ds-banner-spacer"></span><slot name="actions"/></div>`. (Banner CSS only has `is-warning`.)
- `<DsEmpty>` → `<div class="ds-empty"><div class="ds-empty-ico"><slot name="icon"/></div><slot/></div>`.

- [ ] **Step 1: Tests**

`DsAlert.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsAlert from "./DsAlert.vue";
import { cssHas } from "../__support__/css";
describe("DsAlert", () => {
  it("renders .ds-alert with ico + slot and maps tone", () => {
    for (const c of ["is-info", "is-success", "is-warning", "is-danger"]) expect(cssHas(c)).toBe(true);
    const w = mount(DsAlert, { props: { tone: "danger" }, slots: { default: () => "Failed" } });
    expect(w.find(".ds-alert").classes()).toContain("is-danger");
    expect(w.find(".ds-alert-ico").exists()).toBe(true);
    expect(w.text()).toContain("Failed");
  });
  it("emits close when dismissible button clicked", async () => {
    const w = mount(DsAlert, { props: { dismissible: true } });
    await w.find("button").trigger("click");
    expect(w.emitted("close")).toBeTruthy();
  });
});
```
`DsBanner.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsBanner from "./DsBanner.vue";
import { cssHas } from "../__support__/css";
describe("DsBanner", () => {
  it("renders .ds-banner with ico/spacer and warning tone", () => {
    expect(cssHas("is-warning")).toBe(true);
    const w = mount(DsBanner, { props: { tone: "warning" }, slots: { default: () => "Heads up" } });
    expect(w.find(".ds-banner").classes()).toContain("is-warning");
    expect(w.find(".ds-banner-ico").exists()).toBe(true);
    expect(w.find(".ds-banner-spacer").exists()).toBe(true);
  });
});
```
`DsEmpty.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsEmpty from "./DsEmpty.vue";
describe("DsEmpty", () => {
  it("renders .ds-empty with ico + slot", () => {
    const w = mount(DsEmpty, { slots: { default: () => "Nothing here" } });
    expect(w.find(".ds-empty-ico").exists()).toBe(true);
    expect(w.find(".ds-empty").text()).toContain("Nothing here");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`DsAlert.vue`:
```vue
<script setup lang="ts">
import { computed } from "vue";
import type { Tone } from "../types";
const props = withDefaults(defineProps<{ tone?: Tone; dismissible?: boolean }>(), { dismissible: false });
const emit = defineEmits<{ close: [] }>();
const classes = computed(() => ({
  "is-info": props.tone === "info",
  "is-success": props.tone === "success",
  "is-warning": props.tone === "warning",
  "is-danger": props.tone === "danger"
}));
</script>
<template>
  <div class="ds-alert" :class="classes" role="alert">
    <span class="ds-alert-ico"><slot name="icon" /></span>
    <div><slot /></div>
    <button v-if="dismissible" type="button" aria-label="Dismiss" @click="emit('close')">×</button>
  </div>
</template>
```
`DsBanner.vue`:
```vue
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ tone?: "warning" }>();
const classes = computed(() => ({ "is-warning": props.tone === "warning" }));
</script>
<template>
  <div class="ds-banner" :class="classes">
    <span class="ds-banner-ico"><slot name="icon" /></span>
    <slot />
    <span class="ds-banner-spacer"></span>
    <slot name="actions" />
  </div>
</template>
```
`DsEmpty.vue`:
```vue
<script setup lang="ts"></script>
<template>
  <div class="ds-empty">
    <div class="ds-empty-ico"><slot name="icon" /></div>
    <slot />
  </div>
</template>
```

- [ ] **Step 4: Append exports** (`DsAlert`, `DsBanner`, `DsEmpty`).
- [ ] **Step 5: Verify** pass; typecheck 0.
- [ ] **Step 6: Commit** `git commit -m "vue: add DsAlert + DsBanner + DsEmpty"`.

---

### Task 5: DsDivider + DsSkeleton + DsSpinner

**Files:** three `.vue` + three `.test.ts`; modify `vue/index.ts`.

**Interfaces:**
- `<DsDivider vertical? label?>` → if `label`: `<div class="ds-divider-label"><slot>{{label}}</slot></div>`; else `<hr class="ds-divider" :class="is-vertical">`.
- `<DsSkeleton>` → `<div class="ds-skeleton"></div>` (size via attrs/style passthrough).
- `<DsSpinner large?>` → `<span class="ds-spinner" :class="is-lg">`.

- [ ] **Step 1: Tests**

`DsDivider.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsDivider from "./DsDivider.vue";
import { cssHas } from "../__support__/css";
describe("DsDivider", () => {
  it("renders hr.ds-divider; vertical maps is-vertical", () => {
    expect(cssHas("is-vertical")).toBe(true);
    expect(mount(DsDivider).find("hr.ds-divider").exists()).toBe(true);
    expect(mount(DsDivider, { props: { vertical: true } }).find("hr").classes()).toContain("is-vertical");
  });
  it("renders .ds-divider-label when label given", () => {
    expect(mount(DsDivider, { props: { label: "or" } }).find(".ds-divider-label").text()).toBe("or");
  });
});
```
`DsSkeleton.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSkeleton from "./DsSkeleton.vue";
describe("DsSkeleton", () => {
  it("renders .ds-skeleton", () => {
    expect(mount(DsSkeleton).find(".ds-skeleton").exists()).toBe(true);
  });
});
```
`DsSpinner.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSpinner from "./DsSpinner.vue";
import { cssHas } from "../__support__/css";
describe("DsSpinner", () => {
  it("renders .ds-spinner; large maps is-lg", () => {
    expect(cssHas("is-lg")).toBe(true);
    expect(mount(DsSpinner).find(".ds-spinner").exists()).toBe(true);
    expect(mount(DsSpinner, { props: { large: true } }).find(".ds-spinner").classes()).toContain("is-lg");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`DsDivider.vue`:
```vue
<script setup lang="ts">
defineProps<{ vertical?: boolean; label?: string }>();
</script>
<template>
  <div v-if="label" class="ds-divider-label"><slot>{{ label }}</slot></div>
  <hr v-else class="ds-divider" :class="{ 'is-vertical': vertical }" />
</template>
```
`DsSkeleton.vue`:
```vue
<script setup lang="ts"></script>
<template><div class="ds-skeleton"></div></template>
```
`DsSpinner.vue`:
```vue
<script setup lang="ts">
defineProps<{ large?: boolean }>();
</script>
<template><span class="ds-spinner" :class="{ 'is-lg': large }"></span></template>
```

- [ ] **Step 4: Append exports** (`DsDivider`, `DsSkeleton`, `DsSpinner`).
- [ ] **Step 5: Verify** pass; typecheck 0.
- [ ] **Step 6: Commit** `git commit -m "vue: add DsDivider + DsSkeleton + DsSpinner"`.

---

### Task 6: DsMeter + DsProgress + DsTable

**Files:** three `.vue` + three `.test.ts`; modify `vue/index.ts`.

**Interfaces:**
- `<DsMeter :value :max? label? display?>` → `<div class="ds-meter"><span>{{label}}</span><div class="track"><div class="fill" :style="width%"></div></div><span>{{display ?? pct}}</span></div>`.
- `<DsProgress :value :max?>` → `<div class="ds-progress"><div class="bar" :style="width%"></div></div>`.
- `<DsTable>` → `<table class="ds-table"><slot/></table>` (slot-based; consumer provides thead/tbody).

(`.track`/`.fill`/`.bar` are sub-element classes scoped under `.ds-meter`/`.ds-progress` in components.css — confirmed by the docs markup.)

- [ ] **Step 1: Tests**

`DsMeter.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsMeter from "./DsMeter.vue";
describe("DsMeter", () => {
  it("renders .ds-meter with a fill width from value/max", () => {
    const w = mount(DsMeter, { props: { value: 30, max: 60, label: "CPU" } });
    expect(w.find(".ds-meter").exists()).toBe(true);
    expect((w.find(".fill").element as HTMLElement).style.width).toBe("50%");
    expect(w.text()).toContain("CPU");
  });
});
```
`DsProgress.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsProgress from "./DsProgress.vue";
describe("DsProgress", () => {
  it("renders .ds-progress with a bar width from value", () => {
    const w = mount(DsProgress, { props: { value: 64 } });
    expect((w.find(".bar").element as HTMLElement).style.width).toBe("64%");
  });
});
```
`DsTable.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsTable from "./DsTable.vue";
describe("DsTable", () => {
  it("renders table.ds-table with slotted rows", () => {
    const w = mount(DsTable, { slots: { default: () => h("tbody", [h("tr", [h("td", "A")])]) } });
    expect(w.find("table.ds-table tbody td").text()).toBe("A");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`DsMeter.vue`:
```vue
<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(defineProps<{ value: number; max?: number; label?: string; display?: string }>(), { max: 100 });
const pct = computed(() => Math.max(0, Math.min(100, (props.value / props.max) * 100)));
</script>
<template>
  <div class="ds-meter">
    <span>{{ label }}</span>
    <div class="track"><div class="fill" :style="{ width: pct + '%' }"></div></div>
    <span>{{ display ?? Math.round(pct) + '%' }}</span>
  </div>
</template>
```
`DsProgress.vue`:
```vue
<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(defineProps<{ value: number; max?: number }>(), { max: 100 });
const pct = computed(() => Math.max(0, Math.min(100, (props.value / props.max) * 100)));
</script>
<template>
  <div class="ds-progress"><div class="bar" :style="{ width: pct + '%' }"></div></div>
</template>
```
`DsTable.vue`:
```vue
<script setup lang="ts"></script>
<template><table class="ds-table"><slot /></table></template>
```

- [ ] **Step 4: Append exports** (`DsMeter`, `DsProgress`, `DsTable`).
- [ ] **Step 5: Verify** pass; typecheck 0.
- [ ] **Step 6: Commit** `git commit -m "vue: add DsMeter + DsProgress + DsTable"`.

---

### Task 7: DsDescriptionList + DsFacts/DsFact + DsList/DsListItem + DsRow + Phase C gate

**Files:** Create `DsDescriptionList.vue`, `DsFacts.vue`, `DsFact.vue`, `DsList.vue`, `DsListItem.vue`, `DsRow.vue` + tests; modify `vue/index.ts`.

**Interfaces:**
- `<DsDescriptionList>` → `<dl class="ds-dl"><slot/></dl>` (consumer provides dt/dd).
- `<DsFacts cols?>` → `<div class="ds-facts" :class="cols && `cols-${cols}`"><slot/></div>`; `<DsFact term value?>` → `<div class="ds-fact"><div class="k">{{term}}</div><div class="v"><slot>{{value}}</slot></div></div>`. (`.cols-2` etc. and `.k`/`.v` are docs markup classes scoped under `.ds-facts`/`.ds-fact`.)
- `<DsList seamless?>` → `<ul class="ds-list" :class="is-seamless"><slot/></ul>`; `<DsListItem selected?>` → `<li class="ds-list-item" :class="is-selected"><slot/></li>`.
- `<DsRow title? description?>` → `<div class="ds-row"><div class="ds-row-text"><b>{{title}}</b><span>{{description}}</span></div><div class="ds-row-control"><slot/></div></div>`.

- [ ] **Step 1: Tests**

`DsDescriptionList.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsDescriptionList from "./DsDescriptionList.vue";
describe("DsDescriptionList", () => {
  it("renders dl.ds-dl with slot", () => {
    const w = mount(DsDescriptionList, { slots: { default: () => [h("dt", "K"), h("dd", "V")] } });
    expect(w.find("dl.ds-dl dt").text()).toBe("K");
  });
});
```
`DsFacts.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsFacts from "./DsFacts.vue";
import DsFact from "./DsFact.vue";
describe("DsFacts", () => {
  it("renders .ds-facts (cols) wrapping .ds-fact k/v", () => {
    const w = mount(DsFacts, { props: { cols: 2 }, slots: { default: () => h(DsFact, { term: "Version", value: "2.4.0" }) } });
    expect(w.find(".ds-facts").classes()).toContain("cols-2");
    expect(w.find(".ds-fact .k").text()).toBe("Version");
    expect(w.find(".ds-fact .v").text()).toBe("2.4.0");
  });
});
```
`DsList.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsList from "./DsList.vue";
import DsListItem from "./DsListItem.vue";
import { cssHas } from "../__support__/css";
describe("DsList", () => {
  it("renders ul.ds-list with items; seamless + selected map classes", () => {
    for (const c of ["is-seamless", "is-selected"]) expect(cssHas(c)).toBe(true);
    const w = mount(DsList, { props: { seamless: true }, slots: { default: () => h(DsListItem, { selected: true }, () => "One") } });
    expect(w.find("ul.ds-list").classes()).toContain("is-seamless");
    expect(w.find("li.ds-list-item").classes()).toContain("is-selected");
    expect(w.find("li.ds-list-item").text()).toBe("One");
  });
});
```
`DsRow.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsRow from "./DsRow.vue";
describe("DsRow", () => {
  it("renders .ds-row with text (title/description) + control slot", () => {
    const w = mount(DsRow, { props: { title: "Sync", description: "Keep devices aligned" }, slots: { default: () => "[switch]" } });
    expect(w.find(".ds-row-text").text()).toContain("Sync");
    expect(w.find(".ds-row-text").text()).toContain("Keep devices aligned");
    expect(w.find(".ds-row-control").text()).toBe("[switch]");
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`DsDescriptionList.vue`:
```vue
<script setup lang="ts"></script>
<template><dl class="ds-dl"><slot /></dl></template>
```
`DsFacts.vue`:
```vue
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ cols?: number }>();
const classes = computed(() => (props.cols ? { [`cols-${props.cols}`]: true } : {}));
</script>
<template><div class="ds-facts" :class="classes"><slot /></div></template>
```
`DsFact.vue`:
```vue
<script setup lang="ts">
defineProps<{ term: string; value?: string }>();
</script>
<template>
  <div class="ds-fact"><div class="k">{{ term }}</div><div class="v"><slot>{{ value }}</slot></div></div>
</template>
```
`DsList.vue`:
```vue
<script setup lang="ts">
defineProps<{ seamless?: boolean }>();
</script>
<template><ul class="ds-list" :class="{ 'is-seamless': seamless }"><slot /></ul></template>
```
`DsListItem.vue`:
```vue
<script setup lang="ts">
defineProps<{ selected?: boolean }>();
</script>
<template><li class="ds-list-item" :class="{ 'is-selected': selected }"><slot /></li></template>
```
`DsRow.vue`:
```vue
<script setup lang="ts">
defineProps<{ title?: string; description?: string }>();
</script>
<template>
  <div class="ds-row">
    <div class="ds-row-text"><b>{{ title }}</b><span>{{ description }}</span></div>
    <div class="ds-row-control"><slot /></div>
  </div>
</template>
```

- [ ] **Step 4: Append exports** (`DsDescriptionList`, `DsFacts`, `DsFact`, `DsList`, `DsListItem`, `DsRow`).

- [ ] **Step 5: Full Phase C gate**

Run: `npm test` → all suites pass (report totals).
Run: `npm run typecheck` → exits 0.
Run: `npm run build` → exit 0 (expected ds.js/docs.js/sortable warnings only).

- [ ] **Step 6: Commit** `git commit -m "vue: add DsDescriptionList + DsFacts/DsFact + DsList/DsListItem + DsRow (Phase C complete)"`.

---

## Self-Review

- **Spec coverage (Phase C):** card/panel (T1), badge/pill/kbd (T2), chip/status/avatar (T3), alert/banner/empty (T4), divider/skeleton/spinner (T5), meter/progress/table (T6), dl/facts/list/row (T7). 21 components. DsSteps and DsTip intentionally excluded (not components — recorded in the ledger).
- **Placeholder scan:** none — every component has full SFC + test code.
- **Type consistency:** `Tone` imported for badge/alert; banner restricted to `"warning"` (its only CSS tone); `is-*` classes used are all confirmed present in `components.css` and asserted via `cssHas`. Sub-element classes (`.track`/`.fill`/`.bar`/`.k`/`.v`/`cols-*`) come from the docs markup, scoped under their parents — not variant `.is-*`, so no `cssHas` assertion needed for them.
- **a11y:** `role="alert"` on alert, dismiss `aria-label`, status dot present. DsTable slot-based per spec.
