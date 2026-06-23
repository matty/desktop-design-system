# Generated Design-System Reference + Validator (Humans + LLMs) — Design Spec

> Status: approved design, pre-implementation. Date: 2026-06-21.
> Revision 2: added the usage **validator** (reliability backbone), adopted `llms.txt`
> + a shadcn-style registry shape, and recorded extraction caveats. The original
> reference-only design is superseded by this.
> Revision 3 (2026-06-23): refreshed against current repo state — coverage gate is now
> **warn-first** (hard-fail behind `--strict`), component extraction covers all **53**
> Vue components (was 10), the CSS scan **reuses the existing `vue/__support__/css.ts`**
> extractor instead of a second implementation, and a **Storybook coexistence** note is
> recorded. Architecture is otherwise unchanged from Revision 2.

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

## Relationship to Storybook (coexistence)

Storybook (added after Revision 2) already renders each Vue component's
props/events/slots via `vue-component-meta` autodocs and shows live, interactive
examples. The reference/validator **intentionally overlaps** that and is still required:

- Storybook is the **interactive workbench** for a human at a browser. The
  `manifest.json` is the **offline, machine-consumable catalog** an LLM or build tool
  reads without booting a browser, and the **only** artifact that can power the
  validator's prop-checking against a *consumer's* app.
- The reference covers the **whole surface** (CSS classes, tokens, states, modes,
  patterns, icons) — not just Vue components — which Storybook does not catalog.
- Both derive component metadata from the same `vue-component-meta` source, so they
  cannot disagree about props/types.

The two are kept in sync by construction (same extractor source), not by manual effort.

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Source of truth | Generated from code + curated descriptions; cannot drift. |
| Depth per entry | Vocabulary + usage examples + composition patterns. |
| Examples | Auto-extracted from the docs `.example-preview` markup (not Storybook stories — cleaner HTML); curated snippet fills gaps; SVGs collapsed. |
| Outputs | `reference/manifest.json` (canonical, **shadcn-registry-style item shape**) + generated `REFERENCE.md` + **`llms.txt`** entry point. All shipped in the offline bundle. `LLM_GUIDE.md` stays the rules preamble; `AGENTS.md`/`CLAUDE.md` point at `llms.txt`. |
| Coverage gate | **Warn-first.** `reference:check` lists any discovered class/token/component lacking a curated description as a **warning** and stays exit 0; a `--strict` flag (and the build, once descriptions are complete) turns missing descriptions into a hard-fail. |
| Component coverage | **All 53** Vue components, enumerated from `vue/index.ts` exports (not a fixed list). |
| CSS extraction | **Reuse/extend `vue/__support__/css.ts`** (the existing class extractor, currently test-only) as the shared source of "what classes exist" — no second regex implementation. |
| Vue metadata | `vue-component-meta` for props/types/defaults/slots (already a build/dev dependency via Storybook). |
| **Validator** | A `reference:lint` step checks target HTML/Vue files against the manifest; unknown `.ds-*`/`.u-*`/`.is-*` class, unknown component, or unknown prop ⇒ error. Runs over the docs pages in `npm run build`, and is exposed for consumers to lint their own apps. |

## Architecture

A standalone Node generator `tools/build-reference.mjs` (build + `--check` modes,
committed output, build-gated — mirroring `tools/build-icons.mjs`), a pure
`tools/reference-core.mjs` (extraction + manifest assembly; unit-testable), and a
`tools/lint-usage.mjs` validator that consumes the generated manifest.

### Extraction (always-accurate surface)

- **CSS classes** — scan `css/components.css` (`.ds-*`), `css/utilities.css` (`.u-*`),
  `css/patterns.css` for class tokens. **Reuse the existing extractor in
  `vue/__support__/css.ts`** (promote its shared core so both the Vitest support helper
  and the generator import one implementation); de-dupe, categorize by prefix and
  nearest section comment; sub-parts grouped by name prefix (`ds-combo` ⊃
  `ds-combo-btn`/`-menu`/`-option`).
- **States/modes** — `.is-*` tokens and `data-*` attributes.
- **Tokens** — `--*` custom properties from `tokens.css` → `{ name, value }`. *(Optional
  interop: emit a parallel W3C Design-Tokens-format file later; not in scope now.)*
- **Vue components** — `vue-component-meta` → props (name/type/default/required), events,
  slots; import path from `vue/index.ts`; rendered `.ds-*` classes read from the SFC
  `<template>`. Iterates every export of `vue/index.ts` (all 53 components).
- **Icons** — pointer/summary to `icons/registry.json` + `approved.json` (already machine
  readable).

### Curated descriptions + completeness reporting

