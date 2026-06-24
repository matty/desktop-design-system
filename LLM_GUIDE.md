# LLM Guide

## Goal

Generate desktop application interfaces using the design language in this repository. Prefer existing tokens, utilities, primitives, states, and patterns over custom CSS.

## Class Rules

- Use `.ds-*` for semantic UI objects.
- Use `.u-*` for layout, spacing, sizing, overflow, and text helpers.
- Use `.is-*` only to modify an existing object.
- Use `data-theme` and `data-density` for global modes.
- Do not invent new class names until the existing grammar cannot express the screen.

## Layout Rules

- Start with app structure: titlebar, rail, content, statusbar, panes.
- Use utility classes instead of inline styles for flex, grid, gaps, width, scrolling, and alignment.
- Keep desktop density: compact spacing, aligned labels, predictable rows, restrained surfaces.
- Avoid nested cards, decorative backgrounds, marketing hero sections, and arbitrary gradients.

## Token Rules

- Do not hard-code colors, radius, font sizes, or shadows in app CSS.
- Use CSS custom properties from `tokens.css` when a custom rule is unavoidable.
- Keep semantic color opt-in. Use danger for destructive actions and errors.

## Icon Rules

- Use local semantic icon names from `icons/approved.json`.
- Treat Iconify ids as source references, for example `refresh -> lucide:refresh-cw`.
- Render committed inline SVG from `icons/registry.json`; do not use remote Iconify API calls.
- Keep icons line-based: 24px viewBox, `fill="none"`, `stroke="currentColor"`, round caps and joins.

## Good Example

```html
<main class="u-content u-stack u-gap-7">
  <div class="u-split">
    <h1 class="ds-h1">Settings</h1>
    <button class="ds-btn is-primary">Save</button>
  </div>
  <section class="ds-panel">
    <div class="ds-panel-head"><h3>Sync</h3></div>
    <div class="u-settings-list">
      <div class="ds-row">
        <div class="ds-row-text"><b>Enable sync</b><span>Keep devices aligned</span></div>
        <div class="ds-row-control"><label class="ds-switch"><input type="checkbox" checked><span class="ds-track"></span></label></div>
      </div>
    </div>
  </section>
</main>
```

## Bad Example

```html
<div style="padding:37px;background:linear-gradient(120deg,#2020ff,#aa44ff);border-radius:28px">
  <button class="bigCoolButton">Save settings</button>
</div>
```

The bad example bypasses tokens, invents selectors, uses arbitrary spacing, and creates a marketing-style surface.

## Vue Components

The `.ds-*` CSS classes are the source of truth and work in any framework. An optional
Vue 3 layer (`vue/`, 63 `Ds*` components) wraps the same classes — components render
`.ds-*` markup and ship no styles of their own, so the CSS is still authoritative.

When to use a component vs. plain markup:

- In a Vue app, prefer a `Ds*` component whenever the primitive is **interactive or
  stateful** — combobox, dropdown, tree, tabs, accordion, dialog, drawer, toast,
  context menu, splitter, sortable, command palette, date picker. The component owns
  the focus management, keyboard navigation, and ARIA wiring you would otherwise
  hand-roll.
- For **static structure** (cards, panels, rows, layout, badges, status), a `Ds*`
  component and plain `.ds-*` HTML are equivalent — use whichever fits the file.
- **Outside Vue**, use the `.ds-*` classes directly and load `ds.js`, which wires up
  the same interactive behaviours on matching markup.

How to use them (Vue 3 + Vite + TypeScript):

- Import the stylesheet once at the app root (e.g. `import ".../design-language.css"`).
- Import components from the `vue/` barrel:
  `import { DsCombobox, DsDialog, useToast } from ".../vue"`.
- Mount `<DsToastHost />` once near the app root if you use toasts, then call
  `useToast().toast({ message: "Saved", tone: "success" })` from anywhere.
- Install the `sortablejs` peer dependency only if you use `DsSortable`.
- Form controls are `inline-block` with no intrinsic width — give them one, e.g.
  `<DsCombobox class="u-w-full" … />`, or they collapse to their content.

See `REFERENCE.md` for every component with its props.

## Generated Reference

This guide states the rules; the full, always-accurate catalog is generated:

- `llms.txt` — orientation + rules + links (start here).
- `REFERENCE.md` — every token, class, state, mode, pattern, and Vue component with descriptions and examples.
- `reference/manifest.json` — machine-readable manifest.
- Validate usage: `node tools/lint-usage.mjs "src/**/*.{vue,html}"` (flags unknown classes/components/props).
