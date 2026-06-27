# Toast Positioning + Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the toast component a complete desktop notification surface: configurable placement, four finished tone variants, optional title + action button, enter/exit animation, and pause-on-hover/focus.

**Architecture:** Extend the existing module-singleton `useToast` composable (timer model + pause/resume + tone shorthands), complete the `.ds-toast` CSS (placement modifiers, info/warn icon colors, action layout, transition classes), and enrich `DsToastHost.vue` (placement prop, tone icon, title, action button, `<TransitionGroup>`, pause/resume handlers). Add one `error` icon for the danger tone.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vite, Vitest + @vue/test-utils, Lucide icons via offline registry.

## Global Constraints

- Class grammar: primitives `.ds-*`, states `.is-*`. Design values reference `tokens.css` custom properties — no hard-coded colors/sizes.
- Monochrome-first: tone shows only through the tinted icon on neutral `--surface-2`.
- Reduced motion: all animation must be disabled under `@media (prefers-reduced-motion: reduce)`.
- No new dependencies. Tests mirror sibling `vue/components/*.test.ts` / `vue/composables/*.test.ts`.
- After any change to props/sub-parts: regenerate reference (`npm run reference:build`) so `reference:check` passes.
- Final gate: `npm test`, `npm run typecheck`, `npm run build` all pass.

---

### Task 1: Types + composable (timer model, pause/resume, shorthands)

**Files:**
- Modify: `vue/types.ts`
- Modify: `vue/composables/useToast.ts`
- Test: `vue/composables/useToast.test.ts`

**Interfaces:**
- Produces: `ToastAction { label: string; onClick: () => void }`; `ToastPlacement` union; `ToastOptions` gains `title?: string` and `action?: ToastAction`. `useToast()` returns `{ toasts, toast, dismiss, pause, resume }` where `toast` is callable and also has `.success/.danger/.warn/.info(message, opts?)`. `pause(id: string): void`, `resume(id: string): void`.

- [ ] **Step 1: Write failing tests** — append to `useToast.test.ts`:

```ts
it("tone shorthands set the tone", () => {
  const { toast, toasts } = useToast();
  toast.success("Saved");
  toast.danger("Failed");
  expect(toasts.find((t) => t.message === "Saved")?.tone).toBe("success");
  expect(toasts.find((t) => t.message === "Failed")?.tone).toBe("danger");
});

it("pause stops auto-dismiss; resume restarts it", () => {
  const { toast, pause, resume, toasts } = useToast();
  const id = toast({ message: "Hover me", timeout: 1000 });
  vi.advanceTimersByTime(600);
  pause(id);
  vi.advanceTimersByTime(5000);          // would have expired if not paused
  expect(toasts.length).toBe(1);
  resume(id);
  vi.advanceTimersByTime(399);
  expect(toasts.length).toBe(1);          // 400ms remained
  vi.advanceTimersByTime(1);
  expect(toasts.length).toBe(0);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run vue/composables/useToast.test.ts`
Expected: FAIL (`toast.success is not a function`).

- [ ] **Step 3: Update `vue/types.ts`**

```ts
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export type ToastPlacement =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export interface ToastOptions {
  id?: string;
  message: string;
  title?: string;
  tone?: ToastTone;
  timeout?: number;
  assertive?: boolean;
  action?: ToastAction;
}
```

- [ ] **Step 4: Rewrite `vue/composables/useToast.ts`** with remaining-time timers, pause/resume, and shorthands:

