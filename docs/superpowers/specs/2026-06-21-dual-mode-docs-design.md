# Dual-Mode (Vanilla / Vue) Generated Docs — Design Spec

> Status: approved design, pre-implementation. Date: 2026-06-21.

## Goal

Let the static docs present **both** consumption paths for a component — vanilla
`.ds-*` HTML/CSS/JS and the Vue component — without maintaining duplicate copies of
the example markup, while keeping the docs site static, offline-capable, and
framework-free. The CSS stays the single shared source for both paths (already true:
Vue components carry no styles).

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Presentation | Live preview stays **vanilla** (`.ds-*` + `ds.js`); each example gains generated **code tabs** (`Preview · HTML · Vue`). Vue is reference code, never live-rendered. |
| Docs site | Stays **static / framework-free**. Nothing loads Vue. |
| Vue tab scope | Only on examples that have a Vue equivalent (the ~10 interactive components). Other examples show `Preview · HTML` only. |
| Source model | **Auto-derive the HTML tab** from each `.example-preview`'s own markup (no second copy). The **Vue snippet is authored once**, co-located with the example. |
| Inline SVG in HTML tab | **Collapsed to a placeholder** (`<svg><!-- icon --></svg>`) in the displayed/copied code. The live preview still shows the real icon. |
| Syntax highlighting | None initially — themed monospace + copy button. (YAGNI; a build-time highlighter can be added later.) |

## Architecture

A build-time Vite plugin, `injectExamples()`, added to `vite.config.mjs` alongside
`injectChrome()`. It runs in the same `transformIndexHtml` pass (dev **and** build, so
tabs appear in `npm run dev` too). It post-processes every `.example` block on each
page:

1. Read the `.example-preview` inner markup → build the **HTML** code panel: escape it
   for display and collapse inline SVGs (see below).
2. If the `.example` contains a `<template data-vue>…</template>`, read its raw inner
   markup → build the **Vue** code panel, and remove the template from the output so it
   never reaches the browser.
3. Rewrap the block:
   ```html
   <div class="example has-code">
     <div class="example-tabs" role="tablist">
       <button class="example-tab is-active" data-panel="preview">Preview</button>
       <button class="example-tab" data-panel="html">HTML</button>
       <button class="example-tab" data-panel="vue">Vue</button>   <!-- only if a Vue snippet exists -->
     </div>
     <div class="example-panel is-active" data-panel="preview"> …original .example-preview… </div>
     <div class="example-panel" data-panel="html"><button class="example-copy">Copy</button><pre><code>…escaped HTML…</code></pre></div>
     <div class="example-panel" data-panel="vue"><button class="example-copy">Copy</button><pre><code>…escaped Vue…</code></pre></div>
     <div class="example-caption">…unchanged…</div>
   </div>
   ```
   Examples with no Vue snippet omit the Vue tab + panel. The live preview pane is the
   **unchanged** original `.example-preview` (real `.ds-*` + `ds.js`).

**Parsing:** use `node-html-parser` (a small, build-only devDependency) to query
`.example`, `.example-preview`, and `template[data-vue]`, transform in place, and
serialize. Build-only — never shipped in the offline bundle. Regex is rejected
(nested `<div>`s in previews make `.example` boundaries unparseable reliably).

### SVG collapsing

In the HTML code panel only, replace each `<svg …>…</svg>` with `<svg><!-- icon --></svg>`
before escaping. The live preview and the actual page markup are untouched — only the
*displayed code string* is collapsed. (Per the locked decision, Copy copies the
collapsed code; no copy-real toggle.)

## Authoring model

Authors write examples exactly as today (just the preview markup) — the HTML tab and
copy/tab UI are generated for free on **every** example. To add a Vue variant on an
interactive component, drop a co-located, non-rendered snippet inside the `.example`:

```html
<div class="example">
  <div class="example-preview"> …live .ds-combo markup… </div>
  <template data-vue>
<DsCombobox v-model="format" :options="formatOptions" />
  </template>
  <div class="example-caption">…</div>
</div>
```

- HTML is never written twice — the preview is the single source for the HTML tab.
- The Vue snippet is the only new authored content, and only on the ~10 interactive
  components. It is authored as raw markup; the plugin reads its raw inner HTML
  (`node-html-parser` preserves PascalCase tag names and formatting) and escapes it for
  display. The leading/trailing newline from the template is trimmed.

## Tab + copy UI (offline)

Progressive enhancement in `js/docs.js`:
- **Tabs:** click a `.example-tab` → toggle `is-active` on the matching `.example-tab`
  and `.example-panel` within that `.example`. Default active panel = `preview`.
- **Copy:** click `.example-copy` → `navigator.clipboard.writeText(panel code text)`;
  brief "Copied" affordance. Guard for environments without `navigator.clipboard`.

Doc-chrome styling for tabs/panels/copy lives in `css/docs.css` (documentation chrome
only — not shipped app CSS). No new runtime dependency; works on `file://` and in the
offline docs build.

## Scope & non-goals

- HTML tab + copy applies to **all** examples across the 11 pages (first time code is
  shown). Vue tab only where a `data-vue` snippet is authored.
- Not building Vue wrappers for non-interactive primitives; not adding the thin tier
  here; not making the docs a Vue app.
- No syntax-highlighting dependency in this iteration.
- The offline release bundle is unaffected (docs-chrome only; `node-html-parser` is a
  build devDependency).

## Testing

Node build-output assertions (in the style of the existing build gate), run after
`npm run build`:
1. Every `.example` in `dist/` produces a `Preview` tab + an `HTML` panel.
2. The interactive-component examples that carry `data-vue` also produce a `Vue` panel;
   a count check ties Vue panels to authored snippets.
3. No `data-vue` `<template>` leaks into any built page.
4. SVGs in HTML panels are collapsed (no `<path d=` inside `.example-panel[data-panel="html"]`).
5. Live previews are intact (e.g., a representative `.ds-*` element count on a page is
   unchanged vs. a pre-change baseline for that example).
6. `npm run build` stays green across all 11 pages; `npm run dev` renders tabs.

## Success criteria

1. Every example shows a live vanilla preview plus a generated, copyable HTML code tab.
2. The 10 interactive components additionally show a Vue code tab, authored once with no
   HTML duplication.
3. Inline SVGs are collapsed in the HTML tab; live previews still render real icons.
4. Docs remain static/framework-free and work offline / on `file://`.
5. `npm run build` and the existing gates stay green; the offline bundle is unchanged.
