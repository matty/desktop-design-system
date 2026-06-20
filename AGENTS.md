# Repository Guidelines

## Project Structure & Module Organization

This repository is a static desktop design-language reference. `index.html` is the entry point and live overview. The language is documented as tokens, primitives, utilities, states, and full-screen patterns. Reference pages live in `pages/`, with one focused HTML page per area: `buttons.html`, `forms.html`, `feedback.html`, `navigation.html`, and related system pages.

Styles are organized under `css/`:

- `tokens.css`: design tokens, themes, density, semantic colors.
- `base.css`: reset, body defaults, focus, scrollbars, reduced motion.
- `components.css`: reusable `.ds-*` design-system primitives.
- `utilities.css`: first-class `.u-*` composition layer for layout, spacing, and app structure.
- `patterns.css`: recipe-level helpers for full desktop screens.
- `docs.css`: documentation-site chrome only; do not treat it as shipped app CSS.

Icons are defined under `icons/`. `approved.json` maps semantic names to Iconify/Lucide ids, and `registry.json` stores offline SVG bodies.

## Build, Test, and Development Commands

The docs are assembled at build time from `docs/nav.mjs` + per-page bodies, so use `npm run dev` (raw `.html` files no longer render standalone). The Vite adapter also provides a reusable desktop-app build path.

Useful local commands:

- `npm install`: install optional build/icon tooling.
- `npm run dev`: start the Vite dev server and open the docs (pages are assembled from `docs/nav.mjs` + per-page bodies; opening the raw `.html` files directly no longer renders the nav/head).
- `npm run build`: verify the icon registry and build the multi-page docs to `dist/`.
- `npm run bundle`: assemble the offline release bundle to `dist/bundle/` (also run by `npm run build`).
- `npm run preview`: preview the built `dist/` output.
- `npm run icons:build`: regenerate offline Lucide/Iconify SVG data.
- `rg "ds-btn"` or `rg "--accent"`: search primitive classes or token usage.
- To add or reorder a docs page, edit `docs/nav.mjs` — it drives both the left-nav rail and the Vite build inputs.

## Coding Style & Naming Conventions

Use plain HTML and CSS. Keep indentation at two spaces for nested HTML. CSS in this project favors compact rules for simple selectors and grouped section comments for major areas.

Follow the class grammar:

- Primitives use `.ds-*`, for example `.ds-btn`, `.ds-card`, `.ds-status`.
- Utilities use `.u-*`, for example `.u-flex`, `.u-gap-*`.
- States and variants use `.is-*`, for example `.is-primary`, `.is-danger`, `.is-active`.
- Modes use `data-*`, for example `data-theme="light"` or `data-density="compact"`.
- Design values should reference CSS custom properties from `tokens.css` instead of hard-coded colors or sizes.

## Testing Guidelines

No automated test framework is present. Verify changes manually in a browser. Check `index.html` and any affected page under `pages/`, then test dark and light themes, compact density where relevant, keyboard focus states, and reduced-motion behavior for animated components.

When changing shared CSS such as `tokens.css` or `components.css`, inspect multiple pages because those files affect the whole language.

## Commit & Pull Request Guidelines

This checkout has no `.git` directory, so no project-specific commit history is available. Use clear, imperative commit subjects such as `Add compact form examples` or `Fix button focus state`.

Pull requests should describe the visual or behavioral change, list affected pages/components, include screenshots for UI changes, and note manual browser checks performed.

## Agent-Specific Instructions

Keep edits scoped. Preserve the design system’s monochrome-first, desktop-density principles, and treat Vite, Electron, Tauri, and other adapters as optional layers around the CSS language rather than the source of truth.
