# Components Batch 4 (DatePicker + Calendar) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add **DsCalendar** (single-month, single-date grid) and **DsDatePicker** (text field that opens a calendar in a popover), single-date MVP, with CSS, Vue, story, tests, docs examples, and a green coverage gate.

**Architecture:** DsCalendar is a self-contained month grid driven by the built-in `Date` (no library), Monday-first, ISO `YYYY-MM-DD` values, `v-model`. DsDatePicker composes a read-only `.ds-input` trigger inside a `.ds-popover-anchor` (reusing the popover CSS + `useDismiss`) that opens a `.ds-popover` containing `DsCalendar`.

**Tech Stack:** Vue 3.5 (`<script setup>`, typed props/emits/`withDefaults`), built-in `Date`, Vitest + `@vue/test-utils`, Storybook CSF3, the reference/coverage tooling.

## Global Constraints

- SFCs `<script setup lang="ts">`; typed props/emits; v-model via `update:modelValue`.
- CSS uses `tokens.css` vars only (`--surface`, `--border*`, `--text*`, `--fz-*`, `--fw-*`, `--radius*`, `--hover`, `--fill*`, `--accent*`, `--space-*`). No hard-coded colors; structural literals OK.
- A component's emitted `.ds-*` classes must be real primitives — every new class needs a CSS rule.
- Dates are plain ISO `YYYY-MM-DD` strings; displayed month is `YYYY-MM`. **Monday-first** weeks. No date library.
- Each component: exported from `vue/index.ts`, has `DsX.stories.ts` and `DsX.test.ts`.
- Both interactive: each gets a `<template data-vue>` snippet in its docs example AND joins `DATA_VUE_EXPECTED` (update the sorted equality test in `tools/coverage.test.mjs`).
- After each task: `npm run reference:build` (commit regenerated `reference/*`), `npm run reference:lint` (clean), `npm run typecheck` (0), `node tools/coverage.mjs` (all `ok`).
- Storybook `title` groups: `Foundation`/`Form`/`Display`/`Shell`/`Interactive`. Gate stays warn-only.
- Title strings computed from a fixed month-name array (deterministic — do NOT use `toLocaleString`, which is locale/environment dependent and would make tests flaky).

---

### Task 1: DsCalendar

Single-month date grid (interactive). New primitive `ds-calendar` (+ parts).

**Files:**
- Modify: `css/components.css`, `vue/index.ts`, `pages/forms.html`, `tools/coverage-core.mjs`, `tools/coverage.test.mjs`
- Create: `vue/components/DsCalendar.vue`, `DsCalendar.test.ts`, `DsCalendar.stories.ts`
- Regenerate: `reference/*`

**Interfaces:**
- Produces: `DsCalendar` — props `{ modelValue?: string | null; month?: string }` (`modelValue` = selected ISO date or null; `month` = displayed `YYYY-MM`, optional `v-model:month`), emits `update:modelValue: [string]` and `update:month: [string]`. Renders `.ds-calendar` > `.ds-calendar-head`(`.ds-calendar-title` + two `.ds-calendar-nav`) + `.ds-calendar-grid`(7× `.ds-calendar-weekday` + 42× `.ds-calendar-day` with `.is-today`/`.is-selected`/`.is-outside`). 42 cells (6 weeks), Monday-first. Arrow keys move the focused day (±1 / ±7), Enter selects; click selects.

- [ ] **Step 1: Add the CSS primitive**

```css
.ds-calendar { width:260px; padding:10px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); }
.ds-calendar-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.ds-calendar-title { font-size:var(--fz-sm); font-weight:var(--fw-semibold); }
.ds-calendar-nav { width:26px; height:26px; display:grid; place-items:center; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--fill); color:var(--text-2); cursor:default; }
.ds-calendar-nav:hover { background:var(--fill-hover); color:var(--text); }
.ds-calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
.ds-calendar-weekday { text-align:center; font-size:var(--fz-2xs); color:var(--text-3); padding:4px 0; text-transform:uppercase; }
.ds-calendar-day { aspect-ratio:1; display:grid; place-items:center; border:0; background:transparent; border-radius:var(--radius-sm); font-size:var(--fz-sm); color:var(--text-2); cursor:default; }
.ds-calendar-day:hover { background:var(--hover); color:var(--text); }
.ds-calendar-day.is-outside { color:var(--text-3); opacity:.5; }
.ds-calendar-day.is-today { font-weight:var(--fw-semibold); color:var(--text); }
.ds-calendar-day.is-selected { background:var(--accent); color:var(--accent-ink); }
```

