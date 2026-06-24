# Flexible Titlebar Window Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `DsTitlebar` window controls fully customisable — choose/order which of minimize/maximize/close render, swap maximize for restore, and inject custom buttons via slots — while keeping the current 3-button default byte-equivalent.

**Architecture:** Enhance the existing `DsTitlebar.vue` with a `controls` array prop (which + order), a `maximized` boolean (restore icon/label/event), and three slots (`leading`, `actions`, `controls`-override). One tiny CSS layout hook positions the new slot wrappers. No new component; backward compatible by default.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest + @vue/test-utils, Storybook (CSF3), static CSS, multi-page docs.

## Global Constraints

- Class grammar: primitives `.ds-*`, states `.is-*`. Existing `.ds-winbtns button` already styles all window buttons; `.is-close` is the danger-red close.
- `WindowControl = "minimize" | "maximize" | "close"` — add to `vue/types.ts`.
- Default behavior MUST be unchanged: `controls = ["minimize","maximize","close"]`, `maximized = false`, no slots → today's exact output (3 buttons, close last with `.is-close`, emits `minimize`/`maximize`/`close`, aria-labels "Minimize"/"Maximize"/"Close").
- Events: `minimize`, `maximize`, `restore`, `close`. The maximize entry emits `restore` (not `maximize`) when `maximized` is true.
- NO `side`/left placement (out of scope).
- `cssHas()` (`vue/__support__/css.ts`) reads `css/components.css` only — it can assert the new `.ds-titlebar-*` classes.
- `npm run build` runs `icons:check → reference:check → reference:lint → coverage:check → vite build → bundle`; it does NOT run typecheck or tests (separate scripts). `reference:check` FAILS if the committed catalog is stale, so regenerate with `reference:build` before building when CSS/markup classes change.
- DsTitlebar is already exported from `vue/index.ts` — do not re-add.

---

## File Structure

Modified files:
- `vue/types.ts` — add `WindowControl`.
- `css/components.css` — add `.ds-titlebar-leading`, `.ds-titlebar-actions`.
- `vue/components/DsTitlebar.vue` — props, events, slots, control loop.
- `vue/components/DsTitlebar.test.ts` — extend tests.
- `vue/components/DsTitlebar.stories.ts` — add stories.
- `pages/navigation.html` — variant examples in the "Title bar" section.
- Regenerated: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`.

---

## Task 1: Flexible DsTitlebar (types + CSS + component + tests + stories)

**Files:**
- Modify: `vue/types.ts`
- Modify: `css/components.css` (after line 328, end of titlebar block)
- Modify: `vue/components/DsTitlebar.vue` (full rewrite)
- Modify: `vue/components/DsTitlebar.test.ts` (full rewrite)
- Modify: `vue/components/DsTitlebar.stories.ts` (full rewrite)

**Interfaces:**
- Produces: `WindowControl` type; `DsTitlebar` props `{ title?: string; controls?: WindowControl[]; maximized?: boolean }`; emits `minimize`/`maximize`/`restore`/`close`; slots `default` (title), `leading`, `actions`, `controls`.

- [ ] **Step 1: Add the type**

In `vue/types.ts`, append:

```ts
export type WindowControl = "minimize" | "maximize" | "close";
```

- [ ] **Step 2: Replace the test file with the failing + extended suite**

Overwrite `vue/components/DsTitlebar.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsTitlebar from "./DsTitlebar.vue";
import { cssHas } from "../__support__/css";

