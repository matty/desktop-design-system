# Vue Components — Phase A: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the conventions for the full component buildout — shared type unions, the variant↔CSS test helper, and two exemplar components (`DsIcon`, `DsButton`) — that Phases B–D copy.

**Architecture:** Vue 3 SFCs under `vue/components/`, no `<style>` blocks; typed variant props map to real `.is-*` classes. A test helper reads `css/components.css` so every component can assert its variant classes actually exist. Behavior (none new here) stays in `vue/composables/`.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest + @vue/test-utils + happy-dom, vue-tsc. (No new deps in Phase A.)

## Global Constraints

- Vue 3 SFC `<script setup lang="ts">`, raw `.vue` source. NO `<style>` block anywhere in `vue/`.
- A variant/state prop may map ONLY to an `.is-*`/modifier class that exists in `css/components.css`. Verified by the Phase-A test helper.
- Tones are `"info" | "success" | "warning" | "danger"` (CSS uses `warning`, not `warn`). Sizes are `"sm" | "md" | "lg"` (`md` = no size class).
- Do NOT modify `js/ds.js`, `css/`, `src/`, `pages/`. All new code under `vue/`; append exports to `vue/index.ts`.
- ESM, two-space indentation. `npm test`, `npm run typecheck`, `npm run build` stay green.
- Test-support files live under a `__`-containing path (e.g. `vue/__support__/`) so the bundle copy excludes them (its filter drops `*.test.ts`, `env.d.ts`, and paths containing `__`).

---

### Task 1: Shared type unions

**Files:**
- Modify: `vue/types.ts`
- Test: `vue/types.test.ts` (extend existing)

**Interfaces:**
- Produces: `Tone = "info" | "success" | "warning" | "danger"`, `Size = "sm" | "md" | "lg"`. Imported by Phase B–D components.

- [ ] **Step 1: Add a failing type test**

Append to `vue/types.test.ts`:
```ts
import type { Tone, Size } from "./types";
describe("shared unions", () => {
  it("Tone and Size are the CSS-backed unions", () => {
    expectTypeOf<Tone>().toMatchTypeOf<"info" | "success" | "warning" | "danger">();
    expectTypeOf<Size>().toMatchTypeOf<"sm" | "md" | "lg">();
  });
});
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`
Expected: FAIL — `Tone`/`Size` not exported from `./types`.

- [ ] **Step 3: Add the unions to `vue/types.ts`**

Append:
```ts
export type Tone = "info" | "success" | "warning" | "danger";
export type Size = "sm" | "md" | "lg";
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck` → exits 0.
Run: `npm test -- types` → passes.

- [ ] **Step 5: Commit**

```bash
git add vue/types.ts vue/types.test.ts
git commit -m "vue: add shared Tone/Size unions"
```

---

### Task 2: Variant↔CSS test helper

**Files:**
- Create: `vue/__support__/css.ts`
- Test: `vue/__support__/css.test.ts`

**Interfaces:**
- Produces: `cssClasses(): Set<string>` (all class tokens in `css/components.css`) and `cssHas(cls: string): boolean` (cls without leading dot, e.g. `"is-primary"` or `"ds-btn"`). Used by every component test to assert variant classes exist.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { cssHas, cssClasses } from "./css";

