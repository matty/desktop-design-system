# Popover Collision Flip — Design

Date: 2026-06-25
Status: Approved (requirements), pending spec review

## Summary

`DsPopover` currently hard-positions its panel `absolute; top:100%; left:0` inside the
anchor — always below-left, with no awareness of the viewport. Near a screen edge it
overflows or clips. This adds **collision-aware placement**: a small reusable
`useFlip` composable measures the trigger and floating panel against the viewport and
(1) flips the panel to the opposite side when the preferred side lacks room, and
(2) shifts it horizontally to stay on-screen. Applied to `DsPopover` only this
iteration; the composable is designed to be reusable by menus later.

No new dependencies — hand-rolled with `getBoundingClientRect`, consistent with the
project's dependency-light / offline-bundle constraint. `DsContextMenu` already does
hand-rolled rect positioning, so there is precedent.

## Current state

- `vue/components/DsPopover.vue`: `open` model, click-toggle, `useDismiss` for
  outside-click. Renders `<div class="ds-popover-anchor"><button.ds-btn>…</button>
  <div v-if="open" class="ds-popover">…</div></div>`.
- CSS (`css/components.css`):
  - `.ds-popover-anchor { position:relative; display:inline-block; }`
  - `.ds-popover-anchor .ds-popover { position:absolute; top:calc(100% + 6px); left:0; z-index:50; min-width:180px; }`
- No positioning composable exists (`vue/composables/`: useAnnounce, useDismiss,
  useFocusTrap, useRovingTabindex, useToast).

## Decisions (locked)

1. **Scope:** `DsPopover` only. `DsTooltip` untouched (stays pure-CSS).
2. **Axes:** vertical flip (bottom↔top) + horizontal shift-to-fit. No left/right
   placements, no start/end alignment (the shift handles overflow).
3. **Positioning model:** keep panel `absolute` within the anchor. Flip = a
   `data-placement` attribute toggling top/bottom CSS; shift = an inline `left`.
   No portal/teleport.
4. **No new dependencies.** Hand-rolled measurement.

## Composable — `vue/composables/useFlip.ts`

### Signature

```ts
import type { Ref } from "vue";

export interface UseFlipOptions {
  trigger: Ref<HTMLElement | null>;
  floating: Ref<HTMLElement | null>;
  open: Ref<boolean>;
  placement?: "bottom" | "top"; // preferred side; default "bottom"
  gap?: number;     // px between trigger and panel; default 6
  padding?: number; // min px from viewport edge; default 8
}

export interface UseFlipReturn {
  placement: Ref<"bottom" | "top">;          // resolved side after flip
  floatStyle: Ref<{ left: string }>;          // horizontal shift, e.g. { left: "-24px" }
}

export function useFlip(opts: UseFlipOptions): UseFlipReturn;
```

### Behavior

- **Measure** the *trigger* rect (not the anchor — the anchor would include the open
  panel) and the floating element's `offsetWidth`/`offsetHeight`, against
  `window.innerWidth`/`innerHeight`.
- **Main axis (flip):** let `preferred` be the `placement` option.
  - `roomBelow = innerHeight - triggerRect.bottom - gap`
  - `roomAbove = triggerRect.top - gap`
  - Resolve to the opposite side only when the preferred side can't fit the panel AND
    the opposite side has more room:
    - preferred `"bottom"`: use `"top"` if `floatH > roomBelow && roomAbove > roomBelow`.
    - preferred `"top"`: use `"bottom"` if `floatH > roomAbove && roomBelow > roomAbove`.
  - Otherwise keep preferred. Result → `placement` ref.
- **Cross axis (shift):** the panel's natural left edge sits at `triggerRect.left`
  (CSS `left:0`). Compute a shift so it stays within `[padding, innerWidth - padding]`:
  - `overflowRight = (triggerRect.left + floatW + padding) - innerWidth`
  - `shift = overflowRight > 0 ? -overflowRight : 0`
  - then clamp left: if `triggerRect.left + shift < padding`, `shift += padding - (triggerRect.left + shift)`
  - `floatStyle = { left: \`${Math.round(shift)}px\` }` (so `{ left: "0px" }` when no overflow).
- **Recompute** via an internal `update()`:
  - `watch(open)` → on `true`, `nextTick(update)` (panel must be in the DOM to measure).
  - While open, add `window` `scroll` (capture: true) + `resize` listeners that call
    `update` throttled with `requestAnimationFrame`. Remove them on close and in
    `onScopeDispose`/`onUnmounted`.
