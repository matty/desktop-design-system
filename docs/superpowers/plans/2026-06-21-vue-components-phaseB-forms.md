# Vue Components — Phase B: Form Controls + DsField Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the form-control tier (`DsInput`, `DsTextarea`, `DsNumber`, `DsSwitch`, `DsCheckbox`, `DsRadioGroup`, `DsSlider`, `DsSegmented`) plus the `DsField` label/hint/error wrapper, and add the `type` prop to the exemplar `DsButton`.

**Architecture:** Vue 3 SFCs following the Phase A pattern (`DsButton` exemplar): `<script setup lang="ts">`, no `<style>`, typed props mapped only to real `.is-*` classes, `v-model` for controls. `DsField` generates an id (`useId`) and provides `{ id, describedby, invalid }` so any nested control auto-wires `<label for>` / `aria-describedby` / `aria-invalid`; controls also accept those props standalone.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vitest + @vue/test-utils + happy-dom, vue-tsc. No new deps.

## Global Constraints

- Vue 3 SFC `<script setup lang="ts">`, NO `<style>` block anywhere in `vue/`.
- A variant/state prop maps ONLY to an `.is-*` class present in `css/components.css`. Tests use `cssHas` (`vue/__support__/css.ts`) to assert this.
- Form-control markup must match the docs exactly: `.ds-input` (+`.is-invalid`/`.is-valid`/`.is-mono`), `.ds-textarea` (+`.is-invalid`/`.is-valid`), `.ds-number > input + .ds-step > button×2`, `<label class="ds-switch"><input type=checkbox><span class="ds-track"></span></label>`, `<label class="ds-check"><input type=checkbox> slot</label>`, `<label class="ds-radio"><input type=radio name> label</label>`, `<input class="ds-slider" type=range>`, `.ds-segmented > button(.is-active)`. Field: `.ds-field > .ds-field-label`, `.ds-field-hint`, `.ds-field-error`.
- `v-model` = `modelValue` + `update:modelValue`. No `<style>`. `inheritAttrs` defaults apply (do not set `inheritAttrs:false` unless a control needs attrs on an inner element — see DsInput note).
- Do NOT modify `js/ds.js`, `css/`, `src/`, `pages/`. New code under `vue/components/`; append exports to `vue/index.ts`. ESM, two-space indentation.
- `npm test`, `npm run typecheck`, `npm run build` stay green.

---

### Task 1: Add `type` prop to DsButton (exemplar completion)

**Files:**
- Modify: `vue/components/DsButton.vue`
- Modify: `vue/components/DsButton.test.ts`

**Interfaces:** Produces `<DsButton type="submit">` rendering `<button type="submit">`; default `"button"`.

- [ ] **Step 1: Add a failing test**

Add to `vue/components/DsButton.test.ts`:
```ts
it("defaults type=button and accepts submit/reset", () => {
  expect(mount(DsButton).find("button").attributes("type")).toBe("button");
  expect(mount(DsButton, { props: { type: "submit" } }).find("button").attributes("type")).toBe("submit");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsButton`
Expected: FAIL — type is undefined (no `type` prop yet).

- [ ] **Step 3: Add the prop + binding**

In `vue/components/DsButton.vue`, add `type?: "button" | "submit" | "reset";` to the props with default `"button"` (add to `withDefaults` second arg: `type: "button"`), and bind on the element: `<button class="ds-btn" :class="classes" :type="type" :disabled="disabled || loading || undefined">`.

- [ ] **Step 4: Verify**

Run: `npm test -- DsButton` → all pass.
Run: `npm run typecheck` → exits 0.

- [ ] **Step 5: Commit**

```bash
git add vue/components/DsButton.vue vue/components/DsButton.test.ts
git commit -m "vue: add type prop to DsButton"
```

---

### Task 2: DsField context + DsField wrapper