```ts
import { reactive, readonly } from "vue";
import type { ToastOptions, ToastTone } from "../types";
import { useAnnounce } from "./useAnnounce";

export interface ActiveToast extends ToastOptions {
  id: string;
}

type Timer = { handle: ReturnType<typeof setTimeout>; remaining: number; startedAt: number };

const state = reactive<{ toasts: ActiveToast[] }>({ toasts: [] });
let seq = 0;
const { announce } = useAnnounce();
const timers = new Map<string, Timer>();

type ShorthandOpts = Omit<ToastOptions, "message" | "tone">;
export interface ToastFn {
  (opts: ToastOptions): string;
  success(message: string, opts?: ShorthandOpts): string;
  danger(message: string, opts?: ShorthandOpts): string;
  warn(message: string, opts?: ShorthandOpts): string;
  info(message: string, opts?: ShorthandOpts): string;
}

function arm(id: string, ms: number): void {
  if (timers.has(id)) clearTimeout(timers.get(id)!.handle);
  timers.set(id, { handle: setTimeout(() => dismiss(id), ms), remaining: ms, startedAt: Date.now() });
}

function dismiss(id: string): void {
  const t = timers.get(id);
  if (t) { clearTimeout(t.handle); timers.delete(id); }
  const i = state.toasts.findIndex((x) => x.id === id);
  if (i >= 0) state.toasts.splice(i, 1);
}

function pause(id: string): void {
  const t = timers.get(id);
  if (!t) return;
  clearTimeout(t.handle);
  t.remaining = Math.max(0, t.remaining - (Date.now() - t.startedAt));
}

function resume(id: string): void {
  const t = timers.get(id);
  if (!t) return;
  arm(id, t.remaining);
}

const toast = ((opts: ToastOptions): string => {
  const id = opts.id ?? `toast-${++seq}`;
  const item: ActiveToast = { tone: "info", timeout: 4000, ...opts, id };
  state.toasts.push(item);
  announce(item.message, { assertive: item.assertive });
  if (item.timeout && item.timeout > 0) arm(id, item.timeout);
  return id;
}) as ToastFn;

const make = (tone: ToastTone) => (message: string, opts: ShorthandOpts = {}) =>
  toast({ message, tone, ...opts });
toast.success = make("success");
toast.danger = make("danger");
toast.warn = make("warn");
toast.info = make("info");

export function useToast() {
  return { toasts: readonly(state.toasts), toast, dismiss, pause, resume };
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run vue/composables/useToast.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add vue/types.ts vue/composables/useToast.ts vue/composables/useToast.test.ts
git commit -m "feat(toast): timer pause/resume, tone shorthands, action/title types"
```

---

### Task 2: Add danger (`error`) icon

**Files:**
- Modify: `icons/approved.json`
- Modify: `icons/registry.json` (generated)

- [ ] **Step 1: Add mapping** to `icons/approved.json` icons object (alphabetical-ish, near `delete`):

```json
"error": "lucide:circle-x",
```

- [ ] **Step 2: Regenerate registry**

Run: `npm run icons:build`
Expected: writes `error` body into `icons/registry.json`; exit 0.
If offline / network-blocked, hand-add to `icons/registry.json` `icons.error` the lucide `circle-x` body: `<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>` (matching the shape of sibling entries), then re-run `npm run icons:check`.

- [ ] **Step 3: Verify**

Run: `npm run icons:check`
Expected: PASS (registry matches approved set).

- [ ] **Step 4: Commit**

```bash
git add icons/approved.json icons/registry.json
git commit -m "feat(icons): add error glyph for danger toast tone"
```

---

### Task 3: CSS — placements, tone colors, action layout, transitions

**Files:**
- Modify: `css/components.css` (toast section ~lines 358-369)
- Modify: `css/base.css` (reduced-motion block)
- Test: `vue/components/DsToastHost.test.ts` (cssHas assertions in Task 4)

- [ ] **Step 1: Replace the `.ds-toast-stack` rule** and add placement modifiers:

```css
.ds-toast-stack { position:fixed; z-index:120; display:flex; flex-direction:column; gap:8px; }
.ds-toast-stack.is-top-left     { top:16px; left:16px; flex-direction:column-reverse; }
.ds-toast-stack.is-top-center   { top:16px; left:50%; transform:translateX(-50%); flex-direction:column-reverse; }
.ds-toast-stack.is-top-right    { top:16px; right:16px; flex-direction:column-reverse; }
.ds-toast-stack.is-bottom-left  { bottom:30px; left:16px; }
.ds-toast-stack.is-bottom-center{ bottom:30px; left:50%; transform:translateX(-50%); }
.ds-toast-stack.is-bottom-right { bottom:30px; right:16px; }
```

- [ ] **Step 2: Complete tone icon colors** (add after the existing success/danger rules):