describe("css helper", () => {
  it("finds known classes", () => {
    expect(cssHas("ds-btn")).toBe(true);
    expect(cssHas("is-primary")).toBe(true);
    expect(cssHas("is-ghost")).toBe(true);
  });
  it("rejects non-existent classes", () => {
    expect(cssHas("is-totally-made-up")).toBe(false);
  });
  it("returns a non-trivial set", () => {
    expect(cssClasses().size).toBeGreaterThan(50);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- __support__/css`
Expected: FAIL — cannot find `./css`.

- [ ] **Step 3: Implement `vue/__support__/css.ts`**

```ts
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(here, "../../css/components.css");

let cache: Set<string> | null = null;

export function cssClasses(): Set<string> {
  if (cache) return cache;
  const css = readFileSync(cssPath, "utf8");
  const set = new Set<string>();
  for (const m of css.matchAll(/\.([a-z][a-z0-9-]*)/g)) set.add(m[1]);
  cache = set;
  return set;
}

export function cssHas(cls: string): boolean {
  return cssClasses().has(cls.replace(/^\./, ""));
}
```

- [ ] **Step 4: Verify**

Run: `npm test -- __support__/css` → 3 passed.
Run: `npm run typecheck` → exits 0.

- [ ] **Step 5: Commit**

```bash
git add vue/__support__/css.ts vue/__support__/css.test.ts
git commit -m "vue: add variant-vs-CSS test helper (reads components.css)"
```

---

### Task 3: DsIcon

**Files:**
- Create: `vue/components/DsIcon.vue`
- Test: `vue/components/DsIcon.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `iconSvg` from `icons/icons.js`, `icons/registry.json`.
- Produces: `<DsIcon name size? />` — renders the registry's inline SVG. `name: string`; `size?: number` (px, applied as width/height). Emits nothing.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsIcon from "./DsIcon.vue";
import registry from "../../icons/registry.json";

describe("DsIcon", () => {
  const known = Object.keys(registry.icons)[0];

  it("renders an inline svg for a known icon", () => {
    const w = mount(DsIcon, { props: { name: known } });
    expect(w.find("svg").exists()).toBe(true);
  });

  it("renders nothing visible for an unknown icon (no throw)", () => {
    const w = mount(DsIcon, { props: { name: "definitely-not-an-icon" } });
    expect(w.find("svg").exists()).toBe(false);
  });

  it("applies size to width/height", () => {
    const w = mount(DsIcon, { props: { name: known, size: 20 } });
    const svg = w.find("svg").element as SVGElement;
    expect(svg.getAttribute("width")).toBe("20");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsIcon`
Expected: FAIL — cannot find `./DsIcon.vue`.

- [ ] **Step 3: Implement `vue/components/DsIcon.vue`**

```vue
<script setup lang="ts">
import { computed } from "vue";
import { iconSvg } from "../../icons/icons.js";
import registry from "../../icons/registry.json";

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 });

const svg = computed(() => {
  if (!(registry as { icons: Record<string, unknown> }).icons[props.name]) return "";
  return iconSvg(props.name, registry, { width: props.size, height: props.size });
});
</script>

<template>
  <span aria-hidden="true" v-html="svg"></span>
</template>
```

(Note: the wrapper span carries NO class — do not invent a `.ds-*` class that isn't in `components.css`. The icon's own SVG inherits `currentColor`. Consumers style/size via `DsIcon`'s `size` prop or by passing classes through `inheritAttrs`.)

- [ ] **Step 4: Append export to `vue/index.ts`**

```ts
export { default as DsIcon } from "./components/DsIcon.vue";
```

- [ ] **Step 5: Verify**

Run: `npm test -- DsIcon` → 3 passed.
Run: `npm run typecheck` → exits 0.

- [ ] **Step 6: Commit**

```bash
git add vue/components/DsIcon.vue vue/components/DsIcon.test.ts vue/index.ts
git commit -m "vue: add DsIcon (renders offline registry SVG)"
```

---

### Task 4: DsButton (exemplar variant-prop component)

**Files:**
- Create: `vue/components/DsButton.vue`
- Test: `vue/components/DsButton.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `cssHas` (Task 2), `DsIcon` optional via slot.
- Produces: `<DsButton variant? size? icon? loading? disabled?>`. `variant?: "primary"|"ghost"|"danger"`, `size?: "sm"|"lg"`, `icon?: boolean`, `loading?: boolean`, `disabled?: boolean`. Renders `<button class="ds-btn">` with `.is-*` per props; default slot is content. This is the canonical pattern Phases B–D follow.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsButton from "./DsButton.vue";
import { cssHas } from "../__support__/css";

const variantClass = { primary: "is-primary", ghost: "is-ghost", danger: "is-danger" } as const;

describe("DsButton", () => {
  it("renders .ds-btn with slot content", () => {
    const w = mount(DsButton, { slots: { default: () => "Save" } });
    expect(w.find("button.ds-btn").text()).toBe("Save");
  });

  it("maps each variant/size/icon prop to a real .is-* class", () => {
    for (const [variant, cls] of Object.entries(variantClass)) {
      expect(cssHas(cls)).toBe(true); // class exists in components.css
      const w = mount(DsButton, { props: { variant: variant as "primary" } });
      expect(w.find("button").classes()).toContain(cls);
    }
    expect(cssHas("is-sm")).toBe(true);
    expect(mount(DsButton, { props: { size: "sm" } }).find("button").classes()).toContain("is-sm");
    expect(cssHas("is-icon")).toBe(true);
    expect(mount(DsButton, { props: { icon: true } }).find("button").classes()).toContain("is-icon");
  });

  it("sets disabled and renders a spinner when loading", () => {
    const w = mount(DsButton, { props: { loading: true } });
    expect(w.find("button").attributes("disabled")).toBeDefined();
    expect(w.find(".ds-spinner").exists()).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsButton`
Expected: FAIL — cannot find `./DsButton.vue`.

- [ ] **Step 3: Implement `vue/components/DsButton.vue`**

```vue
<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "ghost" | "danger";
    size?: "sm" | "lg";
    icon?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  { icon: false, loading: false, disabled: false }
);

const classes = computed(() => ({
  "is-primary": props.variant === "primary",
  "is-ghost": props.variant === "ghost",
  "is-danger": props.variant === "danger",
  "is-sm": props.size === "sm",
  "is-lg": props.size === "lg",
  "is-icon": props.icon
}));
</script>

<template>
  <button class="ds-btn" :class="classes" :disabled="disabled || loading || undefined">
    <span v-if="loading" class="ds-spinner" aria-hidden="true"></span>
    <slot />
  </button>
</template>
```

- [ ] **Step 4: Append export to `vue/index.ts`**

```ts
export { default as DsButton } from "./components/DsButton.vue";
```

- [ ] **Step 5: Verify + full Phase-A gate**

Run: `npm test -- DsButton` → 3 passed.
Run: `npm test` → all suites pass.
Run: `npm run typecheck` → exits 0.
Run: `npm run build` → exit 0 (the existing ds.js/docs.js/sortable warnings are expected).

- [ ] **Step 6: Commit**

```bash
git add vue/components/DsButton.vue vue/components/DsButton.test.ts vue/index.ts
git commit -m "vue: add DsButton (exemplar variant-prop component)"
```

---

## Self-Review

- **Spec coverage (Phase A):** shared unions (Task 1), variant↔CSS helper (Task 2), `DsIcon` (Task 3), `DsButton` (Task 4). Establishes the conventions Phases B–D require.
- **Placeholder scan:** none — every step has full code or an exact command.
- **Type consistency:** `Tone`/`Size` defined in Task 1 and consumed by later phases; `cssHas` signature from Task 2 used in Task 4 and every later component test; variant→class maps use only classes confirmed present in `components.css` (`is-primary/ghost/danger/sm/lg/icon`).
- **Note for later phases:** the existing `ToastTone` uses `"warn"` while CSS/`Tone` use `"warning"` — pre-existing, out of scope here; flag in the final review of the whole buildout.