**Files:**
- Create: `vue/components/field-context.ts`
- Create: `vue/components/DsField.vue`
- Test: `vue/components/DsField.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Produces: injection key + interface in `field-context.ts`:
  ```ts
  import type { InjectionKey, Ref, ComputedRef } from "vue";
  export interface DsFieldCtx {
    id: Ref<string>;
    describedby: ComputedRef<string | undefined>;
    invalid: ComputedRef<boolean>;
  }
  export const dsFieldKey: InjectionKey<DsFieldCtx> = Symbol("dsField");
  ```
  Consumed by DsField (provides) and the controls (inject, optional).
- `<DsField label? hint? error?>` wraps a control in the default slot; renders `.ds-field` > `.ds-field-label` (with `for`) + slot + `.ds-field-hint` / `.ds-field-error`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h, defineComponent, inject } from "vue";
import DsField from "./DsField.vue";
import { dsFieldKey } from "./field-context";

// a tiny control that consumes the field context
const Probe = defineComponent({
  setup() {
    const ctx = inject(dsFieldKey);
    return () => h("input", { id: ctx?.id.value, "aria-describedby": ctx?.describedby.value, "aria-invalid": ctx?.invalid.value || undefined });
  }
});

describe("DsField", () => {
  it("renders label wired to the control id", () => {
    const w = mount(DsField, { props: { label: "Email" }, slots: { default: () => h(Probe) } });
    const id = w.find("input").attributes("id");
    expect(id).toBeTruthy();
    expect(w.find("label.ds-field-label").attributes("for")).toBe(id);
  });

  it("shows error via .ds-field-error and wires aria-invalid + describedby", () => {
    const w = mount(DsField, { props: { label: "Email", error: "Required" }, slots: { default: () => h(Probe) } });
    expect(w.find(".ds-field-error").text()).toContain("Required");
    expect(w.find("input").attributes("aria-invalid")).toBe("true");
    expect(w.find("input").attributes("aria-describedby")).toContain(w.find(".ds-field-error").attributes("id"));
  });

  it("shows hint via .ds-field-hint when no error", () => {
    const w = mount(DsField, { props: { hint: "We never share it" }, slots: { default: () => h(Probe) } });
    expect(w.find(".ds-field-hint").text()).toBe("We never share it");
    expect(w.find(".ds-field-error").exists()).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsField`
Expected: FAIL — cannot find `./DsField.vue`.

- [ ] **Step 3: Create `vue/components/field-context.ts`** (exact code from Interfaces above).

- [ ] **Step 4: Implement `vue/components/DsField.vue`**

```vue
<script setup lang="ts">
import { computed, provide, useId } from "vue";
import { dsFieldKey } from "./field-context";

const props = defineProps<{ label?: string; hint?: string; error?: string }>();

const id = useId();
const errorId = `${id}-error`;
const hintId = `${id}-hint`;
const invalid = computed(() => !!props.error);
const describedby = computed(() =>
  props.error ? errorId : props.hint ? hintId : undefined
);

provide(dsFieldKey, { id: computed(() => id) as never, describedby, invalid });
</script>

<template>
  <div class="ds-field">
    <label v-if="label" class="ds-field-label" :for="id">{{ label }}</label>
    <slot />
    <div v-if="error" class="ds-field-error" :id="errorId" role="alert">{{ error }}</div>
    <span v-else-if="hint" class="ds-field-hint" :id="hintId">{{ hint }}</span>
  </div>
</template>
```
(Note: `id: computed(() => id)` provides a stable `Ref<string>`-shaped value; `as never` satisfies the `Ref<string>` field type for the static id. Controls read `.value`.)

- [ ] **Step 5: Append export**

```ts
export { default as DsField } from "./components/DsField.vue";
```

- [ ] **Step 6: Verify**

Run: `npm test -- DsField` → 3 passed.
Run: `npm run typecheck` → exits 0.

- [ ] **Step 7: Commit**

```bash
git add vue/components/field-context.ts vue/components/DsField.vue vue/components/DsField.test.ts vue/index.ts
git commit -m "vue: add DsField (label/hint/error context wrapper)"
```

