# Cross-layer alignment coverage gate

**Date:** 2026-06-23
**Status:** Approved (design) — pending implementation plan
**Depends on:** `2026-06-21-dual-mode-docs-design.md` (supplies the docs↔Vue `data-vue` signal)

## Problem

A single design-system feature now spans four layers: the CSS language (`css/*.css`), the
Vue wrappers (`vue/components/*.vue`), Storybook stories (`*.stories.ts`), and the static
docs (`pages/*.html`). Adding a feature in one layer without the others drifts silently —
nothing flags it. Confirmed today, unflagged:

- **52 Vue components in the manifest, 48 `.stories.ts` files** → 4 components have no story.
- **29 of 74 CSS primitives have zero docs examples** (`reference/manifest.json`
  `primitives[].examples` is empty for them).
- **No tool references Storybook at all** — the entire Vue/Storybook layer is outside the
  existing alignment tooling (`reference:check`, `reference:lint`).

The existing tooling already catalogs and validates two layers (CSS + Vue source →
`reference/manifest.json`; markup validated by `lint-usage.mjs`). The gap is a *cross-layer
coverage* check that ties components ↔ stories ↔ docs ↔ CSS together and fails the build on
drift.

## Goals

1. **Detect drift** at build time: anything present in one layer but missing its expected
   counterpart in another is reported.
2. **Warn-first, then failing** — ship reporting the real backlog without breaking the build;
   promote to a hard failure once the backlog is burned down (the proven `reference:check`
   rollout pattern).
3. **Build on the manifest** — `reference/manifest.json` is the hub; no new parallel catalog.
4. **Enforce the role split** decided in brainstorming: static docs = canonical CSS-language
   reference (+ dual-mode HTML/Vue tabs); Storybook = internal Vue dev/QA workbench; CSS is
   the single source of truth. The gate enforces this instead of manual policing.

## Non-goals

- Regenerating one surface from another (no Storybook→docs codegen; no docs→stories codegen).
  The two example surfaces document two genuinely different consumption paths and stay
  separately authored, cross-checked only.
- Re-implementing class/prop validation already done by `lint-usage.mjs` — the gate reuses it,
  not duplicates it.
- A11y coverage (explicitly out of scope for the project at this stage).
- Burning down the 29-example / 4-story backlog as part of this spec — the gate *surfaces* it;
  closing it is follow-on work (warn-only until then).

## Decisions

| Topic | Decision |
|---|---|
| Where it lives | New `tools/coverage.mjs` + co-located `tools/coverage.test.mjs`, matching the existing `tools/*.mjs` + `*.test.mjs` convention. Shared logic factored into a core module if it grows (mirroring `reference-core.mjs`). |
| Data source | Consumes `reference/manifest.json` (built first), the filesystem (`vue/components/*.stories.ts`), and the docs `data-vue` snippets. No new catalog. |
| Rollout | **Warn-first**: prints a report and exits 0 under `coverage:check`; a `--strict` mode exits non-zero. Build uses warn mode until backlog is clear, then flips to `--strict`. |
| Build wiring | New `coverage:check` script, run in `build` after `reference:check`/`reference:lint` (needs the fresh manifest), before `vite build`. |
| Docs↔Vue signal | "Component appears in docs" = a `data-vue` snippet naming that component exists in some `pages/*.html`. This is produced by the dual-mode docs plugin (dependency spec). Until that lands, this single assertion stays warn-only/skipped; the other three assertions are live immediately. |

## Assertions

The gate cross-references the layers using the manifest as the hub:

| # | Assertion | Sources | Drift today |
|---|---|---|---|
| 1 | Every Vue component (`components[]`) has a Storybook story file | manifest × `vue/components/<Name>.stories.ts` | 4 missing |
| 2 | Every CSS primitive (`primitives[]`) has ≥1 docs example | manifest `primitives[].examples` | 29 missing |
| 3 | Every class listed in a component's `renders[]` is a real primitive | manifest `components[].renders` × `primitives[].name` | reuses lint logic |
| 4 | Every Vue component appears in the docs (a `data-vue` snippet names it) | manifest `components[]` × `data-vue` snippets in `pages/*.html` | needs dual-mode (B); warn-only until then |

Each violation reports: the assertion, the offending entity, and the file/layer where the
counterpart is missing — actionable, not just a count.

## Architecture

```
reference/manifest.json ──┐
vue/components/*.stories.ts ─┤
pages/*.html (data-vue)   ──┼──> tools/coverage.mjs ──> report (warn) | exit 1 (--strict)
                              │
        (class set) ─────────┘   reuses lint-usage primitive/class knowledge
```

- `coverage.mjs` loads the manifest, globs story files and pages, runs the four assertions,
  prints a grouped human-readable report (counts + per-item detail), and returns an exit code
  governed by `--strict`.
- Story presence: filename convention `vue/components/<ComponentName>.stories.ts`. If a
  component legitimately shares a story file (e.g. `DsTabPanel` documented inside
  `DsTabs.stories.ts`), the gate allows a small declared allowlist/alias map so shared-story
  components don't false-positive. The 4 current gaps are validated against this before
  promoting to strict.
- Assertion 4 reads the same `data-vue` template markup the dual-mode plugin consumes; it
  matches the PascalCase component tag against the manifest `components[].name`.

## Components and interfaces

- **`tools/coverage.mjs`** — input: manifest path, glob roots, `--strict` flag; output:
  stdout report + exit code. No writes.
- **`tools/coverage.test.mjs`** — Vitest, in the style of `reference-core.test.mjs`: feeds
  synthetic manifest + fixture file lists, asserts each rule fires/passes and that `--strict`
  controls the exit code.
- **`package.json`** — add `"coverage:check": "node tools/coverage.mjs"` (warn) and wire it
  into `build` after `reference:lint`. A later commit appends `--strict` once backlog is clear.

## Error handling

- Missing/stale manifest → fail fast with a message to run `reference:build` first (the gate
  must run after `reference:check` in `build`, so the manifest is fresh).
- A page or story file that can't be read → hard error, not a silent skip (consistent with
  `bundle.mjs` / the Vite plugin failing on missing inputs).
- Warn mode never masks a real error: parse/IO failures still exit non-zero even without
  `--strict`; only *coverage violations* are downgraded to warnings in non-strict mode.

## Testing (manual + unit)

- Unit: `tools/coverage.test.mjs` covers each assertion (pass + fail fixtures) and the
  strict/warn exit-code split.
- Manual: `npm run coverage:check` reports exactly the known backlog (4 stories, 29 examples)
  on the current tree; adding a throwaway component with no story makes it appear in the report;
  `--strict` exits non-zero while warn mode exits 0.
- `npm run build` stays green in warn mode.

## Sequencing (across both specs)

1. **Workstream A, warn-only** — ship `coverage.mjs` + tests + `coverage:check` (this spec).
   Immediate visibility of the real backlog; build stays green.
2. **Workstream B** — implement the dual-mode docs plugin (`2026-06-21` spec). This supplies
   the `data-vue` signal assertion 4 needs.
3. **Promote A to `--strict`** — after the story/example backlog is burned down and B has
   landed, flip `coverage:check` to `--strict` in `build`. Drift can no longer land.

## Consciously deferred (YAGNI)

- Closing the existing backlog (4 stories, 29 examples) — separate follow-on, not this spec.
- Token/utility/state docs-example coverage beyond primitives — add only if those layers prove
  to drift; primitives + components are where drift bites today.
- Any Storybook→docs or docs→Storybook generation.
