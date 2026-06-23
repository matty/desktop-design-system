# Desktop Design System

A dependency-light desktop design system and CSS grammar for desktop applications. The core is plain HTML and CSS: tokens, primitives, utilities, states, and full-screen recipes that humans and LLMs can compose without adopting a framework.

Run `npm install` then `npm run dev` to view the docs (pages are assembled at build time from `docs/nav.mjs` + per-page bodies, so opening the raw `.html` files no longer renders the nav/head). `npm run build` outputs the static docs site and the offline release bundle to `dist/`.

## Project Layers

```
desktop-design-system/
├─ index.html              ← start here (live gallery + the composed shell)
├─ css/
│  ├─ tokens.css           ← design tokens + light theme + density (the foundation)
│  ├─ base.css             ← reset, body, scrollbars, focus, reduced-motion
│  ├─ components.css       ← primitives and variants (.ds-* + .is-* classes)
│  ├─ utilities.css        ← first-class composition layer (.u-* classes)
│  ├─ patterns.css         ← first-class recipe helpers for full screens
│  └─ docs.css             ← chrome for the doc pages only (not shipped)
├─ icons/
│  ├─ approved.json        ← semantic icon names mapped to Iconify/Lucide ids
│  └─ registry.json        ← offline static SVG data generated from local packages
├─ tools/
│  └─ build-icons.mjs      ← optional offline Iconify extractor
├─ src/
│  ├─ design-language.css  ← Vite/package CSS entrypoint
│  └─ design-language.docs.css
├─ vite.config.mjs         ← optional desktop-friendly multi-page build
└─ pages/
   ├─ foundations.html     ← color, type, spacing, radius, icons, motion
   ├─ utilities.html       ← composition helpers and app scaffolds
   ├─ patterns.html        ← screen recipes built from primitives/utilities/patterns
   ├─ buttons.html
   ├─ forms.html           ← inputs, number, select, dropdown, switch, slider…
   ├─ data-display.html    ← panels, facts, tables, badges, meters, status
   ├─ feedback.html        ← alerts, empty states, tooltips, dialogs, progress
   ├─ navigation.html      ← titlebar, sidebar, segmented, tabs, menus
   └─ system.html          ← theming, density, accent, semantic colors + more components
```

## Principles

1. **Neutral surfaces by default.** Near-black surfaces, white/grey ink. State is shown
   through **brightness, weight and motion — not arbitrary hue**. A bright breathing dot =
   running; a dim static dot = stopped.
2. **System accent by default.** Primary controls use the OS accent color
   (`AccentColor` / `AccentColorText`), so Windows uses the selected Windows accent.
   Semantic colors (success/warning/info/danger) stay reserved for explicit meaning.
3. **Desktop density.** 34px controls (compact 30px), hairline dividers, top-left
   aligned content, a centered titlebar with Windows buttons. It reads like a utility.
4. **Mono for data.** Numbers, IDs, addresses and live values use JetBrains Mono so
   they stay aligned and legible. Sora carries all prose and labels.

## Class Grammar

- `.ds-*` = design-system primitive, such as `.ds-btn`, `.ds-panel`, `.ds-status`.
- `.u-*` = utility for composition, such as `.u-flex`, `.u-stack`, `.u-gap-4`.
- `.is-*` = state or variant, such as `.is-active`, `.is-primary`, `.is-danger`.
- `data-*` = mode, such as `data-theme="light"` or `data-density="compact"`.

## Theming

Everything is a token, so a new app re-skins it without changing primitives:

```html
<!-- 1. pick a theme -->
<html data-theme="light">          <!-- or omit for default dark -->
<html data-density="compact">       <!-- tighter controls -->

<!-- 2. brand it (in your own stylesheet) -->
:root { --accent:#4f8ff0; --accent-ink:#fff; } /* optional brand override */
```

- **`data-theme="light"`** — full light palette via token overrides.
- **`data-density="compact"`** — shrinks control heights + base font.
- **`--accent` / `--accent-ink`** — drives primary buttons, switches, checks, radios,
  slider, selection. Default is the OS system accent (`AccentColor` / `AccentColorText`).
- **Semantic colors** — `--success` `--warning` `--info` `--danger`, each with `-soft`
  and `-ink`. Used by `.is-success` / `.is-warning` / `.is-info` / `.is-danger` variants
  on badge, alert, status, toast, banner.
- **Reduced motion** — `prefers-reduced-motion` disables ambient animation automatically.

The `system.html` page lets you flip theme / density / accent live.

## Using It

```html
<link rel="stylesheet" href="desktop-design-system/css/tokens.css" />
<link rel="stylesheet" href="desktop-design-system/css/base.css" />
<link rel="stylesheet" href="desktop-design-system/css/components.css" />
<link rel="stylesheet" href="desktop-design-system/css/utilities.css" />
<link rel="stylesheet" href="desktop-design-system/css/patterns.css" />

<button class="ds-btn is-primary">Start</button>
<span class="ds-status is-on"><span class="ds-dot"></span>Running</span>
```

