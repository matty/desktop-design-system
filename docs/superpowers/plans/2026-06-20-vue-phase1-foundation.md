# Vue Components — Phase 1: Foundation (Tooling + Types + Composables) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Vue test/typecheck tooling and the shared composables + types that all 10 high-value components depend on.

**Architecture:** A new top-level `vue/` directory holds SFCs (later phases), `composables/` (reactive TypeScript ports of the `js/ds.js` focus-trap / roving-tabindex / live-region primitives + dismiss + toast queue), `types.ts`, and an `index.ts` barrel. Tests run under Vitest + happy-dom; types are checked with `vue-tsc`. No `<style>` blocks; components consume the existing CSS.

**Tech Stack:** Vue 3 (`<script setup lang="ts">`), Vitest, @vue/test-utils, happy-dom, @vitejs/plugin-vue, vue-tsc, TypeScript. (Phase 2 adds `sortablejs`.)

## Global Constraints

- Vue 3 SFCs, `<script setup lang="ts">`, raw `.vue` source (consumer build compiles).
- No `<style>` blocks anywhere in `vue/`; visuals come only from existing `.ds-*` / `.is-*` classes + tokens.
- Behavior strategy = Approach A: reactive reimplementation; do NOT modify `js/ds.js`.
- All new code lives under `vue/`. Do not touch `src/`, `css/`, `pages/`, or `js/`.
- The existing build must stay green: `npm run build` and `npm run icons:check` keep passing.
- `dist/` stays gitignored; no new **runtime** dependency added to this repo (Vue/Vitest/etc. are devDependencies; `sortablejs` is a consumer install).
- Two-space indentation; ESM throughout.

---

### Task 1: Tooling — test runner, typecheck, configs

**Files:**
- Modify: `package.json` (add devDependencies + scripts)
- Create: `vitest.config.mjs`
- Create: `tsconfig.json`
- Create: `vue/env.d.ts`
- Create: `vue/__smoke__.test.ts` (temporary smoke test, deleted in Step 7)

**Interfaces:**
- Produces: `npm test` (Vitest run), `npm run test:watch`, `npm run typecheck` (vue-tsc).

- [ ] **Step 1: Add devDependencies and scripts to `package.json`**

Add these keys to the existing `devDependencies` object (keep the current entries):
```json
    "vue": "^3.5.13",
    "@vue/test-utils": "^2.4.6",
    "@vitejs/plugin-vue": "^5.2.1",
    "vitest": "^3.0.5",
    "happy-dom": "^16.7.0",
    "typescript": "^5.7.3",
    "vue-tsc": "^2.2.0"
```
Add these to the `scripts` object:
```json
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "vue-tsc --noEmit -p tsconfig.json"
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: completes; `node_modules/vitest` and `node_modules/vue` exist.

- [ ] **Step 3: Create `vitest.config.mjs`**

```js
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "happy-dom",
    include: ["vue/**/*.test.ts"],
    globals: true
  }
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"]
  },
  "include": ["vue/**/*.ts", "vue/**/*.vue"]
}
```

- [ ] **Step 5: Create `vue/env.d.ts` so `vue-tsc` understands `.vue` imports**

```ts
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

- [ ] **Step 6: Create a smoke test `vue/__smoke__.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";

describe("tooling smoke", () => {
  it("mounts a trivial component", () => {
    const C = defineComponent({ setup: () => () => h("button", { class: "ds-btn" }, "Hi") });
    const w = mount(C);
    expect(w.find(".ds-btn").text()).toBe("Hi");
  });
});
```

- [ ] **Step 7: Run test + typecheck, then delete the smoke test**