- **Safety:** every DOM access guards `typeof window === "undefined"` and null refs;
  when unmeasurable it leaves `placement = preferred` and `floatStyle = { left: "0px" }`.

This composable owns one concern (where the floating panel goes) and is consumed only
through its ref inputs/outputs — usable by `DsDropdownMenu`/`DsCombobox` later without
change (non-goal now).

## Component — `vue/components/DsPopover.vue`

- New prop: `placement?: "bottom" | "top"` (default `"bottom"`).
- Add refs: `trigger` on the `<button>`, `floating` on the `.ds-popover` div.
  (Keep the existing `root` ref for `useDismiss`.)
- `const { placement: resolved, floatStyle } = useFlip({ trigger, floating, open, placement: props.placement })`.
- Bind on the panel: `:data-placement="resolved"` and `:style="floatStyle"`.

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
  trigger, floating, open, placement: props.placement,
});

function toggle() { open.value = !open.value; }
</script>

<template>
  <div ref="root" class="ds-popover-anchor" :class="{ 'is-open': open }">
    <button ref="trigger" type="button" class="ds-btn" :aria-expanded="open" @click="toggle">
      <slot name="trigger" />
    </button>
    <div v-if="open" ref="floating" class="ds-popover" role="dialog"
         :aria-label="ariaLabel" :data-placement="resolved" :style="floatStyle">
      <slot />
    </div>
  </div>
</template>
```

## CSS — `css/components.css`

Add one rule after the existing `.ds-popover-anchor .ds-popover` line (427); default
bottom placement is unchanged:

```css
.ds-popover-anchor .ds-popover[data-placement="top"] { top:auto; bottom:calc(100% + 6px); }
```

No new classes → no coverage-gate or `reference:lint` impact. The horizontal shift is
the inline `left` style overriding the base `left:0`.

## Documentation

`pages/feedback.html` "Popover" section (line 127, which already has a
`.ds-popover-anchor.is-open` example ~line 136): add a static example of the upward
variant (`<div class="ds-popover" data-placement="top">…</div>`) so the flipped
placement is documented. (Collision is runtime-only; the static example just
demonstrates the `data-placement="top"` styling.) Regenerate the catalog with
`npm run reference:build` afterward.

## Testing

`vue/composables/useFlip.test.ts` (new) — stub geometry by assigning
`getBoundingClientRect` on the trigger element, `offsetWidth`/`offsetHeight` on the
floating element (via `Object.defineProperty`), and `window.innerWidth/innerHeight`:
- preferred bottom with ample room below → `placement === "bottom"`, `left === "0px"`.
- trigger near the viewport bottom with a tall panel and room above →
  `placement === "top"`.
- panel that would overflow the right edge → `floatStyle.left` is negative.
- panel that fits → `floatStyle.left === "0px"`.

`vue/components/DsPopover.test.ts` (extend; keep existing toggle/dismiss/aria cases):
- opening sets `data-placement="bottom"` by default.
- `placement="top"` prop renders `data-placement="top"`.
- with stubbed overflow geometry, opening flips `data-placement` to `"top"`.

`cssHas` is not used (the new selector is an attribute, not a class).

## File touch list

New:
- `vue/composables/useFlip.ts`
- `vue/composables/useFlip.test.ts`

Edited:
- `vue/components/DsPopover.vue` — refs, prop, `useFlip` wiring, bindings.
- `vue/components/DsPopover.test.ts` — flip cases.
- `css/components.css` — `[data-placement="top"]` rule.
- `vue/index.ts` — export `useFlip` (composables are part of the public surface;
  `useDismiss`/`useFocusTrap`/etc. are already exported there).
- `pages/<popover page>.html` — upward-variant example.
- Regenerated if examples change: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`.

`DsPopover` itself is already exported; no re-add.

## Out of scope

- `DsTooltip` placements/flip (stays pure-CSS).
- Left/right placements; start/end alignment.
- Portal/teleport — panel stays absolute within the anchor, so a popover nested in an
  `overflow:hidden` ancestor can still clip. **Known limitation**, acceptable for v1.
- Adopting `useFlip` in `DsDropdownMenu`/`DsCombobox`/`DsContextMenu` (future).
