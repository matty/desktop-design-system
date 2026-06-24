# Flexible Titlebar Window Controls — Design

Date: 2026-06-25
Status: Approved (requirements), pending spec review

## Summary

Extend the existing `DsTitlebar` Vue component so consumers can fully customise the
window controls (minimize / maximize / close) instead of always rendering the
hard-coded three. Three flexibility layers:

1. **`controls` prop** — choose which standard controls render, and in what order.
2. **`maximized` prop** — swap the maximize button for a restore button + event.
3. **Slots** — `leading` (far-left zone), `actions` (custom buttons beside the
   controls), and `controls` (full override of the control cluster).

Scope is **Vue-only** plus a small CSS layout hook and a docs example. The static
`.ds-titlebar` / `.ds-winbtns` styling already supports arbitrary buttons, so no
restyle is required. **`side`/left placement is explicitly out of scope** (declined).

## Current state

`vue/components/DsTitlebar.vue` today:
- Props: `title?: string`.
- Emits: `minimize`, `maximize`, `close`.
- Always renders exactly three buttons; `close` is last and carries `.is-close`.

Static CSS (`css/components.css:322-328`):
- `.ds-titlebar` — `display:flex; justify-content:flex-end;` with an absolutely
  positioned, centered, `pointer-events:none` `.ds-titlebar-title` overlay.
- `.ds-winbtns button` — styles any button (46px, transparent, hover fill);
  `.ds-winbtns button.is-close:hover` is the danger-red close.

## Decisions (locked)

1. **API shape:** config-driven `controls` array (covers show/hide AND order in one
   prop) over individual booleans — chosen for maximum flexibility.
2. **Restore:** `maximized` boolean drives icon + event for the maximize slot.
3. **Custom buttons:** via slots, not props.
4. **No `side`/left placement.**
5. **Backward compatible:** defaults reproduce today's exact output.

## Component API — `DsTitlebar.vue`

### Props

```ts
withDefaults(defineProps<{
  title?: string;
  controls?: WindowControl[];   // which standard controls, in order
  maximized?: boolean;          // maximize slot -> restore icon + event
}>(), {
  controls: () => ["minimize", "maximize", "close"],
  maximized: false,
});
```

`WindowControl` is added to `vue/types.ts`:

```ts
export type WindowControl = "minimize" | "maximize" | "close";
```

- Omitting an entry from `controls` hides that button. Order in the array is the
  render order. An empty array renders no standard controls (slots can still supply
  buttons).
- `maximized` only affects the `"maximize"` entry: when `true`, that button shows the
  restore icon, its label/title become "Restore", and it emits `restore`; when
  `false`, it shows the maximize square and emits `maximize`.

### Events

```ts
defineEmits<{ minimize: []; maximize: []; restore: []; close: [] }>();
```

Click handler maps each control: `minimize→minimize`, `close→close`,
`maximize→ maximized ? restore : maximize`.

### Slots

| Slot       | Position                              | Purpose |
|------------|---------------------------------------|---------|
| default    | centered title overlay (as today)     | title content (overrides `title` prop) |
| `leading`  | far left of the bar                   | app icon, menu button, breadcrumb |
| `actions`  | inline, immediately left of controls  | app-specific buttons (settings, pin) |
| `controls` | the control cluster                   | **full override** — replaces the built-in `.ds-winbtns`; `controls`/`maximized` props are then ignored |

### Template structure

```vue
<div class="ds-titlebar">
  <div v-if="$slots.leading" class="ds-titlebar-leading"><slot name="leading" /></div>
  <div class="ds-titlebar-title"><slot>{{ title }}</slot></div>
  <div v-if="$slots.actions" class="ds-titlebar-actions"><slot name="actions" /></div>
  <slot name="controls">
    <div class="ds-winbtns">
      <button v-for="c in controls" :key="c"
              :class="{ 'is-close': c === 'close' }"
              :title="labelFor(c)" :aria-label="labelFor(c)"
              @click="onControl(c)">
        <!-- minimize | maximize(square) | restore(overlapping) | close(x) icon -->
      </button>
    </div>
  </slot>
</div>
```