Run: `npm test`
Expected: 1 passed.
Run: `npm run typecheck`
Expected: exits 0 (no type errors).
Then delete the smoke file: `rm vue/__smoke__.test.ts`

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.mjs tsconfig.json vue/env.d.ts
git commit -m "vue: add Vitest + vue-tsc tooling for the Vue component layer"
```

---

### Task 2: Shared types (`vue/types.ts`)

**Files:**
- Create: `vue/types.ts`
- Test: `vue/types.test.ts`

**Interfaces:**
- Produces: `ComboOption`, `TreeNode`, `MenuItem`, `TabItem`, `ToastOptions` — imported by composables and components.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expectTypeOf } from "vitest";
import type { ComboOption, TreeNode, MenuItem, TabItem, ToastOptions } from "./types";

describe("types", () => {
  it("ComboOption shape", () => {
    expectTypeOf<ComboOption>().toMatchTypeOf<{ value: string; label: string }>();
  });
  it("TreeNode is recursive", () => {
    const n: TreeNode = { id: "a", label: "A", children: [{ id: "b", label: "B" }] };
    expectTypeOf(n.children).toMatchTypeOf<TreeNode[] | undefined>();
  });
  it("ToastOptions tone is a union", () => {
    expectTypeOf<ToastOptions["tone"]>().toMatchTypeOf<
      "info" | "success" | "warn" | "danger" | undefined
    >();
  });
  it("MenuItem and TabItem exist", () => {
    expectTypeOf<MenuItem>().toMatchTypeOf<{ id: string }>();
    expectTypeOf<TabItem>().toMatchTypeOf<{ id: string; label: string }>();
  });
});
```

- [ ] **Step 2: Run typecheck to verify it fails**

Run: `npm run typecheck`
Expected: FAIL — cannot find module `./types`.

- [ ] **Step 3: Create `vue/types.ts`**

```ts
export interface ComboOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

export interface MenuItem {
  id: string;
  label?: string;
  danger?: boolean;
  separator?: boolean;
  disabled?: boolean;
  children?: MenuItem[];
  onSelect?: () => void;
}

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

export type ToastTone = "info" | "success" | "warn" | "danger";

export interface ToastOptions {
  id?: string;
  message: string;
  tone?: ToastTone;
  timeout?: number;
  assertive?: boolean;
}
```

- [ ] **Step 4: Run typecheck + test to verify pass**

Run: `npm run typecheck`
Expected: exits 0.
Run: `npm test -- types`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add vue/types.ts vue/types.test.ts
git commit -m "vue: add shared component types"
```

---

### Task 3: `useDismiss` composable

**Files:**
- Create: `vue/composables/useDismiss.ts`
- Test: `vue/composables/useDismiss.test.ts`

**Interfaces:**
- Produces: `useDismiss({ active, root, onDismiss, escape? }): void` — closes on outside pointerdown or Escape while `active` is true. Used by DsCombobox, DsDropdownMenu, DsDialog.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref, h } from "vue";
import { useDismiss } from "./useDismiss";

function harness(onDismiss: () => void) {
  return defineComponent({
    setup() {
      const root = ref<HTMLElement | null>(null);
      const active = ref(true);
      useDismiss({ active, root, onDismiss });
      return () => h("div", { ref: root }, [h("button", "inside")]);
    }
  });
}

describe("useDismiss", () => {
  it("fires onDismiss on outside pointerdown", () => {
    const cb = vi.fn();
    mount(harness(cb), { attachTo: document.body });
    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("fires onDismiss on Escape", () => {
    const cb = vi.fn();
    mount(harness(cb), { attachTo: document.body });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not fire for clicks inside root", () => {
    const cb = vi.fn();
    const w = mount(harness(cb), { attachTo: document.body });
    w.find("button").element.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    expect(cb).not.toHaveBeenCalled();
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- useDismiss`
Expected: FAIL — cannot find module `./useDismiss`.

- [ ] **Step 3: Implement `vue/composables/useDismiss.ts`**

