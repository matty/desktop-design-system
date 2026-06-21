# Generated Design-System Reference + Validator (Humans + LLMs) — Design Spec

> Status: approved design, pre-implementation. Date: 2026-06-21.
> Revision 2: added the usage **validator** (reliability backbone), adopted `llms.txt`
> + a shadcn-style registry shape, and recorded extraction caveats. The original
> reference-only design is superseded by this.

## Goal

Make the design system self-describing **and self-enforcing**: an authoritative,
always-accurate catalog of the entire API surface (CSS primitives, utilities, states,
modes, tokens, layout patterns, Vue components, icons) that a human or LLM can use to
know exactly what to write — plus a **validator** that mechanically catches markup/Vue
usage referencing classes, components, or props that don't exist. A reference tells you
what's available; the validator is what makes "do we really know" *reliable* rather than
hopeful.

## Why a validator (the Tailwind/shadcn lesson)

Research into how mature systems handle this:
- **Tailwind** never hand-lists classes — its reliability comes from a resolver + a
  **linter that validates markup** and flags invalid classes, not from a doc people are
  trusted to read.
- **shadcn/ui** (same copy-in distribution model as our Vue layer) ships a
  machine-readable **registry schema** (name/description/type/files per item) and an
  **`llms.txt`** that AI tools — explicitly including Claude Code — consume to understand
  and use components.

Takeaways baked into this design: (1) ship the catalog in conventional, tool-consumable
shapes (`llms.txt` + registry-style manifest), and (2) add a validator so an LLM that
ignores or misreads the reference is caught mechanically.

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Source of truth | Generated from code + curated descriptions; cannot drift. |
| Depth per entry | Vocabulary + usage examples + composition patterns. |
| Examples | Auto-extracted from the docs `.example-preview` markup; curated snippet fills gaps; SVGs collapsed. |
| Outputs | `reference/manifest.json` (canonical, **shadcn-registry-style item shape**) + generated `REFERENCE.md` + **`llms.txt`** entry point. All shipped in the offline bundle. `LLM_GUIDE.md` stays the rules preamble; `AGENTS.md`/`CLAUDE.md` point at `llms.txt`. |
| Coverage gate | Hard-fail: `reference:check` fails if any discovered class/token/component lacks a curated description. |
| Vue metadata | `vue-component-meta` for props/types/defaults/slots (build-only devDep). |
| **Validator** | A `reference:lint` step checks target HTML/Vue files against the manifest; unknown `.ds-*`/`.u-*`/`.is-*` class, unknown component, or unknown prop ⇒ error. Runs over the docs pages in `npm run build`, and is exposed for consumers to lint their own apps. |

## Architecture

A standalone Node generator `tools/build-reference.mjs` (build + `--check` modes,
committed output, build-gated — mirroring `tools/build-icons.mjs`), a pure
`tools/reference-core.mjs` (extraction + manifest assembly; unit-testable), and a
`tools/lint-usage.mjs` validator that consumes the generated manifest.

### Extraction (always-accurate surface)

- **CSS classes** — scan `css/components.css` (`.ds-*`), `css/utilities.css` (`.u-*`),
  `css/patterns.css` for class tokens via selector regex
  (`/\.((?:ds|u|is)-[a-z0-9-]+)/g`), de-duped, categorized by prefix and nearest section
  comment; sub-parts grouped by name prefix (`ds-combo` ⊃ `ds-combo-btn`/`-menu`/`-option`).
- **States/modes** — `.is-*` tokens and `data-*` attributes.
- **Tokens** — `--*` custom properties from `tokens.css` → `{ name, value }`. *(Optional
  interop: emit a parallel W3C Design-Tokens-format file later; not in scope now.)*
- **Vue components** — `vue-component-meta` → props (name/type/default/required), events,
  slots; import path from `vue/index.ts`; rendered `.ds-*` classes read from the SFC
  `<template>`.
- **Icons** — pointer/summary to `icons/registry.json` + `approved.json` (already machine
  readable).

### Curated descriptions + completeness guarantee

Sidecar `docs/reference/descriptions.json`, keyed by name → `{ description,
curatedExample? }`. Merged into the surface. **Coverage gate** (`reference:check`) fails
listing any item with no description — the mechanism that makes the catalog provably
complete.

### Examples (no duplication)

Generator parses `.example` blocks in `index.html` + `pages/*.html`, extracts each
`.example-preview` markup (collapsing `<svg>…</svg>` → `<svg><!-- icon --></svg>`),
indexes classes→examples, and attaches snippet(s) per entry; gaps fall back to
`curatedExample`. Composition guidance → a `patterns[]` section from `pages/patterns.html`.
(This extractor is intentionally reusable by the parked dual-mode docs work.)

### Outputs

- **`reference/manifest.json`** — canonical. Top level `{ generated, version, tokens[],
  primitives[], utilities[], states[], patterns[], components[], icons }`. Items follow a
  registry-item-style shape: `{ name, type, category, description, subParts?[], states?[],
  examples?[] }`; components add `{ import, renders?[], props[], events[], slots[] }`.
- **`REFERENCE.md`** — generated from the manifest (grouped sections, per-entry heading +
  description + states/sub-parts + fenced example; component props/events/slots tables).
