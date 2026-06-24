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
/* SOURCE app — uses the source app's token vocabulary, NOT ours: */
.startup-guide {
  height: 100vh;
  padding: 54px 18px 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background:
    radial-gradient(circle at top left, var(--accent-soft), transparent 34%),
    var(--bg-body);   /* ← source token; in THIS repo the body bg is `--bg` */
}
```

The original also has a 460px centered panel (`.startup-panel`), an intro block
(eyebrow + h1 + copy), a vertical "scan rail" of two checks each with a state-driven
status icon + title + note, an optional error line, and a right-aligned actions row.

**Token translation (critical):** the source app's token names are NOT our token
names. The gradient ports with **zero new tokens**, but must be rewritten against
this repo's vocabulary:

| Source token       | This repo (`css/tokens.css`)        |
|--------------------|-------------------------------------|
| `--bg-body`        | `--bg`                              |
| `--accent-soft`    | `--accent-soft` (same — exists)     |
| `--text-dim`       | `--text-3` (muted), `--text-2` (secondary) |
| `--status-success` | `--success`                         |
| `--status-danger`  | `--danger`                          |
| `--border-subtle`  | `--border-soft`                     |
| radius `8px`       | `--radius`                          |

So the ported background is:
`radial-gradient(circle at top left, var(--accent-soft), transparent 34%), var(--bg)`.

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
- Background: `radial-gradient(circle at top left, var(--accent-soft), transparent 34%), var(--bg)`.
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
`StepState`). State drives both the indicator and its color. **All required icons
already exist in `icons/approved.json` (`check`, `close`, `warning`) — no new icon
entries needed.** The `running` indicator reuses the existing spinner, not an icon.

| state     | indicator                              | color token   |
|-----------|----------------------------------------|---------------|
| pending   | hollow dot (CSS outline circle)        | `--text-3`    |
| running   | `.ds-spinner` (existing component)     | (spinner)     |
| ok        | `check` icon                           | `--success`   |
| warn      | `warning` icon                         | `--danger`    |
| error     | `close` icon                           | `--danger`    |

Notes:
- `running` uses the repo's existing spinner — `.ds-spinner` (`components.css:370`,
  animated by `@keyframes ds-spin`) in static markup, and the `DsSpinner` component
  in Vue. Do **not** invent a spinner icon or a new keyframes block.
- `pending` needs no icon: a hollow outline circle drawn with CSS on
  `.ds-checklist-ico` (border + border-radius, `--text-3`/`--border-soft`).
- `DsIcon` renders empty for unknown names (`DsIcon.vue` returns `""`), so only use
  the three confirmed-existing icon ids above.

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

- `data-state` selectors color the indicator and (optionally) tint the row.
- `running` uses `.ds-spinner`, whose `ds-spin` animation is already globally
  suppressed under `prefers-reduced-motion: reduce` (`base.css:45`). No extra
  reduced-motion CSS needed for the checklist.
- Grid layout `28px 1fr` like the source, min row height, subtle border + radius
  using existing tokens (`--border-soft`, `--radius`).

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
- **Intro:** `.ds-h1` exists (`components.css:8`) for the title. There is **no**
  dedicated eyebrow class, so render the eyebrow as a small uppercase muted treatment
  using `.ds-sub` (`components.css:10`) — do not invent an eyebrow class.
- **Error line:** existing `.ds-alert.is-danger` (`components.css:298`) instead of a
  bespoke `.error-detail`.

## Documentation

**Coverage gate (must satisfy `coverage:check`, run by `npm run build`):**
`tools/coverage-core.mjs` flags any extracted primitive with zero examples in
`pages/*.html`. Both `.ptn-stage` and `.ds-checklist` are new primitives, so **each
needs at least one standalone example** — a composed-only demo may not register the
inner primitive. Plan:

- **Patterns page** (`pages/patterns.html`): add a `doc-section`
  **"Gradient Stage"** with a minimal standalone `.ptn-stage` example (so the
  pattern is covered on its own), AND a `doc-section` **"Setup / Onboarding screen"**
  demonstrating the full composition — `.ptn-stage` wrapping a `.ds-panel` containing
  intro + `.ds-checklist` + actions (the canonical "full wizard, decomposed"
  example).
- **Component docs:** add a standalone `.ds-checklist` example to the most fitting
  existing page (Feedback) showing all five states.
- After editing pages, re-run `coverage:check` and confirm both primitives report
  covered before declaring done.
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
- `pages/feedback.html` — checklist states example.
- Regenerated: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`.

Explicitly **not** edited: `icons/approved.json` — all required icons (`check`,
`close`, `warning`) already exist.

## Testing & verification

- **Unit (Vitest):** `DsChecklist` renders one row per item, maps each state to the
  correct icon, and sets `aria-live`. `DsStage` renders `.ptn-stage` and projects its
  slot.
- **Stories (Storybook):** `DsStage` (panel-on-glow), `DsChecklist` (all five
  states), and a combined onboarding story.
- **Manual:** verify in dark + light themes; confirm the glow reads correctly on both
  `--bg` values (near-black vs light gray); check keyboard focus on the composed
  buttons; confirm the `running` spinner halts under reduced motion (handled globally
  by `base.css:45`). Note: compact density only retunes control height/font tokens,
  not the checklist's fixed `28px` grid, so density is not a meaningful axis here.
- **Build gates:** `npm run build` (icon registry + multi-page docs) and the existing
  alignment/coverage gate must pass.

## Out of scope

- The original's Tauri/Bluetooth logic (`invoke`, polling) — not ported; the
  components are presentational, state is owned by the consumer.
- Configurable glow position/intensity (explicitly declined).
- Accessibility workstream beyond the basic `aria-live` + reduced-motion already
  specified (broader a11y is deprioritized for this repo).
```