```css
.ds-toast.is-info .ds-toast-ico { color:var(--info); }
.ds-toast.is-warn .ds-toast-ico { color:var(--warning); }
```

- [ ] **Step 3: Add action layout + transition classes.** Change `.ds-toast-close` `margin-left:auto` to instead sit after an actions wrapper, and add:

```css
.ds-toast-actions { margin-left:auto; display:flex; align-items:center; gap:6px; }
.ds-toast-enter-active, .ds-toast-leave-active { transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease); }
.ds-toast-enter-from, .ds-toast-leave-to { opacity:0; transform:translateY(6px); }
.ds-toast-stack.is-top-left .ds-toast-enter-from,    .ds-toast-stack.is-top-left .ds-toast-leave-to,
.ds-toast-stack.is-top-center .ds-toast-enter-from,  .ds-toast-stack.is-top-center .ds-toast-leave-to,
.ds-toast-stack.is-top-right .ds-toast-enter-from,   .ds-toast-stack.is-top-right .ds-toast-leave-to { transform:translateY(-6px); }
```

Note: keep `.ds-toast-close { margin-left:auto; ... }` only when no actions wrapper is present is hard in pure CSS; simplest is to remove `margin-left:auto` from `.ds-toast-close` and always render `.ds-toast-actions` (empty when no action) so it pushes the close button right. Decide in Task 4 to always render the actions wrapper.

- [ ] **Step 4: Reduced-motion guard** — in `css/base.css` `@media (prefers-reduced-motion: reduce)` block, add:

```css
.ds-toast-enter-active, .ds-toast-leave-active { transition:none; }
.ds-toast-enter-from, .ds-toast-leave-to { transform:none; }
```

- [ ] **Step 5: Verify build of CSS** (smoke) — covered by Task 4 tests + final build. Commit:

```bash
git add css/components.css css/base.css
git commit -m "feat(toast): placement modifiers, info/warn tones, action layout, transitions"
```

---

### Task 4: Host component — placement, icon, title, action, transitions, pause/resume

**Files:**
- Modify: `vue/components/DsToastHost.vue`
- Test: `vue/components/DsToastHost.test.ts` (create)

**Interfaces:**
- Consumes: `useToast()` → `{ toasts, dismiss, pause, resume }`; `DsIcon` `name` prop; `ToastPlacement`.

- [ ] **Step 1: Write failing tests** — create `vue/components/DsToastHost.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import DsToastHost from "./DsToastHost.vue";
import { useToast } from "../composables/useToast";
import { cssHas } from "../__support__/css";

describe("DsToastHost", () => {
  it("applies the placement class to the stack", () => {
    expect(cssHas("is-top-right")).toBe(true);
    const w = mount(DsToastHost, { props: { placement: "top-right" } });
    expect(w.find(".ds-toast-stack").classes()).toContain("is-top-right");
  });

  it("renders tone icon, title and action button; action fires then dismisses", async () => {
    const { toast, toasts } = useToast();
    [...toasts].forEach((t) => useToast().dismiss(t.id));
    const onClick = vi.fn();
    const w = mount(DsToastHost, { props: { placement: "bottom-right" } });
    toast({ message: "Deleted", title: "Item removed", tone: "danger", timeout: 0, action: { label: "Undo", onClick } });
    await w.vm.$nextTick();
    expect(w.find(".ds-toast.is-danger").exists()).toBe(true);
    expect(w.find(".ds-toast-ico").exists()).toBe(true);
    expect(w.find(".ds-toast-body b").text()).toBe("Item removed");
    const btn = w.find(".ds-toast-actions .ds-btn");
    expect(btn.text()).toContain("Undo");
    await btn.trigger("click");
    expect(onClick).toHaveBeenCalledOnce();
    expect(w.find(".ds-toast").exists()).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run vue/components/DsToastHost.test.ts`
Expected: FAIL.

- [ ] **Step 3: Rewrite `DsToastHost.vue`:**