Use `components.css` for reusable primitives, `utilities.css` for composition, and
`patterns.css` for full-screen recipe helpers. The `.u-app` scaffold gives you the
titlebar / sidebar / status-bar window shell.

Agents and code generators should read [LLM_GUIDE.md](LLM_GUIDE.md) before producing UI with this language.

## Storybook

The Vue component library ships a Storybook workbench for interactive development and automated testing.

```bash
npm run storybook          # dev workbench (live reload, http://localhost:6006)
npm run build-storybook    # static build to storybook-static/
npm run test-storybook     # interaction + smoke tests (headless Chromium via Playwright)
```

`test-storybook` requires Storybook to be served. Either run it against the dev server (`npm run storybook` in one terminal, then `npm run test-storybook`) or against a static build:

```bash
npm run build-storybook -- -o storybook-static
npx http-server storybook-static -p 6099 --silent &
npx test-storybook --url http://127.0.0.1:6099
```

Axe accessibility checks run in the test-runner after each story and print violations to the console, but the run does **not** fail on them. This is intentional: a11y fixes are tracked in a separate workstream. When that workstream lands, flip the hook in `.storybook/test-runner.ts` from report-only to asserting.

## Optional Vite Build

Vite is the reusable build adapter for Electron, Tauri, WebView, and browser previews. It is not required by the CSS language.

```bash
npm install
npm run dev
npm run build
npm run preview
```

- `npm run dev` starts the docs/dev server.
- `npm run build` runs `icons:check` and writes a static multi-page build to `dist/`.
- `npm run preview` serves the built output.

The config uses `base: "./"` so assets work with desktop app protocols and file-like origins. See [docs/adapters/vite.md](docs/adapters/vite.md) for Electron and Tauri notes.

Apps that already use Vite can import the CSS entrypoint:

```js
import "desktop-design-system/css";
```

## Recipes And Patterns

Public classes are split across primitives, utilities, and patterns:

- **Buttons** — `.ds-btn` + `.is-primary` `.is-ghost` `.is-danger` `.is-icon` `.is-sm` `.is-lg`; `.ds-btn-group`
- **Inputs** — `.ds-input` (`.is-mono` `.is-invalid`), `.ds-input-wrap`/`.ds-adorn`/`.ds-suffix`, `.ds-textarea`, `.ds-number`/`.ds-step`
- **Choices** — `.ds-combo` (styled select, themed popup), `.ds-select` (native), `.ds-dropdown`/`.ds-menu`/`.ds-menu-item`, `.ds-switch`, `.ds-check`, `.ds-radio`, `.ds-slider`
- **Field layout** — `.ds-field`, `.ds-row`/`.ds-row-text`/`.ds-row-control`
- **Display** — `.ds-card`, `.ds-panel`, `.ds-facts`/`.ds-fact`, `.ds-dl`, `.ds-table`, `.ds-meter`, `.ds-progress`, `.ds-list`
- **Status & tags** — `.ds-status` (`.is-on/.is-busy/.is-off/.is-error/.is-success/.is-warning/.is-info`), `.ds-indicator`, `.ds-badge`, `.ds-pill`, `.ds-kbd`, `.ds-avatar`
- **Feedback** — `.ds-alert`, `.ds-banner`, `.ds-toast`, `.ds-empty`, `.ds-tip`, `.ds-overlay`/`.ds-dialog`, `.ds-spinner`, `.ds-skeleton`, `.ds-progress`
- **Shell & nav** — `.ds-titlebar`, `.ds-winbtns`, `.ds-rail`/`.ds-navi`, `.ds-toolbar`, `.ds-statusbar`, `.ds-breadcrumb`, `.ds-segmented`, `.ds-tabs`, `.ds-accordion`, `.ds-divider`
- **Utilities** — `.u-flex` `.u-grid` `.u-gap-*` `.u-items-center` `.u-justify-between` `.u-app` … (see `utilities.css`)
- **Patterns** — `.ptn-workspace`, `.ptn-inspector`, `.ptn-command` for full-screen recipes and overlays (see `patterns.css` and `pages/patterns.html`)

## Icons

Icons use Iconify as the catalog and Lucide as the default collection, but the shipped UI stays offline: static SVG is committed in `icons/registry.json` and examples render inline SVG. Do not load Iconify's web component or hosted API in core docs or desktop apps.

- Pick local semantic names from `icons/approved.json`, such as `refresh`, `settings`, or `search`.
- Map those names to Iconify ids, such as `lucide:refresh-cw`.
- Regenerate static SVG data with `npm run icons:build` after `npm install`.
- Keep license attribution in `THIRD_PARTY_LICENSES.md`.

Icons are line SVG on a 24px grid with `fill:none; stroke:currentColor`, round caps/joins, and a 2px source stroke. Components may size them down to 18px or 15px.

## Porting To Frameworks

If your app is React + Tailwind, tokens map straight into the Tailwind theme
(`theme.extend.colors`, `borderRadius`…) or import `tokens.css` globally and use
`bg-[var(--surface)]`. Framework adapters should preserve the same class grammar,
tokens, sizes, and states so the look stays identical.