- [ ] **Step 2: Write the failing test**

Create `vue/components/DsCalendar.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";

import DsCalendar from "./DsCalendar.vue";

describe("DsCalendar", () => {
  it("renders Monday-first weekday headers and 42 day cells", () => {
    const w = mount(DsCalendar, { props: { month: "2026-06" } });
    expect(w.findAll(".ds-calendar-weekday").map((d) => d.text())).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(w.findAll(".ds-calendar-day")).toHaveLength(42);
  });

  it("shows the correct month title", () => {
    const w = mount(DsCalendar, { props: { month: "2026-06" } });
    expect(w.find(".ds-calendar-title").text()).toBe("June 2026");
  });

  it("places June 1 2026 (a Monday) in the first column", () => {
    // June 1 2026 is a Monday → first cell of the grid is the 1st (not an outside day)
    const w = mount(DsCalendar, { props: { month: "2026-06" } });
    const cells = w.findAll(".ds-calendar-day");
    expect(cells[0].text()).toBe("1");
    expect(cells[0].classes()).not.toContain("is-outside");
  });

  it("marks the selected date", () => {
    const w = mount(DsCalendar, { props: { month: "2026-06", modelValue: "2026-06-15" } });
    const sel = w.find(".ds-calendar-day.is-selected");
    expect(sel.text()).toBe("15");
  });

  it("emits update:modelValue with ISO on day click", async () => {
    const w = mount(DsCalendar, { props: { month: "2026-06" } });
    const cells = w.findAll(".ds-calendar-day");
    await cells[0].trigger("click"); // June 1
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual(["2026-06-01"]);
  });

  it("prev/next change the visible month and emit update:month", async () => {
    const w = mount(DsCalendar, { props: { month: "2026-06" } });
    const navs = w.findAll(".ds-calendar-nav");
    await navs[0].trigger("click"); // prev → May
    expect(w.find(".ds-calendar-title").text()).toBe("May 2026");
    expect(w.emitted("update:month")!.at(-1)).toEqual(["2026-05"]);
    await navs[1].trigger("click"); // next → June
    await navs[1].trigger("click"); // next → July
    expect(w.find(".ds-calendar-title").text()).toBe("July 2026");
  });

  it("marks days from adjacent months as outside", () => {
    // July 2026 starts on a Wednesday → first two cells (Mon, Tue) are from June
    const w = mount(DsCalendar, { props: { month: "2026-07" } });
    const cells = w.findAll(".ds-calendar-day");
    expect(cells[0].classes()).toContain("is-outside");
    expect(cells[0].text()).toBe("29"); // June 29
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run vue/components/DsCalendar.test.ts`
Expected: FAIL — cannot resolve `./DsCalendar.vue`.

- [ ] **Step 4: Implement and export**

Create `vue/components/DsCalendar.vue`:

```vue
<script setup lang="ts">
import { ref, computed, watch } from "vue";

const props = withDefaults(
  defineProps<{ modelValue?: string | null; month?: string }>(),
  { modelValue: null }
);
const emit = defineEmits<{ "update:modelValue": [string]; "update:month": [string] }>();

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function isoOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function monthOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

const fallbackMonth = props.month ?? (props.modelValue ? props.modelValue.slice(0, 7) : monthOf(new Date()));
const internalMonth = ref(fallbackMonth);
watch(() => props.month, (m) => { if (m) internalMonth.value = m; });

const view = computed(() => {
  const [y, m] = internalMonth.value.split("-").map(Number);
  return { year: y, month: m - 1 }; // month: 0-based
});
const title = computed(() => `${MONTHS[view.value.month]} ${view.value.year}`);

const todayIso = isoOf(new Date());

const cells = computed(() => {
  const { year, month } = view.value;
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday-first: Mon=0 … Sun=6
  const start = new Date(year, month, 1 - offset);
  const out: { iso: string; day: number; outside: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    out.push({ iso: isoOf(d), day: d.getDate(), outside: d.getMonth() !== month });
  }
  return out;
});

const focusedIndex = ref(0);
watch(
  cells,
  (cs) => {
    const selIdx = props.modelValue ? cs.findIndex((c) => c.iso === props.modelValue) : -1;
    const todayIdx = cs.findIndex((c) => c.iso === todayIso && !c.outside);
    const firstInMonth = cs.findIndex((c) => !c.outside);
    focusedIndex.value = selIdx >= 0 ? selIdx : todayIdx >= 0 ? todayIdx : firstInMonth;
  },
  { immediate: true }
);

function setMonth(delta: number) {
  const d = new Date(view.value.year, view.value.month + delta, 1);
  internalMonth.value = monthOf(d);
  emit("update:month", internalMonth.value);
}
function pick(iso: string) {
  emit("update:modelValue", iso);
}

function onKey(e: KeyboardEvent) {
  const map: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
  if (e.key in map) {
    e.preventDefault();
    const next = focusedIndex.value + map[e.key];
    if (next >= 0 && next < 42) focusedIndex.value = next;
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    pick(cells.value[focusedIndex.value].iso);
  }
}
</script>

<template>
  <div class="ds-calendar">
    <div class="ds-calendar-head">
      <button type="button" class="ds-calendar-nav" aria-label="Previous month" @click="setMonth(-1)">‹</button>
      <span class="ds-calendar-title">{{ title }}</span>
      <button type="button" class="ds-calendar-nav" aria-label="Next month" @click="setMonth(1)">›</button>
    </div>
    <div class="ds-calendar-grid" role="grid" @keydown="onKey">
      <span v-for="wd in WEEKDAYS" :key="wd" class="ds-calendar-weekday">{{ wd }}</span>
      <button
        v-for="(c, i) in cells"
        :key="c.iso"
        type="button"
        class="ds-calendar-day"
        :class="{ 'is-outside': c.outside, 'is-today': c.iso === todayIso, 'is-selected': c.iso === modelValue }"
        :tabindex="i === focusedIndex ? 0 : -1"
        :aria-selected="c.iso === modelValue"
        @click="pick(c.iso)"
      >{{ c.day }}</button>
    </div>
  </div>
</template>
```

