# Storybook — Phase 1: Spike + Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove Storybook installs and runs against the repo's Vite 8 (go/no-go), then stand up the customized config — `vue-component-meta` autodocs, the design-language CSS, a theme/density toolbar, and the axe a11y addon (report-only) — with one sample story end-to-end.

**Architecture:** Use `storybook init` to scaffold the version-correct `@storybook/vue3-vite` baseline (so config matches the resolved Storybook major), then customize `.storybook/main.ts` + `preview.ts` to this project. Storybook is a separate dev surface; the existing docs build and unit tests are untouched.

**Tech Stack:** Storybook (latest compatible with Vite 8), `@storybook/vue3-vite`, `@storybook/addon-a11y`, `vue-component-meta` docgen, Vue 3.5, Vite 8.

## Global Constraints

- The repo build is committed to **Vite `^8`** — do NOT downgrade Vite to make Storybook fit. If Storybook cannot resolve/run against Vite 8 (even with a documented npm `overrides` peer pin), STOP at Task 1 and report BLOCKED with the exact error.
- Storybook is dev/docs/test only — it is NOT added to the offline release bundle (`tools/bundle.mjs` untouched).
- Do NOT modify `vite.config.mjs`, `docs/nav.mjs`, `js/ds.js`, `css/`, `src/`, `pages/`, or any existing component. Storybook config lives under `.storybook/`; sample story under `vue/components/`.
- The existing gates must stay green after install: `npm test`, `npm run typecheck`, `npm run build`.
- `storybook-static/` (build output) must be git-ignored.
- a11y posture is **report-only** (`parameters.a11y.test = 'todo'`), not failing, due to the known deferred a11y backlog.

---

### Task 1: Spike — install Storybook + verify on Vite 8 (GO/NO-GO)

**Files:**
- Create (via init): `.storybook/main.*`, `.storybook/preview.*`, generated example stories, `package.json` devDeps + scripts, `package-lock.json`.

**Interfaces:** Produces a working `npm run storybook` (dev) and `npm run build-storybook` on Vite 8, or a BLOCKED report.

- [ ] **Step 1: Record baseline**

Run: `npm test >/dev/null 2>&1; echo "tests:$?"` and `git rev-parse --short HEAD`
Expected: `tests:0`. Note the SHA (rollback point).

- [ ] **Step 2: Run Storybook's initializer**

Run: `npx storybook@latest init --yes --builder vite`
Expected: it detects Vue 3 + Vite, installs `storybook` + `@storybook/vue3-vite` (+ core addons), writes `.storybook/`, adds `storybook`/`build-storybook` scripts, and may create `src/stories/` examples.
- If it ERRORS on a Vite 8 peer conflict: retry once with an `overrides` pin — add to `package.json` an `"overrides": { "vite": "$vite" }` (pin Storybook's transitive vite to the project's), then `npm install`, then re-run init's config only. Document exactly what you changed.
- If it still cannot resolve/run against Vite 8: **STOP. Report BLOCKED** with the npm/peer error verbatim and which versions were attempted. Do not downgrade Vite.

- [ ] **Step 3: Smoke-run the dev server (go/no-go)**

Run (background, then probe): start `npm run storybook -- --ci --port 6007` in the background; poll `http://127.0.0.1:6007/` for HTTP 200 (up to ~60s); capture the startup log.
Expected: Storybook starts and serves 200 with the generated example stories. Stop the server.
If it fails to boot on Vite 8: attempt the `overrides` pin (Step 2) if not already; if still failing, **STOP and report BLOCKED**.

- [ ] **Step 4: Smoke-build (headless)**

Run: `npm run build-storybook -- -o storybook-static`
Expected: exit 0; `storybook-static/index.html` exists.

- [ ] **Step 5: Confirm existing gates unaffected**

Run: `npm test 2>&1 | tail -3` (all pass), `npm run typecheck` (exit 0), `npm run build` (exit 0).
Expected: all green — the Storybook deps must not break the unit tests, typecheck, or docs build. If the unit-test Vitest now tries to run generated example stories, note it (Task 2 removes them and confirms the test glob excludes `.stories.*`).

- [ ] **Step 6: Commit (only if GO)**

```bash
printf "storybook-static/\n" >> .gitignore
git add .gitignore .storybook package.json package-lock.json
git commit -m "storybook: spike — install @storybook/vue3-vite on Vite 8 (go)"
```
(If NO-GO: leave the tree clean / `git checkout .` and report BLOCKED — do not commit.)

---

### Task 2: Customize config — docgen, CSS, theme/density toolbar, a11y + sample story

**Files:**
- Modify: `.storybook/main.ts` (docgen + stories glob + addon-a11y)
- Modify: `.storybook/preview.ts` (CSS import, theme/density toolbar + decorator, a11y params)
- Create: `vue/components/DsButton.stories.ts` (sample, autodocs)
- Delete: the init-generated example stories (e.g. `src/stories/*`)

**Interfaces:**
- Produces: the project Storybook config (consumed by Phases 2–4) — `vue-component-meta` docgen on; stories globbed from `vue/**/*.stories.ts`; `theme`/`density` toolbar globals; design-language CSS loaded; a11y report-only.

