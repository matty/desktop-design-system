# Storybook for the Vue Component Layer — Design Spec

> Status: approved design, pre-implementation. Date: 2026-06-21.

## Goal

Stand up Storybook as the **Vue-component workbench, API reference, and behavior/a11y
test surface** for the 53-component layer: generated prop/event/slot docs, a live
playground with theme/density toggles, axe accessibility checks, and real-browser
interaction tests for the interactive components — coexisting with (not replacing) the
existing static `.ds-*` CSS-language docs.

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Vite 8 posture | **Proceed, spike-gated.** First task is a go/no-go feasibility spike installing Storybook + `@storybook/vue3-vite` against the repo's Vite 8 and rendering a component; if it hard-fails, STOP and report. |
| Story scope | **Autodocs (`vue-component-meta`) + lean stories** — a `Default` per component + variant stories only where meaningful. |
| Addons/testing | **addon-a11y (axe) + interaction tests (`play`) on the ~10 interactive components**, run headlessly via the **Storybook test-runner**. Defer the Vitest-browser addon and Chromatic. |
| a11y CI posture | **Report-only now, hard-fail later** (the known deferred a11y backlog would otherwise red-wall every run; flip to fail once the full-a11y workstream lands). |
| Role/output | **Coexist** with the static CSS docs; `storybook build` → gitignored `storybook-static/`; **no hosting**. Theme/density toolbar (dark default). |

## Architecture

### Config (`.storybook/`)
- **`main.ts`**: `framework: { name: '@storybook/vue3-vite', options: { docgen: 'vue-component-meta' } }`; `stories: ['../vue/**/*.stories.ts']`; `addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-interactions']` (some are core in SB9 — the spike confirms the exact package set/version).
- **`preview.ts`**: `import '../src/design-language.css'`; global `decorators` that read the theme/density globals and set `data-theme`/`data-density` on the story root wrapper (canvas background = surface token); `globalTypes` for `theme` (dark|light, default dark) and `density` (comfortable|compact, default comfortable) rendered as toolbar dropdowns; `parameters.a11y` config; `parameters.controls`/`docs` defaults; `tags: ['autodocs']` global.
- **npm scripts**: `storybook` (`storybook dev -p 6006`), `build-storybook` (`storybook build -o storybook-static`), `test-storybook` (`test-storybook`, the test-runner).
- `.storybook/` committed; `storybook-static/` added to `.gitignore`.

### Stories (CSF3, co-located `vue/components/DsX.stories.ts`)
- Grouped via `title`: `Foundation/*` (DsIcon, DsButton), `Form/*`, `Display/*`, `Shell/*`, `Interactive/*`.
- Each `meta`: `component`, `title`, `tags:['autodocs']`, `argTypes` only where autodocs needs help; a `Default` story.
- **Variant stories where meaningful:** DsButton (variants/sizes/icon/loading), DsBadge/DsAlert/DsStatus (tones/states), DsAvatar (sizes/img-vs-initials), DsCombobox (single/multi/checklist/filterable), DsDialog (open via a toggle story), DsField (wrapping DsInput, with error/hint), DsTabs+DsTabPanel, DsAccordion+DsAccordionItem (single/multiple), DsToastHost + a `useToast()` trigger, DsRadioGroup/DsSegmented (options), DsMeter/DsProgress (values), DsBreadcrumb/DsRail/DsNavItem, DsTitlebar. Trivial wrappers (DsCard, DsPill, DsKbd, DsSkeleton, etc.) get just `Default`.
- **Composed/context stories** use a `render` function (e.g. DsField wrapping a control; DsTabs with panels; DsAccordion with items; DsToastHost with a button calling `useToast().toast(...)`).

