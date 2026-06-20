# Desktop Design System — offline bundle

A self-contained, offline copy of the design language. No network or build step required to use.

## Contents

- `design-language.css` / `design-language.min.css` — the full stylesheet (tokens, base, components, utilities, patterns) with `@font-face` for the self-hosted fonts.
- `fonts/` — Sora + JetBrains Mono variable woff2 (referenced by the CSS).
- `ds.js` — component runtime (combobox, context menu, tree, splitter, sortable, focus-trap, roving-tabindex). Plain global script.
- `sortable.min.js` — dependency of the sortable behaviour.
- `icons/` — `registry.json` (offline SVG data), `approved.json` (name → Lucide id), `lucide-catalog.json` (full Lucide source for offline extension), `extend-icons.mjs` (generator), `icons.js` (render helper).
- `manifest.json`, `VERSION`, `THIRD_PARTY_LICENSES.md`.

## Use the CSS

Place `design-language.css` and the `fonts/` folder together (the CSS references `fonts/<name>.woff2` relative to itself), then:

```html
<link rel="stylesheet" href="design-language.css" />
```

## Theme

Dark by default. Toggle light mode by setting `data-theme` on the root element, and (optional) persist it:

```js
document.documentElement.dataset.theme = "light"; // remove the attribute for dark
localStorage.setItem("ds-theme", "light");        // or "dark"
```

To avoid a flash before paint, add this inline in `<head>` BEFORE the stylesheet:

```html
<script>try{if(localStorage.getItem('ds-theme')==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}</script>
```

The toggle UI itself is yours to build — this bundle only defines the `data-theme` behaviour in the CSS.

## Use the JS

Load with `defer`, sortable before ds.js:

```html
<script defer src="sortable.min.js"></script>
<script defer src="ds.js"></script>
```

`ds.js` wires up matching elements when it loads. It does not re-scan after load, so add dynamic content before it runs (or re-create the relevant nodes).

## Icons

Render an approved icon by name:

```js
import { iconSvg } from "./icons/icons.js";
import registry from "./icons/registry.json" with { type: "json" };
element.innerHTML = iconSvg("home", registry);
```

### Add more Lucide icons (offline)

1. Add a name **inside the `"icons"` object** of `icons/approved.json` (not at the top level, or it is ignored), e.g.:
   ```json
   { "source": { ... }, "icons": { "home": "lucide:house", "rocket": "lucide:rocket" } }
   ```
2. Run `node icons/extend-icons.mjs` (uses the bundled `lucide-catalog.json` — no network).
3. `icons/registry.json` now includes your icon.