---

### Task 3: DsInput

**Files:**
- Create: `vue/components/DsInput.vue`
- Test: `vue/components/DsInput.test.ts`
- Modify: `vue/index.ts`

**Interfaces:**
- Consumes: `dsFieldKey` (optional inject), `cssHas` (test).
- Produces: `<DsInput v-model type? placeholder? mono? invalid? valid? disabled? id?>`. Renders `<input class="ds-input">` with `.is-mono`/`.is-invalid`/`.is-valid`; `v-model` two-way; inherits field id/aria when inside `DsField`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsInput from "./DsInput.vue";
import DsField from "./DsField.vue";
import { cssHas } from "../__support__/css";

describe("DsInput", () => {
  it("renders .ds-input and v-model round-trips", async () => {
    const w = mount(DsInput, { props: { modelValue: "hi" } });
    const el = w.find("input.ds-input");
    expect((el.element as HTMLInputElement).value).toBe("hi");
    await el.setValue("bye");
    expect(w.emitted("update:modelValue")![0]).toEqual(["bye"]);
  });

  it("maps mono/invalid/valid to real classes", () => {
    for (const cls of ["is-mono", "is-invalid", "is-valid"]) expect(cssHas(cls)).toBe(true);
    expect(mount(DsInput, { props: { modelValue: "", mono: true } }).find("input").classes()).toContain("is-mono");
    expect(mount(DsInput, { props: { modelValue: "", invalid: true } }).find("input").classes()).toContain("is-invalid");
    expect(mount(DsInput, { props: { modelValue: "", valid: true } }).find("input").classes()).toContain("is-valid");
  });

  it("inherits id + aria-invalid from DsField", () => {
    const w = mount(DsField, { props: { label: "Email", error: "x" }, slots: { default: () => h(DsInput, { modelValue: "" }) } });
    const input = w.find("input");
    expect(input.attributes("id")).toBeTruthy();
    expect(input.attributes("aria-invalid")).toBe("true");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- DsInput`
Expected: FAIL — cannot find `./DsInput.vue`.

- [ ] **Step 3: Implement `vue/components/DsInput.vue`**

```vue
<script setup lang="ts">
import { computed, inject } from "vue";
import { dsFieldKey } from "./field-context";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    type?: string;
    placeholder?: string;
    mono?: boolean;
    invalid?: boolean;
    valid?: boolean;
    disabled?: boolean;
    id?: string;
  }>(),
  { type: "text", mono: false, invalid: false, valid: false, disabled: false }
);
const emit = defineEmits<{ "update:modelValue": [string] }>();

const field = inject(dsFieldKey, null);
const resolvedId = computed(() => props.id ?? field?.id.value);
const ariaInvalid = computed(() => props.invalid || field?.invalid.value || undefined);
const classes = computed(() => ({
  "is-mono": props.mono,
  "is-invalid": props.invalid || field?.invalid.value,
  "is-valid": props.valid
}));
</script>

<template>
  <input
    class="ds-input"
    :class="classes"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled || undefined"
    :id="resolvedId"
    :aria-invalid="ariaInvalid"
    :aria-describedby="field?.describedby.value"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
```

- [ ] **Step 4: Append export** `export { default as DsInput } from "./components/DsInput.vue";`

- [ ] **Step 5: Verify** `npm test -- DsInput` → 3 passed; `npm run typecheck` → 0.

- [ ] **Step 6: Commit**
```bash
git add vue/components/DsInput.vue vue/components/DsInput.test.ts vue/index.ts
git commit -m "vue: add DsInput (v-model, field-aware)"
```

---

### Task 4: DsTextarea

**Files:** Create `vue/components/DsTextarea.vue`, `vue/components/DsTextarea.test.ts`; modify `vue/index.ts`.

**Interfaces:** `<DsTextarea v-model invalid? valid? disabled? rows? placeholder? id?>` → `<textarea class="ds-textarea">` with `.is-invalid`/`.is-valid`; field-aware like DsInput.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsTextarea from "./DsTextarea.vue";
import { cssHas } from "../__support__/css";

describe("DsTextarea", () => {
  it("renders .ds-textarea and v-model round-trips", async () => {
    const w = mount(DsTextarea, { props: { modelValue: "a" } });
    await w.find("textarea.ds-textarea").setValue("b");
    expect(w.emitted("update:modelValue")![0]).toEqual(["b"]);
  });
  it("maps invalid/valid to real classes", () => {
    for (const c of ["is-invalid", "is-valid"]) expect(cssHas(c)).toBe(true);
    expect(mount(DsTextarea, { props: { modelValue: "", invalid: true } }).find("textarea").classes()).toContain("is-invalid");
  });
});
```
- [ ] **Step 2: Run → FAIL** (`npm test -- DsTextarea`).
- [ ] **Step 3: Implement `vue/components/DsTextarea.vue`**
```vue
<script setup lang="ts">
import { computed, inject } from "vue";
import { dsFieldKey } from "./field-context";

const props = withDefaults(
  defineProps<{ modelValue?: string; invalid?: boolean; valid?: boolean; disabled?: boolean; rows?: number; placeholder?: string; id?: string }>(),
  { invalid: false, valid: false, disabled: false, rows: 3 }
);
const emit = defineEmits<{ "update:modelValue": [string] }>();
const field = inject(dsFieldKey, null);
const classes = computed(() => ({ "is-invalid": props.invalid || field?.invalid.value, "is-valid": props.valid }));
</script>

<template>
  <textarea
    class="ds-textarea"
    :class="classes"
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled || undefined"
    :id="id ?? field?.id.value"
    :aria-invalid="props.invalid || field?.invalid.value || undefined"
    :aria-describedby="field?.describedby.value"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  ></textarea>
</template>
```
- [ ] **Step 4: Verify** `npm test -- DsTextarea` pass; typecheck 0.
- [ ] **Step 5: Append export** + Commit
```ts
export { default as DsTextarea } from "./components/DsTextarea.vue";
```
```bash
git add vue/components/DsTextarea.vue vue/components/DsTextarea.test.ts vue/index.ts
git commit -m "vue: add DsTextarea"
```

---

### Task 5: DsSwitch

**Files:** Create `DsSwitch.vue`, `DsSwitch.test.ts`; modify `vue/index.ts`.

**Interfaces:** `<DsSwitch v-model>` boolean → `<label class="ds-switch"><input type="checkbox"><span class="ds-track"></span></label>`. Emits boolean.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSwitch from "./DsSwitch.vue";

describe("DsSwitch", () => {
  it("renders .ds-switch with track + checkbox reflecting modelValue", () => {
    const w = mount(DsSwitch, { props: { modelValue: true } });
    expect(w.find("label.ds-switch").exists()).toBe(true);
    expect(w.find("span.ds-track").exists()).toBe(true);
    expect((w.find("input").element as HTMLInputElement).checked).toBe(true);
  });
  it("emits the toggled boolean on change", async () => {
    const w = mount(DsSwitch, { props: { modelValue: false } });
    await w.find("input").setValue(true);
    expect(w.emitted("update:modelValue")![0]).toEqual([true]);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `vue/components/DsSwitch.vue`**
```vue
<script setup lang="ts">
defineProps<{ modelValue?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [boolean] }>();
</script>

<template>
  <label class="ds-switch">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled || undefined"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="ds-track"></span>
  </label>
</template>
```
- [ ] **Step 4: Verify** pass; typecheck 0.
- [ ] **Step 5: Export + commit**
```ts
export { default as DsSwitch } from "./components/DsSwitch.vue";
```
```bash
git add vue/components/DsSwitch.vue vue/components/DsSwitch.test.ts vue/index.ts
git commit -m "vue: add DsSwitch"
```

---

### Task 6: DsCheckbox

**Files:** Create `DsCheckbox.vue`, `DsCheckbox.test.ts`; modify `vue/index.ts`.

**Interfaces:** `<DsCheckbox v-model>` boolean → `<label class="ds-check"><input type="checkbox"> <slot/></label>`. Emits boolean.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsCheckbox from "./DsCheckbox.vue";

describe("DsCheckbox", () => {
  it("renders .ds-check with slot label and reflects modelValue", () => {
    const w = mount(DsCheckbox, { props: { modelValue: true }, slots: { default: () => "Remember me" } });
    expect(w.find("label.ds-check").text()).toContain("Remember me");
    expect((w.find("input").element as HTMLInputElement).checked).toBe(true);
  });
  it("emits boolean on change", async () => {
    const w = mount(DsCheckbox, { props: { modelValue: false } });
    await w.find("input").setValue(true);
    expect(w.emitted("update:modelValue")![0]).toEqual([true]);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `vue/components/DsCheckbox.vue`**
```vue
<script setup lang="ts">
defineProps<{ modelValue?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [boolean] }>();
</script>

<template>
  <label class="ds-check">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled || undefined"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <slot />
  </label>
</template>
```
- [ ] **Step 4: Verify** pass; typecheck 0.
- [ ] **Step 5: Export + commit**
```ts
export { default as DsCheckbox } from "./components/DsCheckbox.vue";
```
```bash
git add vue/components/DsCheckbox.vue vue/components/DsCheckbox.test.ts vue/index.ts
git commit -m "vue: add DsCheckbox"
```

---

### Task 7: DsRadioGroup

**Files:** Create `DsRadioGroup.vue`, `DsRadioGroup.test.ts`; modify `vue/index.ts`.

**Interfaces:** `<DsRadioGroup v-model :options>` where `options: { value: string; label: string }[]`. Renders one `<label class="ds-radio"><input type="radio" :name> label</label>` per option sharing a `useId()` name; emits selected value.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsRadioGroup from "./DsRadioGroup.vue";

const options = [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }];

describe("DsRadioGroup", () => {
  it("renders a .ds-radio per option; checks the selected one", () => {
    const w = mount(DsRadioGroup, { props: { modelValue: "dark", options } });
    const radios = w.findAll("label.ds-radio");
    expect(radios).toHaveLength(2);
    const inputs = w.findAll("input[type=radio]");
    expect((inputs[1].element as HTMLInputElement).checked).toBe(true);
  });
  it("emits the value when an option is chosen", async () => {
    const w = mount(DsRadioGroup, { props: { modelValue: "light", options } });
    await w.findAll("input[type=radio]")[1].setValue(true);
    expect(w.emitted("update:modelValue")![0]).toEqual(["dark"]);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `vue/components/DsRadioGroup.vue`**
```vue
<script setup lang="ts">
import { useId } from "vue";

defineProps<{ modelValue?: string; options: { value: string; label: string }[]; disabled?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();
const name = useId();
</script>

<template>
  <div class="ds-radio-group" role="radiogroup">
    <label v-for="opt in options" :key="opt.value" class="ds-radio">
      <input
        type="radio"
        :name="name"
        :value="opt.value"
        :checked="modelValue === opt.value"
        :disabled="disabled || undefined"
        @change="emit('update:modelValue', opt.value)"
      />
      {{ opt.label }}
    </label>
  </div>
</template>
```
(Note: `.ds-radio-group` has no CSS rule — it is a neutral, unstyled grouping container, NOT a variant class. The styled class is `.ds-radio` on each label. Do not add `.is-*` here.)

- [ ] **Step 4: Verify** pass; typecheck 0.
- [ ] **Step 5: Export + commit**
```ts
export { default as DsRadioGroup } from "./components/DsRadioGroup.vue";
```
```bash
git add vue/components/DsRadioGroup.vue vue/components/DsRadioGroup.test.ts vue/index.ts
git commit -m "vue: add DsRadioGroup"
```

---

### Task 8: DsSlider

**Files:** Create `DsSlider.vue`, `DsSlider.test.ts`; modify `vue/index.ts`.

**Interfaces:** `<DsSlider v-model :min :max :step>` number → `<input class="ds-slider" type="range">`. Emits number.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSlider from "./DsSlider.vue";

describe("DsSlider", () => {
  it("renders .ds-slider range with min/max/step/value", () => {
    const w = mount(DsSlider, { props: { modelValue: 0.5, min: 0, max: 1, step: 0.01 } });
    const el = w.find("input.ds-slider").element as HTMLInputElement;
    expect(el.type).toBe("range");
    expect(el.max).toBe("1");
  });
  it("emits a number on input", async () => {
    const w = mount(DsSlider, { props: { modelValue: 0, min: 0, max: 10 } });
    const el = w.find("input.ds-slider");
    (el.element as HTMLInputElement).value = "7";
    await el.trigger("input");
    expect(w.emitted("update:modelValue")![0]).toEqual([7]);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `vue/components/DsSlider.vue`**
```vue
<script setup lang="ts">
withDefaults(defineProps<{ modelValue?: number; min?: number; max?: number; step?: number; disabled?: boolean }>(), {
  min: 0, max: 100, step: 1, disabled: false
});
const emit = defineEmits<{ "update:modelValue": [number] }>();
</script>

<template>
  <input
    class="ds-slider"
    type="range"
    :min="min"
    :max="max"
    :step="step"
    :value="modelValue"
    :disabled="disabled || undefined"
    @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
  />
</template>
```
- [ ] **Step 4: Verify** pass; typecheck 0.
- [ ] **Step 5: Export + commit**
```ts
export { default as DsSlider } from "./components/DsSlider.vue";
```
```bash
git add vue/components/DsSlider.vue vue/components/DsSlider.test.ts vue/index.ts
git commit -m "vue: add DsSlider"
```

---

### Task 9: DsSegmented

**Files:** Create `DsSegmented.vue`, `DsSegmented.test.ts`; modify `vue/index.ts`.

**Interfaces:** `<DsSegmented v-model :options>` where `options: { value: string; label: string }[]` → `.ds-segmented > button(.is-active)` per option. Emits selected value.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSegmented from "./DsSegmented.vue";
import { cssHas } from "../__support__/css";

const options = [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }];

describe("DsSegmented", () => {
  it("renders .ds-segmented with a button per option; active gets .is-active", () => {
    expect(cssHas("is-active")).toBe(true);
    const w = mount(DsSegmented, { props: { modelValue: "light", options } });
    const btns = w.findAll(".ds-segmented button");
    expect(btns).toHaveLength(2);
    expect(btns[1].classes()).toContain("is-active");
    expect(btns[0].classes()).not.toContain("is-active");
  });
  it("emits the value on click", async () => {
    const w = mount(DsSegmented, { props: { modelValue: "dark", options } });
    await w.findAll(".ds-segmented button")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual(["light"]);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `vue/components/DsSegmented.vue`**
```vue
<script setup lang="ts">
defineProps<{ modelValue?: string; options: { value: string; label: string }[] }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();
</script>

<template>
  <div class="ds-segmented" role="group">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :class="{ 'is-active': modelValue === opt.value }"
      :aria-pressed="modelValue === opt.value"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
```
- [ ] **Step 4: Verify** pass; typecheck 0.
- [ ] **Step 5: Export + commit**
```ts
export { default as DsSegmented } from "./components/DsSegmented.vue";
```
```bash
git add vue/components/DsSegmented.vue vue/components/DsSegmented.test.ts vue/index.ts
git commit -m "vue: add DsSegmented"
```

---

### Task 10: DsNumber + Phase B gate

**Files:** Create `DsNumber.vue`, `DsNumber.test.ts`; modify `vue/index.ts`.

**Interfaces:** `<DsNumber v-model :min :max :step>` number → `.ds-number > input + .ds-step > button(up)+button(down)`. Step buttons inc/dec by `step`, clamped to min/max. Emits number.

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsNumber from "./DsNumber.vue";

describe("DsNumber", () => {
  it("renders .ds-number with input + two .ds-step buttons", () => {
    const w = mount(DsNumber, { props: { modelValue: 5 } });
    expect(w.find(".ds-number input").exists()).toBe(true);
    expect(w.findAll(".ds-step button")).toHaveLength(2);
    expect((w.find("input").element as HTMLInputElement).value).toBe("5");
  });
  it("increments/decrements by step, clamped to max/min", async () => {
    const w = mount(DsNumber, { props: { modelValue: 9, min: 0, max: 10, step: 1 } });
    const [up, down] = w.findAll(".ds-step button");
    await up.trigger("click");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([10]); // clamped at max
    await up.trigger("click");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([10]); // stays at max
    await down.trigger("click");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([9]);
  });
  it("emits a number on direct input", async () => {
    const w = mount(DsNumber, { props: { modelValue: 1 } });
    const el = w.find("input");
    (el.element as HTMLInputElement).value = "42";
    await el.trigger("input");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([42]);
  });
});
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement `vue/components/DsNumber.vue`**
```vue
<script setup lang="ts">
const props = withDefaults(
  defineProps<{ modelValue?: number; min?: number; max?: number; step?: number; disabled?: boolean }>(),
  { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY, step: 1, disabled: false }
);
const emit = defineEmits<{ "update:modelValue": [number] }>();

function clamp(n: number): number {
  return Math.min(props.max, Math.max(props.min, n));
}
function bump(dir: 1 | -1) {
  emit("update:modelValue", clamp((props.modelValue ?? 0) + dir * props.step));
}
function onInput(e: Event) {
  const n = Number((e.target as HTMLInputElement).value);
  if (!Number.isNaN(n)) emit("update:modelValue", n);
}
</script>

<template>
  <div class="ds-number">
    <input type="text" :value="modelValue" :disabled="disabled || undefined" @input="onInput" />
    <div class="ds-step">
      <button type="button" :disabled="disabled || undefined" @click="bump(1)">
        <svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m18 15l-6-6l-6 6"/></svg>
      </button>
      <button type="button" :disabled="disabled || undefined" @click="bump(-1)">
        <svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9l6 6l6-6"/></svg>
      </button>
    </div>
  </div>
</template>
```
- [ ] **Step 4: Append export** `export { default as DsNumber } from "./components/DsNumber.vue";`

- [ ] **Step 5: Full Phase B gate**

Run: `npm test` → all suites pass.
Run: `npm run typecheck` → exits 0.
Run: `npm run build` → exit 0 (expected ds.js/docs.js/sortable warnings only).

- [ ] **Step 6: Commit**
```bash
git add vue/components/DsNumber.vue vue/components/DsNumber.test.ts vue/index.ts
git commit -m "vue: add DsNumber + Phase B form-control set"
```

---

## Self-Review

- **Spec coverage (Phase B):** DsButton type (T1), DsField + context (T2), DsInput (T3), DsTextarea (T4), DsSwitch (T5), DsCheckbox (T6), DsRadioGroup (T7), DsSlider (T8), DsSegmented (T9), DsNumber (T10). All form-tier components + field wrapper covered.
- **Placeholder scan:** none — every step has full code or an exact command.
- **Type consistency:** `dsFieldKey`/`DsFieldCtx` defined in T2 and consumed by DsInput/DsTextarea (T3/T4). `v-model` is `modelValue`/`update:modelValue` throughout. Variant props map only to confirmed classes (`is-mono`/`is-invalid`/`is-valid`/`is-active`). `.ds-radio-group` and `.ds-segmented` group containers are explicitly noted as non-variant neutral wrappers (no invented `.is-*`).
- **CSS-contract note:** `.ds-field-label`/`.ds-field-hint`/`.ds-field-error` confirmed in `components.css`; the field markup matches the docs (`.ds-field > .ds-field-label`).
