# Popover Collision Flip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `DsPopover` collision-aware — flip its panel above the trigger when there's no room below, and shift it horizontally to stay on-screen — via a small reusable, dependency-free `useFlip` composable.

**Architecture:** A pure `computeFlip()` function holds all the geometry math (testable in isolation, no DOM). A thin `useFlip()` composable wraps it: measures the trigger rect + panel size against the viewport, runs `computeFlip`, and exposes a reactive `placement` ("bottom"|"top") + `floatStyle` ({ left }). `DsPopover` binds those to `data-placement` and inline `style`. One CSS rule renders the flipped (top) side. Panel stays `absolute` within the anchor — no portal, no new deps.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest + @vue/test-utils, static CSS, multi-page docs.

## Global Constraints

- **No new dependencies** — hand-rolled `getBoundingClientRect` measurement (offline-bundle constraint).
- Geometry: `gap = 6`, `padding = 8` defaults; preferred `placement` default `"bottom"`.
- Flip only when the preferred side can't fit AND the opposite has more room (no thrashing): preferred bottom → top iff `floatH > roomBelow && roomAbove > roomBelow`; preferred top → bottom iff `floatH > roomAbove && roomBelow > roomAbove`.
- Horizontal shift keeps the panel within `[padding, vw - padding]`; `floatStyle.left` is `"0px"` when it already fits.
- DOM access guards `typeof window === "undefined"` and null refs; unmeasurable → `placement = preferred`, `floatStyle = { left: "0px" }`.
- `DsTooltip` untouched. No left/right placements, no start/end alignment, no portal.
- `npm run build` = `icons:check → reference:check → reference:lint → coverage:check → vite build → bundle`; does NOT run typecheck/tests. Regenerate the catalog with `reference:build` before building when example markup changes. New CSS is an attribute selector (no class) → no coverage/lint impact.
- Composables are part of the public surface (`vue/index.ts` already exports `useDismiss`, `useFocusTrap`, etc.) — export `useFlip` there.

---

## File Structure

New:
- `vue/composables/useFlip.ts` — `computeFlip` (pure) + `useFlip` (composable).
- `vue/composables/useFlip.test.ts` — unit tests for `computeFlip`.

Modified:
- `vue/index.ts` — export `useFlip`, `computeFlip`.
- `vue/components/DsPopover.vue` — refs, `placement` prop, `useFlip` wiring, bindings.
- `vue/components/DsPopover.test.ts` — flip cases (keep existing).
- `css/components.css` — `.ds-popover[data-placement="top"]` rule.
- `pages/feedback.html` — upward-variant example in the "Popover" section.
- Regenerated: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`.

---

## Task 1: `useFlip` composable + pure `computeFlip` core

**Files:**
- Create: `vue/composables/useFlip.ts`
- Create: `vue/composables/useFlip.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Produces:
  - `computeFlip(i: FlipInput): { placement: "bottom" | "top"; left: number }`
  - `useFlip(opts: UseFlipOptions): { placement: Ref<"bottom"|"top">; floatStyle: Ref<{ left: string }> }`
  - `UseFlipOptions = { trigger: Ref<HTMLElement|null>; floating: Ref<HTMLElement|null>; open: Ref<boolean>; placement?: "bottom"|"top"; gap?: number; padding?: number }`
  - `FlipInput = { rect: { top: number; bottom: number; left: number }; floatW: number; floatH: number; vw: number; vh: number; preferred: "bottom"|"top"; gap: number; padding: number }`

- [ ] **Step 1: Write the failing test for `computeFlip`**