In `vue/index.ts`, add `export { default as DsCalendar } from "./components/DsCalendar.vue";`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run vue/components/DsCalendar.test.ts`
Expected: PASS (all seven). The date assertions (June 1 2026 = Monday; July 2026 starts Wednesday) are real calendar facts — if one fails, the Monday-first offset math is wrong, not the test.

- [ ] **Step 6: Add the story**

Create `vue/components/DsCalendar.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsCalendar from "./DsCalendar.vue";

const meta: Meta<typeof DsCalendar> = {
  title: "Form/DsCalendar",
  component: DsCalendar,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsCalendar },
    setup: () => { const value = ref(args.modelValue ?? null); return { args, value }; },
    template: `<DsCalendar v-bind="args" :model-value="value" @update:model-value="value = $event" />`
  })
};
export default meta;
type Story = StoryObj<typeof DsCalendar>;

export const Default: Story = { args: { month: "2026-06" } };
export const WithSelection: Story = { args: { month: "2026-06", modelValue: "2026-06-15" } };
```

- [ ] **Step 7: Add the docs example + Vue snippet**

In `pages/forms.html`, add a static calendar (a representative month grid; keep it short — a partial grid is fine for the static preview as long as the classes appear):

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-calendar">
      <div class="ds-calendar-head">
        <button class="ds-calendar-nav" aria-label="Previous month">‹</button>
        <span class="ds-calendar-title">June 2026</span>
        <button class="ds-calendar-nav" aria-label="Next month">›</button>
      </div>
      <div class="ds-calendar-grid" role="grid">
        <span class="ds-calendar-weekday">Mon</span><span class="ds-calendar-weekday">Tue</span><span class="ds-calendar-weekday">Wed</span><span class="ds-calendar-weekday">Thu</span><span class="ds-calendar-weekday">Fri</span><span class="ds-calendar-weekday">Sat</span><span class="ds-calendar-weekday">Sun</span>
        <button class="ds-calendar-day">1</button><button class="ds-calendar-day">2</button><button class="ds-calendar-day is-today">3</button><button class="ds-calendar-day">4</button><button class="ds-calendar-day">5</button><button class="ds-calendar-day">6</button><button class="ds-calendar-day">7</button>
        <button class="ds-calendar-day">8</button><button class="ds-calendar-day">9</button><button class="ds-calendar-day">10</button><button class="ds-calendar-day">11</button><button class="ds-calendar-day">12</button><button class="ds-calendar-day">13</button><button class="ds-calendar-day">14</button>
        <button class="ds-calendar-day is-selected">15</button><button class="ds-calendar-day">16</button><button class="ds-calendar-day">17</button><button class="ds-calendar-day">18</button><button class="ds-calendar-day">19</button><button class="ds-calendar-day">20</button><button class="ds-calendar-day">21</button>
      </div>
    </div>
  </div>
  <template data-vue>
<DsCalendar v-model="date" month="2026-06" />
  </template>
  <div class="example-caption">Month grid with <code>.ds-calendar</code>.</div>
</div>
```

