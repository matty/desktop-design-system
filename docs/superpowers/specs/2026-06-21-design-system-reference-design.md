# Generated Design-System Reference (Humans + LLMs) — Design Spec

> Status: approved design, pre-implementation. Date: 2026-06-21.

## Goal

Make the design system self-describing: an authoritative, always-accurate catalog of
the entire API surface — CSS primitives, utilities, states, modes, tokens, layout
patterns, Vue components, and icons — that both a human and an LLM can use to know
*exactly* what to write to reproduce the styling and layouts shown in the docs, and
which Vue components are available and how to use them. Today `LLM_GUIDE.md` gives
*rules* but no *catalog*; only icons are machine-readable. This closes that gap.

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Source of truth | **Generated from code + curated descriptions.** Surface extracted from the CSS/SFCs/tokens/icons; short descriptions layered on per item. Cannot drift. |
| Depth per entry | **Vocabulary + usage examples + composition patterns.** Names, categories, descriptions, `.is-*` states/sub-parts, Vue props/events/slots, example snippets, and layout patterns. |
| Examples | **Auto-extracted from the docs `.example-preview` markup**, mapped to the classes they use; curated snippet fills gaps. SVGs collapsed for readability. |
| Outputs | **`reference/manifest.json` (canonical) + generated `REFERENCE.md`**, both shipped in the offline bundle. `LLM_GUIDE.md` stays as the rules preamble and links to them. |
| Coverage gate | **Hard-fail.** `reference:check` (inside `npm run build`) fails if any discovered class/token/component has no curated description. |
| Vue metadata | **`vue-component-meta`** (Volar/vue-tsc extractor, build-only devDep) for accurate props/types/defaults/events/slots. |

## Architecture

A standalone Node generator `tools/build-reference.mjs` (run by npm scripts, not a Vite
plugin) reads the codebase, merges curated descriptions, and writes the two artifacts.
It mirrors the existing `tools/build-icons.mjs` pattern (build + `--check` mode,
committed output, build-gated).

### Extraction (the always-accurate surface)

- **CSS classes** — scan `css/components.css` (`.ds-*`), `css/utilities.css` (`.u-*`),
  `css/patterns.css` for class tokens via a selector regex
  (`/\.((?:ds|u|is)-[a-z0-9-]+)/g`), de-duplicated and categorized by prefix and by the
  nearest preceding section comment (the files already use grouped section comments).
  Sub-parts are grouped by name prefix (e.g. `ds-combo`, `ds-combo-btn`,
  `ds-combo-menu`, `ds-combo-option` cluster under `ds-combo`).
- **States/modes** — `.is-*` tokens and `data-*` attributes (e.g. `data-theme`,
  `data-density`) discovered the same way.
- **Tokens** — scan `css/tokens.css` for `--*` custom properties → `{ name, value }`.
- **Vue components** — `vue-component-meta` extracts `{ props (name/type/default/required),
  events, slots }` from `vue/components/*.vue`. Import path derived from `vue/index.ts`.
  The `.ds-*` classes a component renders are read from its SFC `<template>` class
  attributes (links each Vue component to its CSS primitive).
- **Icons** — reference `icons/registry.json` + `icons/approved.json` (already machine
  readable); the manifest includes a pointer/summary, not a copy.

### Curated descriptions + completeness guarantee

Sidecar `docs/reference/descriptions.json`, keyed by class/token/component name:
```json
{ "ds-combo": { "description": "Themed select/combobox popup (no native <select>).",
                "curatedExample": "<div class=\"ds-combo u-w-full\">…</div>" } }
```
The generator merges descriptions into the extracted surface. **Coverage gate:** if any
discovered class/token/component has no description, `reference:check` fails with the
list of missing keys. This is the mechanism that makes the catalog provably complete.

### Examples (no duplication)

The generator parses `.example` blocks in `index.html` + `pages/*.html`, extracts each
`.example-preview` inner markup (collapsing `<svg>…</svg>` → `<svg><!-- icon --></svg>`
for readability), and indexes which `.ds-*`/`.u-*` classes occur in each. Every catalog
entry attaches the example snippet(s) that use it; entries with no docs example fall back
to `curatedExample`. Composition/layout guidance is a `patterns[]` section built from the
**Patterns** page (`pages/patterns.html`) examples, showing how full screens are
assembled. (This example-extraction module is intentionally reusable by the parked
dual-mode docs work.)

### Outputs

- `reference/manifest.json` — canonical structured catalog. Top-level:
  `{ generated: true, version, tokens[], primitives[], utilities[], states[],
  patterns[], components[], icons }`. Each surface entry:
  `{ name, category, description, subParts?[], states?[], examples?[] }`; each component:
  `{ name, import, renders?[], props[], events[], slots[], description, examples?[] }`.
- `REFERENCE.md` — generated from the manifest: grouped sections, each entry rendered as
  a heading + description + states/sub-parts + a fenced example; Vue components rendered
  with a props/events/slots table. Human-skimmable and LLM-ingestible.
- `LLM_GUIDE.md` — updated: keep the rules, add a "Catalog" section linking
  `REFERENCE.md` (humans) and `manifest.json` (tools/LLMs).

### Build integration

- npm scripts: `reference:build` (writes outputs) and `reference:check` (regenerate to a
  temp, diff against committed outputs, AND run the coverage gate; fail on mismatch or
  missing descriptions).
- `npm run build` runs `reference:check` alongside `icons:check`.
- `tools/bundle.mjs` copies `reference/manifest.json` + `REFERENCE.md` into
  `dist/bundle/` (they then appear in `manifest.json`'s file list automatically).

## File structure

```
tools/build-reference.mjs        generator (build + --check)
tools/reference-core.mjs         extraction + manifest assembly (pure; unit-testable)
docs/reference/descriptions.json curated descriptions + gap examples (committed, hand-maintained)
reference/manifest.json          generated, committed, shipped
REFERENCE.md                     generated, committed, shipped
```

## Testing

- **Extraction unit tests** (Vitest, on `reference-core.mjs`): given fixture CSS/SFC
  input, the correct class/token/component entries are produced; sub-part grouping works;
  example→class indexing maps correctly; SVG collapsing applied.
- **Coverage gate test**: a fixture with an undocumented class makes the gate fail with
  that key listed.
- **Determinism/check test**: `reference:build` then `reference:check` is clean
  (byte-identical, stable ordering).
- **Vue meta test**: each of the 10 components appears in the manifest with its props and
  events (e.g. `DsCombobox` has `modelValue` prop + `update:modelValue` event).
- **Build gate**: `npm run build` runs `reference:check` and stays green; bundle contains
  both reference files.

## Scope & non-goals

- Catalogs only the existing surface — adds no components/classes.
- Not a live/interactive docs UI (that is the parked dual-mode docs spec, which will reuse
  this generator's example-extraction module).
- No runtime dependency added; `vue-component-meta` is build-only. Offline bundle gains
  two files.

## Success criteria

1. `reference/manifest.json` enumerates every `.ds-*`/`.u-*`/`.is-*` class, `data-*`
   mode, token, layout pattern, and Vue component — each with a description, and an
   example where one exists.
2. Each Vue component lists accurate props/types/defaults/events/slots (from
   `vue-component-meta`) and its import path + rendered `.ds-*` classes.
3. `REFERENCE.md` is generated from the manifest and reads cleanly for a human; both ship
   in the offline bundle; `LLM_GUIDE.md` links them.
4. The coverage gate hard-fails the build if any surface item lacks a description, so the
   catalog is provably complete.
5. `reference:build` is deterministic; `reference:check` passes in CI/build; `npm run
   build` and existing gates stay green.