```ts
import { onBeforeUnmount, watch, type Ref } from "vue";

export interface DismissOptions {
  active: Ref<boolean>;
  root: Ref<HTMLElement | null>;
  onDismiss: () => void;
  escape?: boolean;
}

export function useDismiss(opts: DismissOptions): void {
  const escape = opts.escape ?? true;

  function onPointer(e: MouseEvent) {
    const root = opts.root.value;
    if (root && !root.contains(e.target as Node)) opts.onDismiss();
  }
  function onKey(e: KeyboardEvent) {
    if (escape && e.key === "Escape") opts.onDismiss();
  }
  function attach() {
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey);
  }
  function detach() {
    document.removeEventListener("pointerdown", onPointer, true);
    document.removeEventListener("keydown", onKey);
  }

  watch(opts.active, (v) => (v ? attach() : detach()), { immediate: true });
  onBeforeUnmount(detach);
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `npm test -- useDismiss`
Expected: 3 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add vue/composables/useDismiss.ts vue/composables/useDismiss.test.ts
git commit -m "vue: add useDismiss composable (outside-click + Escape)"
```

---

### Task 4: `useFocusTrap` composable

**Files:**
- Create: `vue/composables/useFocusTrap.ts`
- Test: `vue/composables/useFocusTrap.test.ts`

**Interfaces:**
- Produces: `useFocusTrap(container: Ref<HTMLElement|null>, active: Ref<boolean>): void` — traps Tab within `container` while active, focuses first focusable on activate, restores prior focus on deactivate. Port of `window.dsFocusTrap` in `js/ds.js`. Used by DsDialog, DsContextMenu.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref, h, nextTick } from "vue";
import { useFocusTrap } from "./useFocusTrap";

const Harness = defineComponent({
  setup() {
    const box = ref<HTMLElement | null>(null);
    const active = ref(false);
    useFocusTrap(box, active);
    return { box, active };
  },
  render() {
    return this.active
      ? h("div", { ref: "box" }, [h("button", "first"), h("button", "last")])
      : h("div");
  }
});

