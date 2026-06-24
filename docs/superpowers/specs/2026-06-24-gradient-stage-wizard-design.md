# Gradient Stage + Wizard Decomposition — Design

Date: 2026-06-24
Status: Approved (requirements), pending spec review

## Summary

Port the setup-wizard look from an external Tauri app (`StartupGuide.vue`) into the
design language as **separate, composable components** — not a single monolithic
wizard. The headline new piece is the **Gradient Stage**: a full-screen surface with
a soft top-left accent glow that centers its content. The wizard's progress "scan
rail" becomes a second new primitive, the **Checklist**. Everything else in the
original screen (card, buttons, intro typography) is composed from existing system
primitives.

Each new piece ships in **both layers** the system supports:

- **Static CSS** (`.ds-*` / `.ptn-*`) consumed via plain HTML.
- **Vue** (`Ds*.vue`) consumed via the published component surface.

Both layers are token-driven and share the same class names, per repo grammar.

## Source reference

From `C:\Users\coding\Desktop\src\components\StartupGuide.vue`:

```css
.startup-guide {
  height: 100vh;
  padding: 54px 18px 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background:
    radial-gradient(circle at top left, var(--accent-soft), transparent 34%),
    var(--bg-body);
}
```

The original also has a 460px centered panel (`.startup-panel`), an intro block
(eyebrow + h1 + copy), a vertical "scan rail" of two checks each with a state-driven
status icon + title + note, an optional error line, and a right-aligned actions row.

The target repo already defines `--accent-soft` and `--bg-body`, so the gradient
ports with **zero new tokens**.

## Decisions (locked)

1. **Scope:** Full wizard, decomposed into separate components.
2. **Gradient Stage glow:** Fixed top-left accent — one radial `--accent-soft` glow
   over `--bg-body`. Opinionated, mirrors the source exactly. No origin/intensity
   knobs.
3. **Checklist:** A new first-class `DsChecklist` primitive (not a loose recipe),
   with a built-in `state → icon` mapping and an `aria-live` region.

## Components

### 1. Gradient Stage — `.ptn-stage` + `DsStage`

A screen-level recipe, so it lives in `patterns.css` as `.ptn-stage`. A thin Vue
wrapper `DsStage` exposes it as a component for the Vue consumer (this is the one
sanctioned case of a Vue component wrapping a `.ptn-*` class — justified because the
user wants a Vue handle for the wizard backdrop).

**Behavior:**

- Fills its container height (`min-height: 100%` / `100vh` at root), centers a single
  child both axes, scrolls on overflow.
- Background: `radial-gradient(circle at top left, var(--accent-soft), transparent 34%), var(--bg-body)`.
- Top padding accommodates a titlebar (matches source `54px` top), comfortable side
  padding, responsive.
- Purely presentational — no interactivity, no ARIA role of its own.

**Static usage:**

```html
<div class="ptn-stage">
  <section class="ds-panel" style="width:min(460px,100%)"> … </section>
</div>
```

**Vue API (`DsStage.vue`):**

- Props: none required. (Fixed look — no configuration, per decision 2.)
- Slot: default — the centered content.
- Renders `<div class="ptn-stage"><slot/></div>`.

### 2. Checklist — `.ds-checklist` / `.ds-checklist-item` + `DsChecklist`

The state-driven progress rail. A vertical list where each item shows a status icon,
a title, and a note, driven by an item state.

**State model:** `pending | running | ok | warn | error` (mirrors the source
`StepState`). State drives both the icon and the icon color:

| state     | icon (semantic name)      | color token              |
|-----------|---------------------------|--------------------------|
| pending   | circle-outline            | `--text-dim`             |
| running   | spinner (animated)        | `--text-dim`             |
| ok        | check-circle              | `--status-success`       |
| warn      | alert-circle              | `--status-danger`        |
| error     | close-circle              | `--status-danger`        |

(Exact icon ids resolved against `icons/approved.json`; add entries if missing.)

**Static structure** (in `components.css`):