Create `vue/composables/useFlip.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeFlip } from "./useFlip";

const base = { floatW: 180, floatH: 120, vw: 1000, vh: 800, gap: 6, padding: 8 };

describe("computeFlip", () => {
  it("keeps preferred bottom when there is room below", () => {
    const r = computeFlip({ ...base, rect: { top: 100, bottom: 120, left: 100 }, preferred: "bottom" });
    expect(r.placement).toBe("bottom");
    expect(r.left).toBe(0);
  });

  it("flips to top when below is cramped and above has room", () => {
    // trigger near the viewport bottom: roomBelow = 800-780-6 = 14 < floatH 120; roomAbove large
    const r = computeFlip({ ...base, rect: { top: 760, bottom: 780, left: 100 }, preferred: "bottom" });
    expect(r.placement).toBe("top");
  });

  it("keeps preferred top when there is room above", () => {
    const r = computeFlip({ ...base, rect: { top: 400, bottom: 420, left: 100 }, preferred: "top" });
    expect(r.placement).toBe("top");
  });

  it("shifts left when the panel overflows the right edge", () => {
    // 900 + 180 + 8 - 1000 = 88 overflow -> left -88
    const r = computeFlip({ ...base, rect: { top: 100, bottom: 120, left: 900 }, preferred: "bottom" });
    expect(r.left).toBe(-88);
  });

  it("does not shift when the panel fits horizontally", () => {
    const r = computeFlip({ ...base, rect: { top: 100, bottom: 120, left: 100 }, preferred: "bottom" });
    expect(r.left).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run vue/composables/useFlip.test.ts`
Expected: FAIL — cannot resolve `computeFlip` from `./useFlip` (file does not exist).

- [ ] **Step 3: Implement `useFlip.ts`**

Create `vue/composables/useFlip.ts`:

```ts
import { onBeforeUnmount, nextTick, ref, watch, type Ref } from "vue";

export interface FlipInput {
  rect: { top: number; bottom: number; left: number };
  floatW: number;
  floatH: number;
  vw: number;
  vh: number;
  preferred: "bottom" | "top";
  gap: number;
  padding: number;
}

export interface FlipResult {
  placement: "bottom" | "top";
  left: number;
}

export function computeFlip(i: FlipInput): FlipResult {
  const roomBelow = i.vh - i.rect.bottom - i.gap;
  const roomAbove = i.rect.top - i.gap;

  let placement: "bottom" | "top";
  if (i.preferred === "bottom") {
    placement = i.floatH > roomBelow && roomAbove > roomBelow ? "top" : "bottom";
  } else {
    placement = i.floatH > roomAbove && roomBelow > roomAbove ? "bottom" : "top";
  }

  let left = 0;
  const overflowRight = i.rect.left + i.floatW + i.padding - i.vw;
  if (overflowRight > 0) left = -overflowRight;
  if (i.rect.left + left < i.padding) left += i.padding - (i.rect.left + left);

  return { placement, left: Math.round(left) };
}

export interface UseFlipOptions {
  trigger: Ref<HTMLElement | null>;
  floating: Ref<HTMLElement | null>;
  open: Ref<boolean>;
  placement?: "bottom" | "top";
  gap?: number;
  padding?: number;
}

export interface UseFlipReturn {
  placement: Ref<"bottom" | "top">;
  floatStyle: Ref<{ left: string }>;
}

export function useFlip(opts: UseFlipOptions): UseFlipReturn {
  const preferred = opts.placement ?? "bottom";
  const gap = opts.gap ?? 6;
  const padding = opts.padding ?? 8;

  const placement = ref<"bottom" | "top">(preferred);
  const floatStyle = ref<{ left: string }>({ left: "0px" });

  let raf = 0;

  function measure() {
    if (typeof window === "undefined") return;
    const t = opts.trigger.value;
    const f = opts.floating.value;
    if (!t || !f) return;
    const rect = t.getBoundingClientRect();
    const res = computeFlip({
      rect: { top: rect.top, bottom: rect.bottom, left: rect.left },
      floatW: f.offsetWidth,
      floatH: f.offsetHeight,
      vw: window.innerWidth,
      vh: window.innerHeight,
      preferred,
      gap,
      padding,
    });
    placement.value = res.placement;
    floatStyle.value = { left: `${res.left}px` };
  }

  function schedule() {
    if (typeof window === "undefined") return;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(measure);
  }

  function attach() {
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
  }

  function detach() {
    window.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", schedule);
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  watch(
    opts.open,
    (v) => {
      if (v) {
        attach();
        nextTick(measure);
      } else {
        detach();
        placement.value = preferred;
        floatStyle.value = { left: "0px" };
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(detach);

  return { placement, floatStyle };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run vue/composables/useFlip.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Export from the public surface**

In `vue/index.ts`, after the `export { useToast } from "./composables/useToast";` line, add:

```ts
export { useFlip, computeFlip } from "./composables/useFlip";
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add vue/composables/useFlip.ts vue/composables/useFlip.test.ts vue/index.ts
git commit -m "feat(useFlip): collision-aware placement composable + pure computeFlip core"
```

---

## Task 2: Wire `useFlip` into `DsPopover` + CSS

**Files:**
- Modify: `vue/components/DsPopover.vue`
- Modify: `css/components.css`
- Modify: `vue/components/DsPopover.test.ts`

**Interfaces:**
- Consumes: `useFlip` from Task 1.
- Produces: `DsPopover` prop `placement?: "bottom" | "top"`; the open panel carries `data-placement` and an inline `left` style.

- [ ] **Step 1: Add the flip tests to `DsPopover.test.ts`**

In `vue/components/DsPopover.test.ts`, change the import line
`import { mount } from "@vue/test-utils";` to:

```ts
import { mount, flushPromises } from "@vue/test-utils";
```

Then add these cases inside the `describe("DsPopover", ...)` block (before its closing `});`):

```ts
  it("defaults the open popover to data-placement=bottom", async () => {
    const w = mount(DsPopover, { slots: { trigger: () => "x", default: () => "y" } });
    await w.find("button").trigger("click");
    await flushPromises();
    expect(w.find(".ds-popover").attributes("data-placement")).toBe("bottom");
  });

  it("honors the placement prop", async () => {
    const w = mount(DsPopover, { props: { placement: "top" }, slots: { trigger: () => "x", default: () => "y" } });
    await w.find("button").trigger("click");
    await flushPromises();
    expect(w.find(".ds-popover").attributes("data-placement")).toBe("top");
  });

  it("flips to top when the trigger sits near the viewport bottom", async () => {
    const w = mount(DsPopover, { attachTo: document.body, slots: { trigger: () => "x", default: () => "y" } });
    const vh = window.innerHeight;
    const btn = w.find("button").element as HTMLElement;
    btn.getBoundingClientRect = () =>
      ({ top: vh - 20, bottom: vh - 2, left: 100, right: 200, width: 100, height: 18, x: 100, y: vh - 20, toJSON: () => ({}) }) as DOMRect;
    await w.find("button").trigger("click");
    await flushPromises();
    expect(w.find(".ds-popover").attributes("data-placement")).toBe("top");
    w.unmount();
  });
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npx vitest run vue/components/DsPopover.test.ts`
Expected: the 3 new cases FAIL (`data-placement` attribute is `undefined`); the original 6 still pass.

- [ ] **Step 3: Rewrite `DsPopover.vue`**

Overwrite `vue/components/DsPopover.vue`:

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useDismiss } from "../composables/useDismiss";
import { useFlip } from "../composables/useFlip";

const open = defineModel<boolean>("open", { default: false });
const props = withDefaults(
  defineProps<{ ariaLabel?: string; placement?: "bottom" | "top" }>(),
  { placement: "bottom" }
);

const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLElement | null>(null);
const floating = ref<HTMLElement | null>(null);

useDismiss({ active: open, root, onDismiss: () => (open.value = false) });
const { placement: resolved, floatStyle } = useFlip({
  trigger,
  floating,
  open,
  placement: props.placement,
});

function toggle() {
  open.value = !open.value;
}
</script>

<template>
  <div ref="root" class="ds-popover-anchor" :class="{ 'is-open': open }">
    <button ref="trigger" type="button" class="ds-btn" :aria-expanded="open" @click="toggle">
      <slot name="trigger" />
    </button>
    <div
      v-if="open"
      ref="floating"
      class="ds-popover"
      role="dialog"
      :aria-label="ariaLabel"
      :data-placement="resolved"
      :style="floatStyle"
    >
      <slot />
    </div>
  </div>
</template>
```

- [ ] **Step 4: Add the CSS for the flipped side**

In `css/components.css`, immediately after the line
`.ds-popover-anchor .ds-popover { position:absolute; top:calc(100% + 6px); left:0; z-index:50; min-width:180px; }` (line 427), add:

```css
.ds-popover-anchor .ds-popover[data-placement="top"] { top:auto; bottom:calc(100% + 6px); }
```

- [ ] **Step 5: Run the popover tests to verify all pass**

Run: `npx vitest run vue/components/DsPopover.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add vue/components/DsPopover.vue css/components.css vue/components/DsPopover.test.ts
git commit -m "feat(popover): collision-aware flip + horizontal shift via useFlip"
```

---

## Task 3: Docs example + reference regen + full build

**Files:**
- Modify: `pages/feedback.html`
- Regenerated: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`

**Interfaces:**
- Consumes: `.ds-popover[data-placement="top"]` (Task 2).

- [ ] **Step 1: Add the upward-variant example**

In `pages/feedback.html`, inside the "Popover" `<section class="doc-section">`, immediately AFTER the second example's closing `</div>` (the `.ds-popover-anchor is-open` example, line 148) and BEFORE the section's `</section>` (line 149), insert:

```html
          <div class="example">
            <div class="example-preview" style="padding-top:80px">
              <div class="ds-popover-anchor is-open">
                <button class="ds-btn" aria-expanded="true">Upward</button>
                <div class="ds-popover" role="dialog" aria-label="Upward" data-placement="top">Flips above the trigger when there's no room below.</div>
              </div>
            </div>
            <template data-vue>
<DsPopover aria-label="Upward" placement="top">
  <template #trigger>Upward</template>
  <div>Flips above the trigger when there's no room below.</div>
</DsPopover>
            </template>
            <div class="example-caption">Collision-aware: <code>placement="top"</code> / <code>[data-placement="top"]</code>.</div>
          </div>
```

- [ ] **Step 2: Regenerate the reference catalog**

Run: `npm run reference:build`
Expected: "Wrote reference/manifest.json, REFERENCE.md, llms.txt."
Run: `git --no-pager diff --stat reference/manifest.json REFERENCE.md llms.txt`
Expected: at least `reference/manifest.json` shows changes (new popover example recorded).

- [ ] **Step 3: Run the full build (all gates)**

Run: `npm run build`
Expected: PASS — `icons:check`, `reference:check` (passes only because Step 2 regenerated), `reference:lint`, `coverage:check`, `vite build`, `bundle` all succeed.

- [ ] **Step 4: Typecheck + full test suite**

Run: `npm run typecheck`
Expected: PASS.
Run: `npm test`
Expected: PASS — all tests including the 5 `computeFlip` + 9 `DsPopover` cases.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`
- Open **Feedback → Popover** → confirm the new "Upward" example renders with the panel above its trigger.
- (Runtime flip is exercised by the unit tests; the docs example shows the styling.)

- [ ] **Step 6: Commit**

```bash
git add pages/feedback.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "docs(popover): upward placement example + regenerate reference catalog"
```

---

## Self-Review

**Spec coverage:**
- `useFlip` composable (measure, flip, shift, recompute on open/scroll/resize, guards) → Task 1 Step 3. ✓
- Pure geometry core testable in isolation → `computeFlip` + Task 1 tests. ✓
- `DsPopover` `placement` prop + `data-placement` + inline `left` → Task 2. ✓
- Trigger (not anchor) measured → `useFlip` reads `trigger` ref; `DsPopover` puts `trigger` on the button. ✓
- CSS `[data-placement="top"]` rule → Task 2 Step 4. ✓
- `useFlip` exported on the public surface → Task 1 Step 5. ✓
- Docs upward example → Task 3. ✓
- No new deps / no portal / tooltip untouched → nothing in the plan adds them. ✓
- Catalog regenerated → Task 3 Step 2. ✓

**Placeholder scan:** none — every code step is complete; commands have expected output. ✓

**Type consistency:** `FlipInput`/`FlipResult`/`UseFlipOptions`/`UseFlipReturn` defined in Task 1 and consumed unchanged in `useFlip` and `DsPopover`. `placement` union `"bottom" | "top"` consistent across composable, component prop, tests, and CSS attribute. `floatStyle` shape `{ left: string }` consistent between composable return and the component `:style` binding. ✓
```