describe("useFocusTrap", () => {
  it("focuses the first focusable when activated", async () => {
    const w = mount(Harness, { attachTo: document.body });
    w.vm.active = true;
    await nextTick();
    await nextTick();
    expect(document.activeElement?.textContent).toBe("first");
  });

  it("wraps focus from last to first on Tab", async () => {
    const w = mount(Harness, { attachTo: document.body });
    w.vm.active = true;
    await nextTick();
    await nextTick();
    const buttons = document.querySelectorAll("button");
    (buttons[1] as HTMLElement).focus();
    buttons[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement?.textContent).toBe("first");
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- useFocusTrap`
Expected: FAIL — cannot find module `./useFocusTrap`.

- [ ] **Step 3: Implement `vue/composables/useFocusTrap.ts`**

```ts
import { onBeforeUnmount, watch, nextTick, type Ref } from "vue";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),' +
  'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function focusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (n) =>
      !n.hidden &&
      n.offsetWidth > 0 &&
      n.offsetHeight > 0 &&
      getComputedStyle(n).visibility !== "hidden"
  );
}

export function useFocusTrap(container: Ref<HTMLElement | null>, active: Ref<boolean>): void {
  let prev: HTMLElement | null = null;

  function onKey(e: KeyboardEvent) {
    const el = container.value;
    if (!el || e.key !== "Tab") return;
    const list = focusable(el);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  watch(
    active,
    async (v) => {
      if (v) {
        prev = document.activeElement as HTMLElement;
        await nextTick();
        const el = container.value;
        if (!el) return;
        el.addEventListener("keydown", onKey);
        const list = focusable(el);
        if (list[0]) list[0].focus();
      } else {
        const el = container.value;
        if (el) el.removeEventListener("keydown", onKey);
        if (prev && prev.focus) prev.focus();
        prev = null;
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    const el = container.value;
    if (el) el.removeEventListener("keydown", onKey);
  });
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `npm test -- useFocusTrap`
Expected: 2 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add vue/composables/useFocusTrap.ts vue/composables/useFocusTrap.test.ts
git commit -m "vue: add useFocusTrap composable (port of dsFocusTrap)"
```

---

### Task 5: `useRovingTabindex` composable

**Files:**
- Create: `vue/composables/useRovingTabindex.ts`
- Test: `vue/composables/useRovingTabindex.test.ts`

**Interfaces:**
- Produces: `useRovingTabindex(container, active, opts?)` where
  `opts = { selector?: string; orientation?: 'vertical'|'horizontal'|'both'; onActivate?: (el: HTMLElement) => void }`.
  Arrow/Home/End move focus among `selector` matches and keep a single tabbable item. Port of `window.dsRovingTabindex`. Used by DsContextMenu, DsDropdownMenu.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref, h } from "vue";
import { useRovingTabindex } from "./useRovingTabindex";

const Harness = defineComponent({
  setup() {
    const box = ref<HTMLElement | null>(null);
    const active = ref(true);
    useRovingTabindex(box, active, { selector: '[role="menuitem"]' });
    return () =>
      h("div", { ref: box }, [
        h("button", { role: "menuitem" }, "a"),
        h("button", { role: "menuitem" }, "b"),
        h("button", { role: "menuitem" }, "c")
      ]);
  }
});

describe("useRovingTabindex", () => {
  it("makes only the first item tabbable initially", () => {
    mount(Harness, { attachTo: document.body });
    const items = document.querySelectorAll('[role="menuitem"]');
    expect((items[0] as HTMLElement).tabIndex).toBe(0);
    expect((items[1] as HTMLElement).tabIndex).toBe(-1);
  });

  it("ArrowDown moves focus to the next item", () => {
    mount(Harness, { attachTo: document.body });
    const items = document.querySelectorAll('[role="menuitem"]');
    (items[0] as HTMLElement).focus();
    items[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(document.activeElement?.textContent).toBe("b");
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- useRovingTabindex`
Expected: FAIL — cannot find module `./useRovingTabindex`.

- [ ] **Step 3: Implement `vue/composables/useRovingTabindex.ts`**

```ts
import { onBeforeUnmount, watch, type Ref } from "vue";

export interface RovingOptions {
  selector?: string;
  orientation?: "vertical" | "horizontal" | "both";
  onActivate?: (el: HTMLElement) => void;
}

export function useRovingTabindex(
  container: Ref<HTMLElement | null>,
  active: Ref<boolean>,
  opts: RovingOptions = {}
): void {
  const selector =
    opts.selector || '[role="menuitem"],[role="treeitem"],[role="option"]';
  const orientation = opts.orientation || "vertical";

  function items(el: HTMLElement): HTMLElement[] {
    return Array.from(el.querySelectorAll<HTMLElement>(selector)).filter(
      (n) => n.offsetParent !== null && n.getAttribute("aria-disabled") !== "true"
    );
  }
  function setActive(list: HTMLElement[], idx: number) {
    list.forEach((n, i) => (n.tabIndex = i === idx ? 0 : -1));
    if (list[idx]) list[idx].focus();
  }
  function init() {
    const el = container.value;
    if (!el) return;
    items(el).forEach((n, i) => (n.tabIndex = i === 0 ? 0 : -1));
  }
  function onKey(e: KeyboardEvent) {
    const el = container.value;
    if (!el) return;
    const list = items(el);
    const idx = list.indexOf(document.activeElement as HTMLElement);
    if (idx < 0) return;
    let map: Record<string, number> = {};
    if (orientation === "horizontal") map = { ArrowLeft: idx - 1, ArrowRight: idx + 1 };
    else if (orientation === "vertical") map = { ArrowUp: idx - 1, ArrowDown: idx + 1 };
    else map = { ArrowLeft: idx - 1, ArrowRight: idx + 1, ArrowUp: idx - 1, ArrowDown: idx + 1 };
    if (map[e.key] != null) {
      e.preventDefault();
      setActive(list, (map[e.key] + list.length) % list.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(list, 0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(list, list.length - 1);
    } else if ((e.key === "Enter" || e.key === " ") && opts.onActivate) {
      e.preventDefault();
      opts.onActivate(list[idx]);
    }
  }

  watch(
    active,
    (v) => {
      const el = container.value;
      if (!el) return;
      if (v) {
        el.addEventListener("keydown", onKey);
        init();
      } else {
        el.removeEventListener("keydown", onKey);
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    const el = container.value;
    if (el) el.removeEventListener("keydown", onKey);
  });
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `npm test -- useRovingTabindex`
Expected: 2 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add vue/composables/useRovingTabindex.ts vue/composables/useRovingTabindex.test.ts
git commit -m "vue: add useRovingTabindex composable (port of dsRovingTabindex)"
```

---

### Task 6: `useAnnounce` composable

**Files:**
- Create: `vue/composables/useAnnounce.ts`
- Test: `vue/composables/useAnnounce.test.ts`

**Interfaces:**
- Produces: `useAnnounce(): { announce(message: string, opts?: { assertive?: boolean }): void }`. Creates/reuses `#ds-live-polite` / `#ds-live-assertive` regions (class `ds-live`). Port of `window.dsAnnounce`. Used by useToast.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAnnounce } from "./useAnnounce";

describe("useAnnounce", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  it("creates a polite live region and sets the message", () => {
    const { announce } = useAnnounce();
    announce("Saved");
    const region = document.getElementById("ds-live-polite");
    expect(region).not.toBeNull();
    expect(region?.getAttribute("aria-live")).toBe("polite");
    vi.runAllTimers();
    expect(region?.textContent).toBe("Saved");
  });

  it("uses an assertive region when requested", () => {
    const { announce } = useAnnounce();
    announce("Error", { assertive: true });
    expect(document.getElementById("ds-live-assertive")?.getAttribute("aria-live")).toBe("assertive");
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- useAnnounce`
Expected: FAIL — cannot find module `./useAnnounce`.

- [ ] **Step 3: Implement `vue/composables/useAnnounce.ts`**

```ts
export interface AnnounceOptions {
  assertive?: boolean;
}

function ensureRegion(assertive: boolean): HTMLElement {
  const id = assertive ? "ds-live-assertive" : "ds-live-polite";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    el.className = "ds-live";
    el.setAttribute("aria-live", assertive ? "assertive" : "polite");
    el.setAttribute("aria-atomic", "true");
    document.body.appendChild(el);
  }
  return el;
}

export function useAnnounce() {
  function announce(message: string, opts: AnnounceOptions = {}) {
    const el = ensureRegion(!!opts.assertive);
    el.textContent = "";
    // Re-announce even identical text by clearing then setting on a tick.
    setTimeout(() => {
      el.textContent = message;
    }, 30);
  }
  return { announce };
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `npm test -- useAnnounce`
Expected: 2 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add vue/composables/useAnnounce.ts vue/composables/useAnnounce.test.ts
git commit -m "vue: add useAnnounce composable (port of dsAnnounce)"
```

---

### Task 7: `useToast` composable (shared queue)

**Files:**
- Create: `vue/composables/useToast.ts`
- Test: `vue/composables/useToast.test.ts`

**Interfaces:**
- Consumes: `ToastOptions` from `vue/types.ts`; `useAnnounce` from Task 6.
- Produces: `useToast(): { toasts: readonly ActiveToast[]; toast(opts: ToastOptions): string; dismiss(id: string): void }` where `ActiveToast = ToastOptions & { id: string }`. A module-level reactive queue shared across callers; consumed by DsToastHost (Phase 3).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useToast } from "./useToast";

describe("useToast", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
    const { toasts, dismiss } = useToast();
    [...toasts].forEach((t) => dismiss(t.id));
  });

  it("adds a toast and returns its id", () => {
    const { toast, toasts } = useToast();
    const id = toast({ message: "Hello" });
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].tone).toBe("info");
  });

  it("auto-dismisses after the timeout", () => {
    const { toast, toasts } = useToast();
    toast({ message: "Bye", timeout: 1000 });
    expect(toasts.length).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(toasts.length).toBe(0);
  });

  it("dismiss removes a specific toast", () => {
    const { toast, dismiss, toasts } = useToast();
    const id = toast({ message: "X", timeout: 0 });
    dismiss(id);
    expect(toasts.length).toBe(0);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- useToast`
Expected: FAIL — cannot find module `./useToast`.

- [ ] **Step 3: Implement `vue/composables/useToast.ts`**

```ts
import { reactive, readonly } from "vue";
import type { ToastOptions } from "../types";
import { useAnnounce } from "./useAnnounce";

export interface ActiveToast extends ToastOptions {
  id: string;
}

const state = reactive<{ toasts: ActiveToast[] }>({ toasts: [] });
let seq = 0;
const { announce } = useAnnounce();

export function useToast() {
  function toast(opts: ToastOptions): string {
    const id = opts.id ?? `toast-${++seq}`;
    const item: ActiveToast = { tone: "info", timeout: 4000, ...opts, id };
    state.toasts.push(item);
    announce(item.message, { assertive: item.assertive });
    if (item.timeout && item.timeout > 0) {
      setTimeout(() => dismiss(id), item.timeout);
    }
    return id;
  }
  function dismiss(id: string): void {
    const i = state.toasts.findIndex((t) => t.id === id);
    if (i >= 0) state.toasts.splice(i, 1);
  }
  return { toasts: readonly(state.toasts), toast, dismiss };
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `npm test -- useToast`
Expected: 3 passed.
Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add vue/composables/useToast.ts vue/composables/useToast.test.ts
git commit -m "vue: add useToast composable (shared reactive queue)"
```

---

### Task 8: Barrel export (`vue/index.ts`) + full Phase-1 gate

**Files:**
- Create: `vue/index.ts`
- Test: `vue/index.test.ts`

**Interfaces:**
- Produces: a single import surface for composables + types. Component exports are appended in Phases 2–3.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import * as api from "./index";

describe("barrel", () => {
  it("re-exports all composables", () => {
    for (const name of [
      "useDismiss",
      "useFocusTrap",
      "useRovingTabindex",
      "useAnnounce",
      "useToast"
    ]) {
      expect(typeof (api as Record<string, unknown>)[name]).toBe("function");
    }
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- index`
Expected: FAIL — cannot find module `./index`.

- [ ] **Step 3: Create `vue/index.ts`**

```ts
// Public surface for the design-language Vue layer.
// Components are appended in later phases.
export * from "./types";
export { useDismiss } from "./composables/useDismiss";
export { useFocusTrap } from "./composables/useFocusTrap";
export { useRovingTabindex } from "./composables/useRovingTabindex";
export { useAnnounce } from "./composables/useAnnounce";
export { useToast } from "./composables/useToast";
```

- [ ] **Step 4: Full Phase-1 gate**

Run: `npm test`
Expected: all suites pass (types, useDismiss, useFocusTrap, useRovingTabindex, useAnnounce, useToast, index).
Run: `npm run typecheck`
Expected: exits 0.
Run: `npm run build`
Expected: unaffected — `icons:check passed`, 11 pages emitted, bundle written, exit 0.

- [ ] **Step 5: Commit**

```bash
git add vue/index.ts vue/index.test.ts
git commit -m "vue: add barrel export for composables and types"
```

---

## Self-Review

- **Spec coverage (Phase 1 portion):** tooling (Task 1), types (Task 2), composables `useDismiss`/`useFocusTrap`/`useRovingTabindex`/`useAnnounce`/`useToast` (Tasks 3–7), barrel (Task 8). All present. Component tasks live in Phases 2–3; bundle/docs in Phase 4.
- **Placeholder scan:** none — every step has full code or an exact command.
- **Type consistency:** `ActiveToast = ToastOptions & { id }`; `ToastOptions`/`ComboOption`/`TreeNode`/`MenuItem`/`TabItem` defined in Task 2 and consumed consistently. Composable signatures here match the Interfaces blocks referenced by Phases 2–3.