`labelFor(c)`: `minimize→"Minimize"`, `close→"Close"`,
`maximize→ maximized ? "Restore" : "Maximize"`.

### Icons (inline SVG, matching existing winbtns style)

- minimize: `M5 12h14`
- maximize (square): `<rect x="3" y="3" width="18" height="18" rx="2"/>`
- restore (overlapping squares): a rear square + a front square offset, e.g.
  `<path d="M8 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2"/>` +
  `<rect x="4" y="8" width="12" height="12" rx="2"/>`
- close: `M18 6L6 18M6 6l12 12`

(`.ds-winbtns button svg` already constrains size/stroke via CSS.)

## CSS — minimal layout hook (`css/components.css`)

`.ds-titlebar` is `justify-content:flex-end`, so all real flex children pack right.
To let `leading` sit at the far left while `actions`+`controls` stay right, add:

```css
.ds-titlebar-leading { display:flex; align-items:center; margin-right:auto; }
.ds-titlebar-actions { display:flex; align-items:center; }
```

`margin-right:auto` on `leading` pushes everything else to the right edge. No other
CSS changes. These are sub-parts of `.ds-titlebar` (like `.ds-titlebar-title`), so
they need no separate coverage example, but the docs example below will exercise them.

## Backward compatibility

Defaults (`controls = ["minimize","maximize","close"]`, `maximized = false`, no slots)
render byte-equivalent output to today: three buttons, `close` last with `.is-close`,
emitting `minimize`/`maximize`/`close`, with the same aria-labels. The existing
`DsTitlebar.test.ts` cases pass unchanged.

## Documentation

`pages/navigation.html` "Title bar" section (line 20) gains additional static
examples for parity:
- minimal: `controls` = close only.
- maximized/restore state (restore icon on the middle button).
- with a `leading` item and an `actions` button.

These are authored as plain HTML using `.ds-titlebar-leading`, `.ds-titlebar-actions`,
`.ds-winbtns`, and `.is-close`. Run `npm run reference:build` afterwards so the
catalog (`reference/manifest.json`, `REFERENCE.md`, `llms.txt`) reflects the new
sub-part classes.

## Testing (`vue/components/DsTitlebar.test.ts`)

Keep the existing three tests (they validate the unchanged default). Add:
- `controls=["close"]` renders one button, and it is `.is-close`.
- `controls=["close","minimize"]` honors order (first button is close).
- `maximized=true` with default controls: middle button has `aria-label="Restore"`
  and clicking it emits `restore` (not `maximize`); with `maximized=false` it emits
  `maximize` and is labelled "Maximize".
- `leading` slot renders inside `.ds-titlebar-leading`; `actions` slot inside
  `.ds-titlebar-actions`.
- `controls` slot overrides the cluster: built-in `.ds-winbtns` is absent and the
  slot content renders.
- `cssHas("ds-titlebar-leading")` and `cssHas("ds-titlebar-actions")` are true.

Stories (`DsTitlebar.stories.ts`): add `MinimalClose`, `Maximized`, and
`WithLeadingAndActions` alongside the existing `Default`.

## File touch list

Edited:
- `vue/components/DsTitlebar.vue` — new props, events, slots, control loop.
- `vue/types.ts` — add `WindowControl`.
- `css/components.css` — add `.ds-titlebar-leading`, `.ds-titlebar-actions`.
- `vue/components/DsTitlebar.test.ts` — add cases above.
- `vue/components/DsTitlebar.stories.ts` — add stories.
- `pages/navigation.html` — variant examples.
- Regenerated: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`.

No change to `vue/index.ts` (DsTitlebar already exported).

## Out of scope

- `side`/left (macOS) placement of the control cluster.
- Real window integration (Tauri/Electron `appWindow` calls) — the component stays
  presentational and emits events; the consumer wires them to the window.
- Double-click-to-maximize on the title region, drag-to-move regions.