Sidecar `docs/reference/descriptions.json`, keyed by name → `{ description,
curatedExample? }`. Merged into the surface. **Coverage report** (`reference:check`)
lists any item with no description as a warning; with `--strict` (or once the surface is
fully described) it exits non-zero. The report always prints the full gap list so
progress toward "fully described" is visible each run.

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
coverage report (warn-first; `--strict` to fail on gaps); `reference:lint` validates the
docs pages. `npm run build` runs `reference:check` and `reference:lint` alongside
`icons:check`. The diff check (output is stale vs source) **does** hard-fail the build —
only the *description-coverage* portion is warn-first. `tools/bundle.mjs` copies
`reference/manifest.json`, `REFERENCE.md`, `llms.txt`, and `tools/lint-usage.mjs` into
`dist/bundle/`.

## Honest caveats (recorded so they're not surprises)

- **`vue-component-meta` does not extract event/emit descriptions** (only props/slots/
  exposed). Event *names/types* are extracted; their *descriptions* must be curated in the
  sidecar.
- **The CSS scan finds class *names*, not their semantics.** Descriptions for classes are
  hand-curated — that half is effectively maintained documentation with a completeness
  report, not true auto-generation.
- **The validator checks vocabulary, not correctness.** It catches unknown/typo'd
  classes/components/props; it cannot verify a layout matches a design or that usage is
  idiomatic.
- **`llms.txt` is a convention, not a guarantee.** It improves interop with the AI tools
  we use; it does not force any model to comply. The validator is the actual enforcement.
- **Warn-first means descriptions can lag.** Until the surface is fully described and the
  gate is flipped to `--strict`, the manifest may contain entries with empty descriptions
  (each surfaced in the `reference:check` report). This is the deliberate trade for
  landing the tooling green immediately.

## File structure

```
tools/reference-core.mjs          extraction + manifest assembly (pure, unit-tested)
tools/build-reference.mjs         generator (build + --check + coverage report/--strict)
tools/lint-usage.mjs              validator (consumes manifest; shipped in bundle)
docs/reference/descriptions.json  curated descriptions + gap examples + event descriptions (hand-maintained)
reference/manifest.json           generated, committed, shipped
REFERENCE.md                      generated, committed, shipped
llms.txt                          generated, committed, shipped
```

The shared CSS class extractor lives in (or is promoted out of) `vue/__support__/css.ts`
so both the test helper and `reference-core.mjs` consume one implementation.

## Testing

- **Extraction unit tests** (Vitest on `reference-core.mjs`): correct class/token/
  component entries from fixtures; sub-part grouping; example→class indexing; SVG collapse.
- **Shared-extractor test**: `reference-core.mjs` and the `vue/__support__/css.ts` helper
  return the same class set for `components.css` (proves the single source of truth).
- **Coverage report test**: a fixture with an undocumented class is listed as a gap and
  `reference:check` stays exit 0; the same run under `--strict` exits non-zero.
- **Determinism test**: `reference:build` then `reference:check` is byte-identical.
- **Vue meta test**: a representative sample across title groups (e.g. `DsButton`,
  `DsCombobox`, `DsTabs`, `DsToastHost`) appears with props + events (e.g. `DsCombobox`
  → `modelValue` prop + `update:modelValue` event); event description sourced from the
  sidecar (covers the caveat); the manifest contains all 53 exports of `vue/index.ts`.
- **Validator tests**: a fixture using a real class passes; an unknown class, an unknown
  `Ds*` component, and an unknown prop each produce an error; the docs pages lint clean.
- **Build gate**: `npm run build` runs `reference:check` (warn-first) + `reference:lint`
  and stays green; bundle contains the four shipped reference artifacts.

## Scope & non-goals

- Catalogs/validates the existing surface only — adds no components/classes.
- Not a live/interactive docs UI (parked dual-mode docs spec; will reuse this extractor).
- Does not replace Storybook; coexists with it (see Relationship to Storybook).
- No W3C Design-Tokens output in this iteration (optional follow-up).
- No runtime dependency added; `vue-component-meta` is build-only. Offline bundle gains
  four files (manifest, REFERENCE.md, llms.txt, lint-usage.mjs).

## Success criteria

1. `reference/manifest.json` enumerates every `.ds-*`/`.u-*`/`.is-*` class, `data-*`
   mode, token, layout pattern, and Vue component — each with a description where one
   exists and an example where one exists — in a registry-item-style shape.
2. Every component exported from `vue/index.ts` (all 53) lists accurate
   props/types/defaults/slots (from `vue-component-meta`) + event names, import path, and
   rendered `.ds-*` classes; event descriptions curated.
3. `REFERENCE.md` and `llms.txt` are generated from the manifest; all four artifacts ship
   in the offline bundle; `LLM_GUIDE.md` and `AGENTS.md`/`CLAUDE.md` link `llms.txt`.
4. The coverage report lists every surface item lacking a description and is warn-first;
   `--strict` (and the build, once complete) hard-fails on gaps.
5. `reference:lint` flags unknown classes/components/props; it runs clean over the docs
   pages in `npm run build`, and consumers can run it over their own app.
6. `reference:build` is deterministic; `npm run build` and existing gates stay green.
