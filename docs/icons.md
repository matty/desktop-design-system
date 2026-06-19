# Icon System

## Purpose

Icons use Iconify as the catalog and Lucide as the default collection, but the product output is offline static SVG. Do not load Iconify's web component or remote API in shipped desktop apps.

## Source Contract

- Catalog: Iconify.
- Default collection: Lucide.
- License: Lucide is ISC licensed; keep attribution in repository license notes.
- Runtime network: none.
- Runtime dependency: none required.

Use `icons/approved.json` to choose semantic design-language names. Use `icons/registry.json` as the local renderable registry. Add a new icon only when an existing semantic name does not fit.

## Naming

Use local semantic names in docs and examples:

```text
refresh -> lucide:refresh-cw
settings -> lucide:settings
search -> lucide:search
warning -> lucide:triangle-alert
```

LLMs should request icons by the local name first. If a new icon is necessary, add it to `icons/approved.json` with its Iconify id, then regenerate or paste the static SVG body into `icons/registry.json`.

## Rendering

Render committed SVG, not fetched SVG:

```html
<svg viewBox="0 0 24 24" aria-hidden="true">
  <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
    <path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </g>
</svg>
```

All icons inherit CSS:

```css
stroke: currentColor;
fill: none;
stroke-linecap: round;
stroke-linejoin: round;
```

## Build-Time Extraction

The optional `tools/build-icons.mjs` script can generate `icons/registry.json` from local Iconify packages after dependencies are installed. It reads `icons/approved.json`, uses the local `@iconify-json/lucide` data, and writes static SVG bodies.

```bash
npm install
npm run icons:build
```

The generated registry should be committed so desktop apps and documentation stay offline.