> NOTE: file extensions (`.ts` vs `.js`) and exact option names follow whatever `storybook init` generated for the resolved version. Adjust the snippets below to the generated baseline's API if it differs; keep the intent.

- [ ] **Step 1: Point stories at the component layer + enable docgen + a11y**

In `.storybook/main.ts`, set the stories glob to the component layer and enable the metadata docgen + a11y addon:
```ts
import type { StorybookConfig } from "@storybook/vue3-vite";

const config: StorybookConfig = {
  stories: ["../vue/**/*.stories.@(ts|js)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-interactions"],
  framework: {
    name: "@storybook/vue3-vite",
    options: { docgen: "vue-component-meta" }
  }
};
export default config;
```
(Install any of the listed addons that init did not add: `npm i -D @storybook/addon-a11y @storybook/addon-interactions`. If an addon is already core in the resolved version, omit it.)

- [ ] **Step 2: Preview — CSS, theme/density toolbar, a11y report-only**

Replace `.storybook/preview.ts` with:
```ts
import type { Preview } from "@storybook/vue3-vite";
import "../src/design-language.css";

const preview: Preview = {
  parameters: {
    a11y: { test: "todo" }, // report-only: surface violations without failing (known deferred backlog)
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } }
  },
  globalTypes: {
    theme: {
      description: "Theme",
      defaultValue: "dark",
      toolbar: { icon: "circlehollow", items: ["dark", "light"], dynamicTitle: true }
    },
    density: {
      description: "Density",
      defaultValue: "comfortable",
      toolbar: { icon: "component", items: ["comfortable", "compact"], dynamicTitle: true }
    }
  },
  decorators: [
    (story, ctx) => ({
      components: { story },
      setup() {
        return { theme: ctx.globals.theme, density: ctx.globals.density };
      },
      template:
        `<div :data-theme="theme" :data-density="density" style="padding:24px; background:var(--bg); color:var(--text)"><story /></div>`
    })
  ]
};
export default preview;
```

- [ ] **Step 3: Replace the example stories with a real sample**

Delete the init-generated examples: `rm -rf src/stories` (or wherever init put them).
Create `vue/components/DsButton.stories.ts`:
```ts
import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsButton from "./DsButton.vue";

const meta: Meta<typeof DsButton> = {
  title: "Foundation/DsButton",
  component: DsButton,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: [undefined, "primary", "ghost", "danger"] },
    size: { control: "select", options: [undefined, "sm", "lg"] }
  },
  render: (args) => ({
    components: { DsButton },
    setup: () => ({ args }),
    template: `<DsButton v-bind="args">Button</DsButton>`
  })
};
export default meta;
type Story = StoryObj<typeof DsButton>;

export const Default: Story = {};
export const Primary: Story = { args: { variant: "primary" } };
export const Danger: Story = { args: { variant: "danger" } };
export const Sizes: Story = {
  render: () => ({
    components: { DsButton },
    template: `<div style="display:flex; gap:8px; align-items:center">
      <DsButton size="sm">Small</DsButton><DsButton>Default</DsButton><DsButton size="lg">Large</DsButton>
    </div>`
  })
};
```

- [ ] **Step 4: Verify end-to-end**

Run: `npm run build-storybook -- -o storybook-static` → exit 0.
Manually (or via the dev server) confirm: the DsButton **autodocs page shows props `variant`/`size`/`icon`/`loading`/`disabled`/`type`** (proves `vue-component-meta` docgen works); the **theme/density toolbar** toggles restyle the canvas; the **Accessibility panel** populates.
Run: `npm test 2>&1 | tail -3` (unit tests still pass and do NOT pick up `.stories.ts` — the Vitest include is `vue/**/*.test.ts`), `npm run typecheck` (exit 0), `npm run build` (exit 0).

- [ ] **Step 5: Commit**

```bash
git add .storybook vue/components/DsButton.stories.ts
git rm -r --cached --ignore-unmatch src/stories 2>/dev/null || true
git commit -m "storybook: configure vue-component-meta docgen, design-language CSS, theme/density toolbar, a11y; sample DsButton story"
```

---

## Self-Review

- **Spec coverage (Phase 1):** spike/go-no-go on Vite 8 (Task 1), `vue-component-meta` docgen + CSS + theme/density toolbar + a11y report-only + sample story + scripts + gitignore + existing-gates-green (Task 2). Matches spec Phase 1.
- **Placeholder scan:** none — concrete commands + config. The one explicit flex point (init-generated file extensions/option names per resolved version) is called out as an adjust-to-baseline instruction, not a TBD.
- **Type/consistency:** stories glob `vue/**/*.stories.@(ts|js)` is disjoint from the unit-test glob `vue/**/*.test.ts`, so stories aren't run as unit tests (verified in Task 2 Step 4). `docgen: "vue-component-meta"` is the documented option. a11y `test:"todo"` = report-only per spec.
- **Phases 2–4** (stories for all 53 components; `play` interaction tests on the interactive set; build+test-runner gate) are generated just-in-time after this phase merges, against the resolved Storybook version's API.
