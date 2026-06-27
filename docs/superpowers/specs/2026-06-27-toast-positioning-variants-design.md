# Toast positioning + variants — design

Date: 2026-06-27
Status: Approved (sections 1–2 confirmed with user; 3–5 folded in for implementation)

## Goal

Complete the toast feedback component so it is a first-class desktop notification
surface. Today `DsToastHost.vue` renders only a plain message + dismiss button in a
hardcoded bottom-right stack; the `.ds-toast` CSS has unused icon/title styling and
the `ToastTone` type declares tones that are not fully implemented.

This work makes placement configurable, completes the four tone variants, adds an
optional title and a single action button, and adds enter/exit animation plus
pause-on-hover/focus so actionable toasts are usable.

Non-goals (explicitly out of scope, YAGNI): multiple simultaneous stacks / per-toast
placement, max-visible cap with overflow collapsing, in-place `update(id, opts)`, and
tinted-background tone treatments. Accessibility beyond the existing live-region
wiring is out of scope per project direction.

## Decisions (from brainstorming)

1. **Placement** — single `placement` prop on the host (default `bottom-right`); all
   six placements defined in CSS. Not per-toast.
2. **Tones** — leading tone icon tinted with the tone color on the neutral
   `--surface-2` surface. All four tones (`info | success | warn | danger`). No accent
   bar, no tinted background.
3. **Content** — optional `title` + `message` + optional single `action` button.
4. **Lifecycle** — enter/exit animation (disabled under `prefers-reduced-motion`) and
   pause-on-hover/focus. No max-visible cap.
5. **API** — base `toast(opts)` plus `toast.success/danger/warn/info(message, opts?)`
   shorthands.

## Section 1 — Types & API surface (`vue/types.ts`, `vue/composables/useToast.ts`)

```ts
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  message: string;
  title?: string;           // NEW — optional bold title line
  tone?: ToastTone;         // info | success | warn | danger (unchanged)
  timeout?: number;         // unchanged, default 4000; 0 = sticky
  assertive?: boolean;      // unchanged
  action?: ToastAction;     // NEW — optional single action button
}

export type ToastPlacement =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";
```

`useToast()` returns an augmented callable. The base `toast(opts)` is unchanged.
Tone shorthands are attached as properties:

```ts
type ToastShorthandOpts = Omit<ToastOptions, "message" | "tone">;
interface ToastFn {
  (opts: ToastOptions): string;
  success(message: string, opts?: ToastShorthandOpts): string;
  danger(message: string, opts?: ToastShorthandOpts): string;
  warn(message: string, opts?: ToastShorthandOpts): string;
  info(message: string, opts?: ToastShorthandOpts): string;
}
```

The composable also gains `pause(id)` / `resume(id)` for the host to call. These are
returned alongside the existing `{ toasts, toast, dismiss }`.

Timer model change: instead of storing only a `setTimeout` handle, track per-toast
`{ handle, remaining, startedAt }`. `pause(id)` clears the handle and computes
`remaining -= Date.now() - startedAt`. `resume(id)` restarts a timeout for the
remaining duration and resets `startedAt`. Toasts with `timeout: 0` are never timed
and pause/resume are no-ops for them. (`Date.now()` is fine here — this is app
runtime code, not a workflow script.)

`placement` is **not** in `ToastOptions`; it is a host prop.

## Section 2 — CSS (`css/components.css`, reduced-motion in `css/base.css`)

- `.ds-toast-stack` keeps `position:fixed; z-index:120; display:flex;
  flex-direction:column; gap:8px`. Corner offsets move into placement modifiers:
  - `.is-top-left { top:16px; left:16px; }`
  - `.is-top-right { top:16px; right:16px; }`
  - `.is-bottom-left { bottom:30px; left:16px; }`
  - `.is-bottom-right { bottom:30px; right:16px; }` (current default offsets)
  - `.is-top-center { top:16px; left:50%; transform:translateX(-50%); }`
  - `.is-bottom-center { bottom:30px; left:50%; transform:translateX(-50%); }`
  - Top placements add `flex-direction:column-reverse` so the newest toast sits
    nearest the top edge (newest-closest-to-origin ordering, matching bottom stacks).
- **Tones** — complete the icon-color set already begun:
  - `.ds-toast.is-info .ds-toast-ico { color:var(--info); }`
  - `.ds-toast.is-warn .ds-toast-ico { color:var(--warning); }`
  - (`is-success` → `--success`, `is-danger` → `--danger` already exist.)
  Surface stays neutral `--surface-2`. No new color constants.