- [ ] **Step 8: Add to the gate's interactive set**

In `tools/coverage-core.mjs`, add `"DsCalendar"` to `DATA_VUE_EXPECTED`. Update the `coverage.test.mjs` equality assertion (sorted).

- [ ] **Step 9: Regenerate + verify**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && npx vitest run tools/coverage.test.mjs && node tools/coverage.mjs`
Expected: lint clean; typecheck 0; coverage tests pass; gate all `ok`.

- [ ] **Step 10: Commit**

```bash
git add css/components.css vue/components/DsCalendar.vue vue/components/DsCalendar.test.ts vue/components/DsCalendar.stories.ts vue/index.ts tools/coverage-core.mjs tools/coverage.test.mjs pages/forms.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsCalendar month grid + ds-calendar primitive + gate tracking"
```

---

### Task 2: DsDatePicker

Text field that opens DsCalendar in a popover (interactive). No new CSS primitive — composes `.ds-input` + `.ds-popover-anchor`/`.ds-popover` (from Batch 1) + `DsCalendar`.

**Files:**
- Modify: `vue/index.ts`, `pages/forms.html`, `tools/coverage-core.mjs`, `tools/coverage.test.mjs`
- Create: `vue/components/DsDatePicker.vue`, `DsDatePicker.test.ts`, `DsDatePicker.stories.ts`
- Regenerate: `reference/*`

**Interfaces:**
- Produces: `DsDatePicker` — props `{ modelValue?: string | null; placeholder?: string; format?: (iso: string) => string }` (default placeholder `"YYYY-MM-DD"`), emits `update:modelValue: [string | null]`. Renders `.ds-popover-anchor` > (`.ds-input` read-only trigger + `.ds-popover` containing `DsCalendar` when open). Selecting a day sets the value and closes. Reuses `useDismiss` for outside-click/Escape.

- [ ] **Step 1: Write the failing test**

Create `vue/components/DsDatePicker.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";

import DsDatePicker from "./DsDatePicker.vue";

describe("DsDatePicker", () => {
  it("shows the placeholder when empty and the calendar is closed", () => {
    const w = mount(DsDatePicker, { props: { modelValue: null, placeholder: "Pick a date" } });
    const input = w.find(".ds-input").element as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("Pick a date");
    expect(w.find(".ds-calendar").exists()).toBe(false);
  });

  it("shows the ISO value in the field", () => {
    const w = mount(DsDatePicker, { props: { modelValue: "2026-06-15" } });
    expect((w.find(".ds-input").element as HTMLInputElement).value).toBe("2026-06-15");
  });

  it("applies a custom format function to the display", () => {
    const w = mount(DsDatePicker, { props: { modelValue: "2026-06-15", format: (iso: string) => iso.split("-").reverse().join("/") } });
    expect((w.find(".ds-input").element as HTMLInputElement).value).toBe("15/06/2026");
  });

  it("opens the calendar on field click", async () => {
    const w = mount(DsDatePicker, { props: { modelValue: "2026-06-15" } });
    await w.find(".ds-input").trigger("click");
    expect(w.find(".ds-calendar").exists()).toBe(true);
  });

  it("selecting a day emits update:modelValue and closes", async () => {
    const w = mount(DsDatePicker, { props: { modelValue: "2026-06-15" } });
    await w.find(".ds-input").trigger("click");
    const cells = w.findAll(".ds-calendar-day");
    await cells[0].trigger("click"); // June 1 2026 (Monday) → first cell
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual(["2026-06-01"]);
    expect(w.find(".ds-calendar").exists()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run vue/components/DsDatePicker.test.ts`
Expected: FAIL — cannot resolve `./DsDatePicker.vue`.

- [ ] **Step 3: Implement and export**

Create `vue/components/DsDatePicker.vue`:

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import DsCalendar from "./DsCalendar.vue";
import { useDismiss } from "../composables/useDismiss";

const props = withDefaults(
  defineProps<{ modelValue?: string | null; placeholder?: string; format?: (iso: string) => string }>(),
  { modelValue: null, placeholder: "YYYY-MM-DD" }
);
const emit = defineEmits<{ "update:modelValue": [string | null] }>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
useDismiss({ active: open, root, onDismiss: () => (open.value = false) });

const display = computed(() =>
  props.modelValue ? (props.format ? props.format(props.modelValue) : props.modelValue) : ""
);
const calendarMonth = computed(() => (props.modelValue ? props.modelValue.slice(0, 7) : undefined));

function onPick(iso: string) {
  emit("update:modelValue", iso);
  open.value = false;
}
</script>

<template>
  <div ref="root" class="ds-popover-anchor">
    <input
      class="ds-input"
      type="text"
      readonly
      :value="display"
      :placeholder="placeholder"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="dialog"
      @click="open = !open"
    />
    <div v-if="open" class="ds-popover" role="dialog" aria-label="Choose date">
      <DsCalendar :model-value="modelValue" :month="calendarMonth" @update:model-value="onPick" />
    </div>
  </div>
</template>
```

In `vue/index.ts`, add `export { default as DsDatePicker } from "./components/DsDatePicker.vue";`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run vue/components/DsDatePicker.test.ts`
Expected: PASS (all five).

- [ ] **Step 5: Add the story**

Create `vue/components/DsDatePicker.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsDatePicker from "./DsDatePicker.vue";

const meta: Meta<typeof DsDatePicker> = {
  title: "Form/DsDatePicker",
  component: DsDatePicker,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsDatePicker },
    setup: () => { const value = ref(args.modelValue ?? null); return { args, value }; },
    template: `<div style="padding-bottom:300px"><DsDatePicker v-bind="args" :model-value="value" @update:model-value="value = $event" /></div>`
  })
};
export default meta;
type Story = StoryObj<typeof DsDatePicker>;

export const Empty: Story = {};
export const Preselected: Story = { args: { modelValue: "2026-06-15" } };
```

- [ ] **Step 6: Add the docs example + Vue snippet**

In `pages/forms.html`, add (static — show the field with the open popover/calendar):

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-popover-anchor">
      <input class="ds-input" type="text" readonly value="2026-06-15" aria-haspopup="dialog" style="width:160px;" />
    </div>
  </div>
  <template data-vue>
<DsDatePicker v-model="date" />
  </template>
  <div class="example-caption">Date field opening a calendar; composes <code>.ds-input</code> + <code>.ds-popover</code> + <code>DsCalendar</code>.</div>
</div>
```

- [ ] **Step 7: Add to the gate's interactive set**

In `tools/coverage-core.mjs`, add `"DsDatePicker"` to `DATA_VUE_EXPECTED`. Update the `coverage.test.mjs` equality assertion (sorted).

- [ ] **Step 8: Regenerate + verify**

Run: `npm run reference:build && npm run reference:lint && npm run typecheck && npx vitest run tools/coverage.test.mjs && node tools/coverage.mjs`
Expected: lint clean; typecheck 0; coverage tests pass; gate all `ok`. (Note: `ds-datepicker` is NOT a class — DsDatePicker emits only existing classes `ds-popover-anchor`, `ds-input`, `ds-popover`, so `renders` stays valid with no new primitive.)

- [ ] **Step 9: Commit**

```bash
git add vue/components/DsDatePicker.vue vue/components/DsDatePicker.test.ts vue/components/DsDatePicker.stories.ts vue/index.ts tools/coverage-core.mjs tools/coverage.test.mjs pages/forms.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "feat(vue): DsDatePicker (input + calendar popover) + gate tracking"
```

---

### Task 3: Batch verification

**Files:** none.

- [ ] **Step 1:** `npx vitest run && npm run typecheck` — all green, 0 type errors.
- [ ] **Step 2:** `npm run build && node tools/coverage.mjs` — build exit 0; gate `story`/`example`/`renders`/`docs` all `ok`.
- [ ] **Step 3:** `node -e "const m=require('./reference/manifest.json'); const want=['DsCalendar','DsDatePicker']; const have=new Set(m.components.map(c=>c.name)); console.log(want.map(n=>n+':'+have.has(n)).join(' '))"` — both `true`.

---

## Notes for the implementer

- The date facts in DsCalendar's tests are real (June 1 2026 is a Monday; July 2026 starts on a Wednesday). If a test fails, the Monday-first offset `(first.getDay() + 6) % 7` or the 42-cell window is wrong — fix the math, never the test.
- Build `Date` objects with `new Date(year, monthIndex, day)` (local time) consistently; never parse ISO strings with `new Date("2026-06-01")` (UTC parsing causes off-by-one in some timezones). Construct from numeric parts.
- DsDatePicker composes existing CSS only — do not add a `ds-datepicker` class (keeps `renders` clean and needs no new example/primitive).
- Verify every CSS token exists in `css/tokens.css`; if a name differs use the real one.
- Commit regenerated `reference/*` with each task. Gate stays warn-only. Do not commit any impl report into git.