describe("DsTitlebar", () => {
  it("renders title + three window buttons (last is-close) by default", () => {
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

  it("labels the window buttons", () => {
    const btns = mount(DsTitlebar, { props: { title: "App" } }).findAll(".ds-winbtns button");
    expect(btns[0].attributes("aria-label")).toBe("Minimize");
    expect(btns[1].attributes("aria-label")).toBe("Maximize");
    expect(btns[2].attributes("aria-label")).toBe("Close");
  });

  it("honors the controls prop for which buttons and order", () => {
    const w = mount(DsTitlebar, { props: { controls: ["close"] } });
    const btns = w.findAll(".ds-winbtns button");
    expect(btns).toHaveLength(1);
    expect(btns[0].classes()).toContain("is-close");

    const w2 = mount(DsTitlebar, { props: { controls: ["close", "minimize"] } });
    const btns2 = w2.findAll(".ds-winbtns button");
    expect(btns2[0].attributes("aria-label")).toBe("Close");
    expect(btns2[1].attributes("aria-label")).toBe("Minimize");
  });

  it("swaps maximize for restore when maximized", async () => {
    const w = mount(DsTitlebar, { props: { maximized: true } });
    const max = w.findAll(".ds-winbtns button")[1];
    expect(max.attributes("aria-label")).toBe("Restore");
    await max.trigger("click");
    expect(w.emitted("restore")).toBeTruthy();
    expect(w.emitted("maximize")).toBeFalsy();
  });

  it("renders leading and actions slots in their wrappers", () => {
    const w = mount(DsTitlebar, {
      slots: { leading: () => "LEAD", actions: () => "ACT" },
    });
    expect(w.find(".ds-titlebar-leading").text()).toBe("LEAD");
    expect(w.find(".ds-titlebar-actions").text()).toBe("ACT");
  });

  it("lets the controls slot override the built-in cluster", () => {
    const w = mount(DsTitlebar, {
      slots: { controls: () => h("button", { class: "custom" }, "x") },
    });
    expect(w.find(".ds-winbtns").exists()).toBe(false);
    expect(w.find("button.custom").exists()).toBe(true);
  });

  it("declares its layout sub-part classes", () => {
    expect(cssHas("ds-titlebar-leading")).toBe(true);
    expect(cssHas("ds-titlebar-actions")).toBe(true);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx vitest run vue/components/DsTitlebar.test.ts`
Expected: FAIL — `controls`/`maximized` not handled, `.ds-titlebar-leading`/`.ds-titlebar-actions` absent (cssHas false), restore label/event missing.

- [ ] **Step 4: Add the CSS layout hook**

In `css/components.css`, immediately after the `.ds-winbtns button.is-close:hover` line (end of the titlebar block, line 328), add:

```css
.ds-titlebar-leading { display:flex; align-items:center; margin-right:auto; }
.ds-titlebar-actions { display:flex; align-items:center; }
```

- [ ] **Step 5: Rewrite the component**

Overwrite `vue/components/DsTitlebar.vue`:

```vue
<script setup lang="ts">
import type { WindowControl } from "../types";

const props = withDefaults(
  defineProps<{
    title?: string;
    controls?: WindowControl[];
    maximized?: boolean;
  }>(),
  {
    controls: () => ["minimize", "maximize", "close"],
    maximized: false,
  }
);

const emit = defineEmits<{
  minimize: [];
  maximize: [];
  restore: [];
  close: [];
}>();

function labelFor(c: WindowControl): string {
  if (c === "minimize") return "Minimize";
  if (c === "close") return "Close";
  return props.maximized ? "Restore" : "Maximize";
}

function onControl(c: WindowControl): void {
  if (c === "minimize") emit("minimize");
  else if (c === "close") emit("close");
  else emit(props.maximized ? "restore" : "maximize");
}
</script>

<template>
  <div class="ds-titlebar">
    <div v-if="$slots.leading" class="ds-titlebar-leading"><slot name="leading" /></div>
    <div class="ds-titlebar-title"><slot>{{ title }}</slot></div>
    <div v-if="$slots.actions" class="ds-titlebar-actions"><slot name="actions" /></div>
    <slot name="controls">
      <div class="ds-winbtns">
        <button
          v-for="c in controls"
          :key="c"
          :class="{ 'is-close': c === 'close' }"
          :title="labelFor(c)"
          :aria-label="labelFor(c)"
          @click="onControl(c)"
        >
          <svg v-if="c === 'minimize'" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg>
          <svg v-else-if="c === 'maximize' && !maximized" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" rx="2"/></svg>
          <svg v-else-if="c === 'maximize' && maximized" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/><rect width="12" height="12" x="4" y="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" rx="2"/></svg>
          <svg v-else viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </slot>
  </div>
</template>
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run vue/components/DsTitlebar.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 7: Rewrite the stories**

Overwrite `vue/components/DsTitlebar.stories.ts`:

```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsTitlebar from "./DsTitlebar.vue";

const meta: Meta<typeof DsTitlebar> = {
  title: "Shell/DsTitlebar",
  component: DsTitlebar,
  tags: ["autodocs"],
  argTypes: {
    controls: { control: "object" },
    maximized: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof DsTitlebar>;

export const Default: Story = {
  args: { title: "Demo App" },
};

export const MinimalClose: Story = {
  args: { title: "Tool Window", controls: ["close"] },
};

export const Maximized: Story = {
  args: { title: "Demo App", maximized: true },
};

export const WithLeadingAndActions: Story = {
  render: (args) => ({
    components: { DsTitlebar },
    setup: () => ({ args }),
    template: `<DsTitlebar v-bind="args">
      Demo App
      <template #leading><span style="padding:0 12px; font-size:12px; color:var(--text-2)">≡ Menu</span></template>
      <template #actions><div class="ds-winbtns"><button title="Settings" aria-label="Settings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></div></template>
    </DsTitlebar>`,
  }),
};
```

- [ ] **Step 8: Run the full Vue test suite + typecheck**

Run: `npm run typecheck`
Expected: PASS (validates `WindowControl`, props, emits).
Run: `npx vitest run vue/components/DsTitlebar.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 9: Commit**

```bash
git add vue/types.ts css/components.css vue/components/DsTitlebar.vue vue/components/DsTitlebar.test.ts vue/components/DsTitlebar.stories.ts
git commit -m "feat(titlebar): configurable window controls, restore state, custom-button slots"
```

---

## Task 2: Docs variants + reference regen + full build

**Files:**
- Modify: `pages/navigation.html` (extend the "Title bar" section, after line 34)
- Regenerated: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`

**Interfaces:**
- Consumes: `.ds-titlebar-leading`, `.ds-titlebar-actions` (Task 1), `.ds-winbtns`, `.is-close`.

- [ ] **Step 1: Add variant examples**

In `pages/navigation.html`, inside the existing `<section class="doc-section">` for "Title bar", immediately AFTER the closing `</div>` of the first `<div class="example">` (line 34) and BEFORE the section's closing `</section>` (line 35), insert:

```html
          <div class="example">
            <div class="example-preview col" style="padding:0; overflow:hidden">
              <div class="ds-titlebar u-w-full">
                <div class="ds-titlebar-leading"><span style="padding:0 12px; font-size:12px; color:var(--text-2)">≡ Menu</span></div>
                <div class="ds-titlebar-title">Restore state + action</div>
                <div class="ds-titlebar-actions"><div class="ds-winbtns"><button title="Settings" aria-label="Settings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></div></div>
                <div class="ds-winbtns">
                  <button title="Minimize" aria-label="Minimize"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14"/></svg></button>
                  <button title="Restore" aria-label="Restore"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/><rect width="12" height="12" x="4" y="8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" rx="2"/></svg></button>
                  <button class="is-close" title="Close" aria-label="Close"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
              </div>
              <div class="ds-titlebar u-w-full">
                <div class="ds-titlebar-title">Close only</div>
                <div class="ds-winbtns">
                  <button class="is-close" title="Close" aria-label="Close"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
              </div>
            </div>
            <div class="example-caption"><b>.ds-titlebar-leading</b> · <b>.ds-titlebar-actions</b> · restore icon · close-only</div>
          </div>
```

- [ ] **Step 2: Regenerate the reference catalog**

Run: `npm run reference:build`
Expected: "Wrote reference/manifest.json, REFERENCE.md, llms.txt." Confirm the new sub-part classes are recorded:
Run: `git --no-pager diff --stat reference/manifest.json REFERENCE.md llms.txt`
Expected: at least `reference/manifest.json` shows changes.

- [ ] **Step 3: Run the full build (all gates)**

Run: `npm run build`
Expected: PASS — `icons:check`, `reference:check` (passes only because Step 2 regenerated the catalog), `reference:lint` (the new `.ds-titlebar-*` classes exist in components.css), `coverage:check`, `vite build`, `bundle` all succeed.

- [ ] **Step 4: Run typecheck + full test suite**

Run: `npm run typecheck`
Expected: PASS.
Run: `npm test`
Expected: PASS — all tests including the 8 DsTitlebar cases.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`
- Open **Navigation → Title bar** → confirm the default bar plus the new variants render: restore-state bar with a leading menu label + a settings action button + minimize/restore/close; and a close-only bar.
- Confirm the close button still hovers danger-red; restore icon shows the overlapping-squares glyph.

- [ ] **Step 6: Commit**

```bash
git add pages/navigation.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "docs(titlebar): variant examples + regenerate reference catalog"
```

---

## Self-Review

**Spec coverage:**
- `controls` prop (which + order) → Task 1 Steps 2/5; tested Step 2. ✓
- `maximized` restore icon/label/event → Task 1; tested. ✓
- Slots `leading`/`actions`/`controls` override → Task 1 template; tested. ✓
- `WindowControl` in types.ts → Task 1 Step 1. ✓
- CSS hook `.ds-titlebar-leading`/`.ds-titlebar-actions` → Task 1 Step 4; cssHas tested Step 2. ✓
- Backward-compatible default (3 buttons, is-close last, emits, aria) → preserved by defaults; first three tests unchanged. ✓
- Events include `restore` → emits block. ✓
- Docs variants in navigation.html → Task 2. ✓
- Catalog regenerated → Task 2 Step 2. ✓
- No `side` → absent from all tasks. ✓

**Placeholder scan:** none — every code step shows complete code; commands have expected output. ✓

**Type consistency:** `WindowControl` defined once and used in props, `labelFor`, `onControl`, and the test's typed props. Emit names `minimize`/`maximize`/`restore`/`close` consistent across component, tests, and spec. Slot names `leading`/`actions`/`controls` consistent across template, tests, stories, docs. ✓
```