### Interaction tests (`play` functions, `@storybook/test`)
On the interactive components only: DsCombobox (open + select + multi toggle + filter), DsDialog (open + Esc + backdrop close), DsDropdownMenu (open + select + outside-close), DsTabs (click + arrow-key switch), DsAccordion (toggle), DsTree (expand + arrow nav), DsContextMenu (right-click open + select), DsSortable (reorder via the mocked/handle path as feasible in-browser), DsToastHost (fire + dismiss). Each `play` drives the rendered DOM with `userEvent` + asserts with `expect` from `@storybook/test`. Runnable headlessly via `test-storybook`.

### Accessibility (addon-a11y)
axe runs on every story in the UI's Accessibility panel and in the test-runner. **Posture: report-only** — `parameters.a11y.test = 'todo'` (surface violations without failing) initially; documented to flip to `'error'` when the full-a11y workstream completes. Per-story `a11y` parameter overrides allowed for known-deferred rules.

### Coexistence
Storybook is fully separate from the docs Vite build (`vite.config.mjs` + `docs/nav.mjs` untouched). `npm run dev`/`build`/`bundle`/`test`/`typecheck` are unaffected. The static CSS-language docs remain the home for the `.ds-*` grammar; Storybook is the Vue-component surface.

## Dependencies (build/dev only; not shipped in the offline bundle)

`storybook`, `@storybook/vue3-vite`, `@storybook/addon-a11y`, `@storybook/addon-docs`, `@storybook/addon-interactions`, `@storybook/test`, `@storybook/test-runner`, and the test-runner's Playwright browser. Exact versions pinned during the spike to the set compatible with Vite 8 (with an npm `overrides` entry if a transitive peer pin is the only blocker — documented).

## Testing / verification

1. **Spike gate:** Storybook installs against Vite 8 and `storybook dev` + `build-storybook` render a sample component. Go/no-go.
2. **Docgen:** an autodocs page for a representative component (e.g. DsButton, DsCombobox) shows accurate props/events/slots from `vue-component-meta`.
3. **Theming:** toolbar toggles flip `data-theme`/`data-density` and the canvas restyles.
4. **`build-storybook`** exits 0 → `storybook-static/`.
5. **`test-storybook`** runs the `play` functions green (real browser).
6. **a11y** panel/test-runner reports violations without failing the run (report-only).
7. **Regression:** existing `npm test` / `npm run typecheck` / `npm run build` stay green after adding Storybook deps + `.stories.ts` files (stories must not be picked up by the unit-test Vitest glob, which is `vue/**/*.test.ts` — `.stories.ts` is excluded by that pattern; verify).

## Phasing (for the implementation plan)

- **Phase 1 — Spike + config:** install (Vite-8 go/no-go), `.storybook/main.ts`+`preview.ts`, theme/density toolbar, CSS import, a11y addon, one sample story; scripts; `.gitignore`.
- **Phase 2 — Stories (autodocs + variants):** stories for all 53 components in title groups; verify autodocs accuracy.
- **Phase 3 — Interaction tests:** `play` functions on the interactive set; wire `test-storybook`.
- **Phase 4 — Gate:** `build-storybook` + `test-storybook` green; a11y report-only; existing gates green; docs/scripts note.

## Non-goals

- No Chromatic, no Vitest-browser addon, no GitHub Pages hosting.
- Not replacing the static CSS-language docs.
- No new components and no a11y *fixes* (the addon surfaces the backlog; fixing is the separate full-a11y workstream).
- Storybook output is not added to the offline release bundle.

## Success criteria

1. `storybook dev` runs against Vite 8 (or the spike cleanly reports it can't, and we stop).
2. All 53 components have at least a `Default` story; autodocs shows accurate props/events/slots.
3. Theme + density toolbar toggles work (dark default).
4. The interactive components have `play` interaction tests that pass under `test-storybook` in a real browser.
5. axe a11y runs report-only; violations are visible but don't fail the run.
6. `build-storybook` produces a static, offline-openable `storybook-static/`; `.gitignore` excludes it.
7. The existing docs build and unit-test/typecheck gates remain green.