- **Action button** — reuse `.ds-btn.is-ghost.is-sm`; layout slot sits between the
  body and the close button. A `.ds-toast-actions` flex wrapper holds it so the close
  button stays pinned right (`margin-left:auto` moves from close to the actions
  wrapper).
- **Animation** — `@keyframes ds-toast-in` (opacity 0→1, translate 6px→0 from the
  stack edge) applied via Vue `<TransitionGroup>` classes
  (`.ds-toast-enter-from` / `.ds-toast-leave-to`). The whole animation is wrapped so
  it is disabled inside the existing `@media (prefers-reduced-motion: reduce)` block.

## Section 3 — Host component (`vue/components/DsToastHost.vue`)

- Props: `placement?: ToastPlacement` (default `"bottom-right"`). Applied as
  `:class="`is-${placement}`"` on `.ds-toast-stack`.
- Replace the bare `v-for` with `<TransitionGroup tag="div" name="ds-toast"
  class="ds-toast-stack ...">` for enter/exit animation.
- Each toast renders, in order:
  1. Tone icon via `<DsIcon :name="iconFor(t.tone)" />` inside `.ds-toast-ico`.
     Mapping: `info→info`, `success→check`, `warn→warning`, `danger→error` (new icon,
     see Section 5).
  2. `.ds-toast-body`: optional `<b>{{ t.title }}</b>` then the message text.
  3. `.ds-toast-actions` with the action button (ghost sm) when `t.action` is set;
     clicking it calls `t.action.onClick()` then `dismiss(t.id)`.
  4. Existing close button.
- Pause-on-hover/focus: on each toast element, `@mouseenter`/`@focusin` → `pause(t.id)`,
  `@mouseleave`/`@focusout` → `resume(t.id)`.
- `role="status"` retained (a11y routing already handled by the live region in the
  composable).

## Section 4 — Composable (`vue/composables/useToast.ts`)

- Implement the timer model from Section 1 (`pause`/`resume`, remaining-time tracking).
- Attach tone shorthands to the `toast` function; each calls `toast({ message, tone,
  ...opts })`.
- Keep the module-singleton reactive state and `announce()` integration unchanged.

## Section 5 — Icon, docs, reference, tests

- **Icon** — add a dedicated danger glyph so warn and danger don't share the
  triangle-alert icon. Add `"error": "lucide:circle-x"` to `icons/approved.json` and
  regenerate `icons/registry.json` via `npm run icons:build`. If that step requires
  network and is unavailable offline, hand-add the lucide `circle-x` SVG body to
  `registry.json` directly (the build only verifies the registry).
- **Docs page** — update the toast demo (`pages/system.html`, where toasts are
  currently shown) to demonstrate the four tones, a title, an action button, and a
  placement note. Follow existing page markup conventions.
- **Reference** — run `npm run reference:build` to regenerate `reference/manifest.json`,
  `REFERENCE.md`, and `llms.txt` for the new props/sub-parts.
- **Tests** (vitest, mirroring sibling `Ds*.test.ts`):
  - `useToast`: shorthands set the correct tone; `pause` stops auto-dismiss and
    `resume` restarts it; `timeout: 0` is sticky.
  - `DsToastHost`: renders the tone icon per tone; renders title when provided;
    renders action button and clicking it fires `onClick` + dismisses; applies the
    `is-<placement>` class from the prop; pause/resume fire on hover/focus events.

## Verification

- `npm run build` (icon registry verify + multi-page docs build) passes.
- `npm test` (or the project's vitest command) passes including new tests.
- Manual: trigger each tone, a titled toast, and an action toast in dark + light
  themes; confirm placement prop docks the stack correctly and reduced-motion
  disables animation.

## Affected files

- `vue/types.ts` — new `ToastAction`, `ToastPlacement`; extend `ToastOptions`.
- `vue/composables/useToast.ts` — timer model, pause/resume, shorthands.
- `vue/components/DsToastHost.vue` — placement prop, icon, title, action, transitions,
  pause/resume handlers.
- `css/components.css` — placement modifiers, info/warn icon colors, actions layout,
  transition classes.
- `css/base.css` — reduced-motion guard for toast animation (if not already covered).
- `icons/approved.json`, `icons/registry.json` — `error` glyph.
- `pages/system.html` — updated demo.
- `reference/manifest.json`, `REFERENCE.md`, `llms.txt` — regenerated.
- `vue/components/DsToastHost.test.ts`, `vue/composables/useToast.test.ts` — new/updated.