```html
<ul class="ds-checklist" aria-live="polite">
  <li class="ds-checklist-item" data-state="ok">
    <span class="ds-checklist-ico"><!-- icon --></span>
    <div class="ds-checklist-text">
      <span class="ds-checklist-title">Bluetooth adapter</span>
      <span class="ds-checklist-note">Ready</span>
    </div>
  </li>
  …
</ul>
```

- `data-state` selectors color the icon and (optionally) tint the row.
- `running` icon spins via an existing/`@keyframes` animation; suppressed under
  `prefers-reduced-motion: reduce`.
- Grid layout `28px 1fr` like the source, min row height, subtle border + radius
  using existing tokens (`--border-subtle`, `--radius`/`8px` equivalent token).

**Vue API (`DsChecklist.vue`):**

- Prop: `items: ChecklistItem[]` where
  `ChecklistItem = { id: string; title: string; note?: string; state: ChecklistState }`.
- `ChecklistState = 'pending' | 'running' | 'ok' | 'warn' | 'error'` — added to
  `vue/types.ts`.
- Internal `stateIcon(state)` maps state → semantic icon name; uses `DsIcon`.
- Renders the same `.ds-checklist` markup with `aria-live="polite"`.
- No emitted events (display-only progress); interactivity stays with the consumer.

### Reused (no new code — composition only)

- **Card:** `DsPanel` / `.ds-panel` (+ `.ds-panel-head`, `.ds-panel-body`).
- **Actions:** `DsButton` / `.ds-btn` (`.is-primary` + default/secondary).
- **Intro:** `.ds-h1` for title, existing eyebrow/muted text classes for eyebrow +
  copy. If no eyebrow class exists, use a small uppercase `.ds-sub`/muted treatment
  rather than inventing one.
- **Error line:** existing alert/danger treatment (`.ds-alert is-danger` or the
  status-danger background pattern) instead of a bespoke `.error-detail`.

## Documentation

- **Patterns page** (`pages/patterns.html`): add a new `doc-section`
  **"Setup / Onboarding screen"** demonstrating the full composition —
  `.ptn-stage` wrapping a `.ds-panel` containing intro + `.ds-checklist` + actions.
  This is the canonical "full wizard, decomposed" example.
- **Component docs:** add a `.ds-checklist` example to the most fitting existing
  page (Feedback or Data Display) showing all five states.
- Both new components must appear in the generated catalog: run
  `npm run reference:build` to refresh `reference/manifest.json`, `REFERENCE.md`,
  and `llms.txt`.

## File touch list

New:
- `vue/components/DsStage.vue`
- `vue/components/DsStage.stories.ts`
- `vue/components/DsStage.test.ts`
- `vue/components/DsChecklist.vue`
- `vue/components/DsChecklist.stories.ts`
- `vue/components/DsChecklist.test.ts`

Edited:
- `css/patterns.css` — add `.ptn-stage`.
- `css/components.css` — add `.ds-checklist*`.
- `vue/types.ts` — add `ChecklistState`, `ChecklistItem`.
- `vue/index.ts` — export `DsStage`, `DsChecklist`.
- `pages/patterns.html` — onboarding screen section.
- `pages/feedback.html` (or `data-display.html`) — checklist states example.
- `icons/approved.json` — any missing status icon ids.
- Regenerated: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`.

## Testing & verification

- **Unit (Vitest):** `DsChecklist` renders one row per item, maps each state to the
  correct icon, and sets `aria-live`. `DsStage` renders `.ptn-stage` and projects its
  slot.
- **Stories (Storybook):** `DsStage` (panel-on-glow), `DsChecklist` (all five
  states), and a combined onboarding story.
- **Manual:** verify in dark + light themes and compact density; confirm the glow
  reads correctly on both `--bg-body` values; check keyboard focus on the composed
  buttons; confirm the `running` spinner halts under reduced motion.
- **Build gates:** `npm run build` (icon registry + multi-page docs) and the existing
  alignment/coverage gate must pass.

## Out of scope

- The original's Tauri/Bluetooth logic (`invoke`, polling) — not ported; the
  components are presentational, state is owned by the consumer.
- Configurable glow position/intensity (explicitly declined).
- Accessibility workstream beyond the basic `aria-live` + reduced-motion already
  specified (broader a11y is deprioritized for this repo).
```