- **`llms.txt`** — generated entry point: one-paragraph orientation + the class grammar
  rules (from `LLM_GUIDE.md`) + links to `REFERENCE.md` and `manifest.json`. This is the
  file AI tools (Claude Code, Cursor, Copilot) look for.
- `LLM_GUIDE.md` keeps the rules and links the above; `AGENTS.md`/`CLAUDE.md` reference
  `llms.txt`.

### Validator (`tools/lint-usage.mjs`)

Consumes `reference/manifest.json`. Given target files (globs), it:
- extracts `.ds-*`/`.u-*`/`.is-*` class tokens from HTML `class=` attributes and Vue
  templates, and Vue component tags + their props from `.vue` files;
- errors on: a class not in the manifest, a `Ds*` component not exported, or a prop not in
  that component's prop list; warns on deprecated entries (future).
- **Scope is honest:** it validates the *vocabulary* (names exist), not semantics — it
  cannot judge whether a layout is correct or whether a class is used sensibly.
- Wired two ways: `npm run reference:lint` over the docs pages runs inside `npm run build`
  (so doc typos are caught too); and it's documented/exposed so a consumer can point it at
  their own app (`node tools/lint-usage.mjs "src/**/*.{vue,html}"`), shipped in the bundle.

### Build integration

`reference:build` writes outputs; `reference:check` regenerates-to-temp + diffs +
coverage gate; `reference:lint` validates the docs pages. `npm run build` runs
`reference:check` and `reference:lint` alongside `icons:check`. `tools/bundle.mjs` copies
`reference/manifest.json`, `REFERENCE.md`, `llms.txt`, and `tools/lint-usage.mjs` into
`dist/bundle/`.

## Honest caveats (recorded so they're not surprises)

- **`vue-component-meta` does not extract event/emit descriptions** (only props/slots/
  exposed). Event *names/types* are extracted; their *descriptions* must be curated in the
  sidecar.
- **The CSS scan finds class *names*, not their semantics.** Descriptions for classes are
  hand-curated — that half is effectively maintained documentation with a completeness
  gate, not true auto-generation.
- **The validator checks vocabulary, not correctness.** It catches unknown/typo'd
  classes/components/props; it cannot verify a layout matches a design or that usage is
  idiomatic.
- **`llms.txt` is a convention, not a guarantee.** It improves interop with the AI tools
  we use; it does not force any model to comply. The validator is the actual enforcement.

## File structure

```
tools/reference-core.mjs          extraction + manifest assembly (pure, unit-tested)
tools/build-reference.mjs         generator (build + --check + coverage gate)
tools/lint-usage.mjs              validator (consumes manifest; shipped in bundle)
docs/reference/descriptions.json  curated descriptions + gap examples + event descriptions (hand-maintained)
reference/manifest.json           generated, committed, shipped
REFERENCE.md                      generated, committed, shipped
llms.txt                          generated, committed, shipped
```

## Testing

- **Extraction unit tests** (Vitest on `reference-core.mjs`): correct class/token/
  component entries from fixtures; sub-part grouping; example→class indexing; SVG collapse.
- **Coverage gate test**: a fixture with an undocumented class fails the gate, listing the key.
- **Determinism test**: `reference:build` then `reference:check` is byte-identical.
- **Vue meta test**: each of the 10 components appears with props + events (e.g.
  `DsCombobox` → `modelValue` prop + `update:modelValue` event); event description sourced
  from the sidecar (covers the caveat).
- **Validator tests**: a fixture using a real class passes; an unknown class, an unknown
  `Ds*` component, and an unknown prop each produce an error; the docs pages lint clean.
- **Build gate**: `npm run build` runs `reference:check` + `reference:lint` and stays
  green; bundle contains the four shipped reference artifacts.

## Scope & non-goals

- Catalogs/validates the existing surface only — adds no components/classes.
- Not a live/interactive docs UI (parked dual-mode docs spec; will reuse this extractor).
- No W3C Design-Tokens output in this iteration (optional follow-up).
- No runtime dependency added; `vue-component-meta` is build-only. Offline bundle gains
  four files (manifest, REFERENCE.md, llms.txt, lint-usage.mjs).

## Success criteria

1. `reference/manifest.json` enumerates every `.ds-*`/`.u-*`/`.is-*` class, `data-*`
   mode, token, layout pattern, and Vue component — each with a description and an example
   where one exists — in a registry-item-style shape.
2. Each Vue component lists accurate props/types/defaults/slots (from `vue-component-meta`)
   + event names, import path, and rendered `.ds-*` classes; event descriptions curated.
3. `REFERENCE.md` and `llms.txt` are generated from the manifest; all four artifacts ship
   in the offline bundle; `LLM_GUIDE.md` and `AGENTS.md`/`CLAUDE.md` link `llms.txt`.
4. The coverage gate hard-fails the build if any surface item lacks a description.
5. `reference:lint` flags unknown classes/components/props; it runs clean over the docs
   pages in `npm run build`, and consumers can run it over their own app.
6. `reference:build` is deterministic; `npm run build` and existing gates stay green.