```vue
<script setup lang="ts">
import { useToast } from "../composables/useToast";
import DsIcon from "./DsIcon.vue";
import type { ToastPlacement, ToastTone, ToastAction } from "../types";

withDefaults(defineProps<{ placement?: ToastPlacement }>(), { placement: "bottom-right" });

const { toasts, dismiss, pause, resume } = useToast();

const icons: Record<ToastTone, string> = {
  info: "info", success: "check", warn: "warning", danger: "error",
};

function runAction(id: string, action: ToastAction) {
  action.onClick();
  dismiss(id);
}
</script>

<template>
  <TransitionGroup tag="div" name="ds-toast" :class="['ds-toast-stack', `is-${placement}`]">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="ds-toast"
      :class="`is-${t.tone ?? 'info'}`"
      role="status"
      @mouseenter="pause(t.id)"
      @mouseleave="resume(t.id)"
      @focusin="pause(t.id)"
      @focusout="resume(t.id)"
    >
      <span class="ds-toast-ico"><DsIcon :name="icons[t.tone ?? 'info']" :size="17" /></span>
      <div class="ds-toast-body"><b v-if="t.title">{{ t.title }}</b>{{ t.message }}</div>
      <div class="ds-toast-actions">
        <button v-if="t.action" type="button" class="ds-btn is-ghost is-sm" @click="runAction(t.id, t.action)">{{ t.action.label }}</button>
        <button type="button" class="ds-toast-close" aria-label="Dismiss" @click="dismiss(t.id)">×</button>
      </div>
    </div>
  </TransitionGroup>
</template>
```

- [ ] **Step 4: Run tests + typecheck**

Run: `npx vitest run vue/components/DsToastHost.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add vue/components/DsToastHost.vue vue/components/DsToastHost.test.ts
git commit -m "feat(toast): placement prop, tone icon, title, action, pause-on-hover"
```

---

### Task 5: Docs demo + reference regen

**Files:**
- Modify: `pages/system.html` (toast section ~lines 138-155)
- Modify (generated): `reference/manifest.json`, `REFERENCE.md`, `llms.txt`

- [ ] **Step 1: Extend the toast demo** in `pages/system.html`: add `is-info` and `is-warn` static examples alongside success/danger, add an action-button example (`<div class="ds-toast-actions"><button class="ds-btn is-ghost is-sm">Undo</button><button class="ds-toast-close">…</button></div>`), and fix the stale `data-vue` snippet to use the real API:

```html
<template data-vue>
<DsToastHost placement="bottom-right" />
<!-- elsewhere: const { toast } = useToast(); -->
<!-- toast.success('Changes saved', { title: 'Saved' }) -->
</template>
```

Update the caption to mention `.is-info`/`.is-warn` and placement.

- [ ] **Step 2: Lint usage**

Run: `npm run reference:lint`
Expected: PASS (all classes used exist).

- [ ] **Step 3: Regenerate reference**

Run: `npm run reference:build`
Expected: updates manifest/REFERENCE/llms.txt.

- [ ] **Step 4: Commit**

```bash
git add pages/system.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "docs(toast): demo info/warn tones, action button, placement; regen reference"
```

---

### Task 6: Final verification

- [ ] **Step 1: Full suite**

Run: `npm test && npm run typecheck && npm run build`
Expected: all PASS (icons:check, reference:check, reference:lint, coverage:check, vite build, bundle).

- [ ] **Step 2: Manual check** — `npm run dev`, open the System page; trigger each tone, a titled toast, and an action toast in dark + light; confirm placement prop docks the stack and reduced-motion disables animation.

## Self-Review

- **Spec coverage:** §1 types/API → Task 1; §2 CSS → Task 3; §3 host → Task 4; §4 composable → Task 1; §5 icon/docs/reference/tests → Tasks 2,4,5. All covered.
- **Placeholders:** none — all steps carry concrete code/commands.
- **Type consistency:** `ToastFn`, `pause`/`resume`, `icons` map, `runAction` names consistent across Tasks 1 and 4. `error` icon name used in Task 4 is created in Task 2.
- **Open decision resolved:** always render `.ds-toast-actions` wrapper (Task 4) so the close button is pushed right via the wrapper's `margin-left:auto` (Task 3 Step 3), removing `margin-left:auto` from `.ds-toast-close`.
