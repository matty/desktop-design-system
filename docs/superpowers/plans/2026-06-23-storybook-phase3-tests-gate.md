# Storybook — Phase 3: Interaction Tests + a11y-in-Runner + Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Storybook test-runner (real-browser, headless) so every story is smoke-rendered and the interactive components get `play` interaction tests; wire axe a11y into the runner **report-only**; finalize with the full gate.

**Architecture:** `@storybook/test-runner` (Playwright) runs the built/served Storybook headlessly. `play` functions (from `storybook/test`) drive the ~8 cleanly-interactive components. A `.storybook/test-runner.ts` `postVisit` hook runs axe and logs violations without failing (report-only). T1 has a go/no-go flavor — if Playwright/test-runner can't run in this Windows env, report BLOCKED (the play functions still exist and run in the Storybook UI).

**Tech Stack:** Storybook 10.4.6, `@storybook/test-runner`, Playwright (Chromium), `storybook/test` (userEvent/expect/within), `axe-playwright`.

## Global Constraints

- Storybook is dev/test only — NOT in the offline bundle. Do not modify components, `css/`, `pages/`, `js/ds.js`, `tools/bundle.mjs`, or `vite.config.mjs`.
- Existing gates stay green: `npm test` (147), `npm run typecheck`, `npm run build`, `npm run build-storybook`.
- a11y posture = **report-only**: axe runs in the runner and logs violations but does NOT fail the run (the deferred a11y backlog would otherwise red-wall it). Documented to flip to failing when the full-a11y workstream lands.
- `play` functions import from `storybook/test` (Storybook 10) — confirm the exact path during T1; do not invent.
- New deps are devDependencies; Playwright browser is a local install. ESM, two-space indentation. One commit per task.

---

### Task 1: test-runner + Playwright install + smoke (GO/NO-GO)

**Files:**
- Modify: `package.json` (devDeps + `test-storybook` script), `package-lock.json`
- Create (maybe): `.storybook/test-runner.ts` (placeholder config if needed)

**Interfaces:** Produces `npm run test-storybook` that smoke-renders every story in a real browser headlessly, or a BLOCKED report.

- [ ] **Step 1: Install the runner + Playwright**

Run: `npm i -D @storybook/test-runner` then `npx playwright install chromium`.
Expected: installs without a Vite/Storybook peer conflict; Chromium downloads. If install hits a peer conflict with Storybook 10, attempt the matching test-runner version (`@storybook/test-runner@latest`) and document. If Playwright's browser can't be installed/run in this environment, STOP and report BLOCKED with the error.

- [ ] **Step 2: Add the `test-storybook` script**

In `package.json` scripts, add:
```json
"test-storybook": "test-storybook"
```
(The runner targets `http://127.0.0.1:6006` by default; the smoke run below serves the static build and passes `--url`.)

- [ ] **Step 3: Smoke-run the runner against the built Storybook (go/no-go)**

Run:
```bash
npm run build-storybook -- -o storybook-static
# serve the static build in the background, then run the runner against it:
npx http-server storybook-static -p 6099 --silent &   # or: npx serve
npx wait-on tcp:6099
npx test-storybook --url http://127.0.0.1:6099
# stop the static server afterwards
```
Expected: the runner visits every story, renders each in headless Chromium, and reports all passing (smoke = no render errors). If `http-server`/`wait-on` aren't available, use `npx serve storybook-static -l 6099` + a curl poll. Capture the runner's summary.
If the runner cannot launch a browser / connect in this Windows env after a genuine attempt: STOP, report BLOCKED with the exact error (the play functions added in T2 still work in the Storybook UI even without the headless runner).

- [ ] **Step 4: Confirm existing gates unaffected**

Run: `npm test 2>&1 | tail -3` (147 pass), `npm run typecheck` (0), `npm run build` (0).

- [ ] **Step 5: Commit (only if GO)**

```bash
git add package.json package-lock.json .storybook/test-runner.ts 2>/dev/null || git add package.json package-lock.json
git commit -m "storybook: add test-runner + Playwright; smoke all stories (go)"
```
(If NO-GO: revert, report BLOCKED.)

---

### Task 2: `play` interaction tests on the interactive components

**Files:** Modify the interactive stories under `vue/components/`: `DsCombobox.stories.ts`, `DsDropdownMenu.stories.ts`, `DsDialog.stories.ts`, `DsTabs.stories.ts`, `DsAccordion.stories.ts`, `DsTree.stories.ts`, `DsContextMenu.stories.ts`, `DsToastHost.stories.ts`. (DsSplitter/DsSortable are drag-driven — give DsSplitter a keyboard-resize play if straightforward; skip DsSortable's drag and note why.)

**Interfaces:** Consumes `storybook/test` (`userEvent`, `expect`, `within`/`screen`). Each `play` drives the rendered story and asserts real behavior; the runner executes them headlessly.

> Import path: use the Storybook 10 path confirmed in T1 (`storybook/test`). Use `within(canvasElement)` for in-canvas queries; for teleported content (dialog, context menu, dropdown menu, toast) query `document`/`screen` / `within(document.body)` since they portal outside the canvas.

- [ ] **Step 1: Add a `play` to each interactive story** (one focused interaction each). Examples (adapt to the real DOM/roles):

`DsCombobox.stories.ts` — on `Single`:
```ts
import { expect, userEvent, within } from "storybook/test";
// ...
export const Single: Story = {
  render: /* existing */,
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole("button"));          // open
    const option = await c.findByText("Banana");           // an option label from the story's options
    await userEvent.click(option);
    await expect(c.getByRole("button")).toHaveTextContent("Banana");
  }
};
```
`DsDialog.stories.ts` — open via the trigger, assert the dialog appears (teleported), then Escape closes:
```ts
play: async ({ canvasElement }) => {
  const c = within(canvasElement);
  await userEvent.click(c.getByRole("button", { name: /open/i }));
  const body = within(document.body);
  await expect(body.getByRole("dialog")).toBeInTheDocument();
  await userEvent.keyboard("{Escape}");
  await expect(body.queryByRole("dialog")).toBeNull();
}
```
`DsTabs.stories.ts` — click the second tab, assert its panel shows.
`DsAccordion.stories.ts` — click a summary, assert the body appears (`details[open]`).
`DsDropdownMenu.stories.ts` — click trigger, assert menu items appear, click one.
`DsTree.stories.ts` — click a twisty/row, assert children appear.
`DsContextMenu.stories.ts` — `userEvent.pointer({ keys: '[MouseRight]', target })` on the target, assert the teleported `.ds-context-menu` appears.
`DsToastHost.stories.ts` — click the trigger, assert a `.ds-toast` appears with the message.
`DsSplitter.stories.ts` (optional) — focus the separator, press ArrowRight, assert `update:size` reflected (or skip with a note).

- [ ] **Step 2: Run the runner**

Run the same served-static + `test-storybook --url` flow from T1 Step 3.
Expected: all stories pass, including the new `play` assertions. Iterate on selectors/roles until green (use `within(document.body)` for portaled UI). If a specific interaction can't be driven headlessly (e.g. native drag), remove that one `play` and note it in the report rather than leaving it failing.

- [ ] **Step 3: Confirm `build-storybook` + existing gates still green** (`npm run build-storybook`, `npm test`, `npm run typecheck`, `npm run build`).

- [ ] **Step 4: Commit**

```bash
git add vue/components/DsCombobox.stories.ts vue/components/DsDropdownMenu.stories.ts vue/components/DsDialog.stories.ts vue/components/DsTabs.stories.ts vue/components/DsAccordion.stories.ts vue/components/DsTree.stories.ts vue/components/DsContextMenu.stories.ts vue/components/DsToastHost.stories.ts vue/components/DsSplitter.stories.ts 2>/dev/null; git add vue/components/*.stories.ts
git commit -m "storybook: play interaction tests on interactive components"
```

---

### Task 3: axe a11y in the runner (report-only) + final gate + docs

**Files:**
- Create/Modify: `.storybook/test-runner.ts` (postVisit axe hook, report-only)
- Modify: `package.json` (add `axe-playwright` devDep if the hook uses it)
- Modify: `README.md` (a short "Storybook" section: `npm run storybook`, `build-storybook`, `test-storybook`; a11y report-only)

**Interfaces:** the runner logs axe violations per story without failing.

- [ ] **Step 1: Add the report-only a11y hook**

Install: `npm i -D axe-playwright`. Create `.storybook/test-runner.ts`:
```ts
import type { TestRunnerConfig } from "@storybook/test-runner";
import { injectAxe, getViolations, configureAxe } from "axe-playwright";

const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await configureAxe(page, { rules: [] });
    const violations = await getViolations(page.locator("body"));
    if (violations.length) {
      // REPORT-ONLY: log, do not fail (deferred a11y backlog). Flip to assertion when the full-a11y workstream lands.
      console.log(`[a11y] ${violations.length} violation(s):`, violations.map((v) => v.id).join(", "));
    }
  }
};
export default config;
```
(Confirm the `@storybook/test-runner` hook API names against the installed version; adjust if needed.)

- [ ] **Step 2: Full Phase gate**

Run, capturing output:
- `npm run build-storybook -- -o storybook-static` → exit 0.
- Serve static + `npx test-storybook --url http://127.0.0.1:6099` → all stories pass (smoke + play); axe violations printed but the run does NOT fail.
- `npm test 2>&1 | tail -3` → 147 pass.
- `npm run typecheck` → exit 0.
- `npm run build` → exit 0.

- [ ] **Step 3: Document in README**

Add a short "## Storybook" section to `README.md`: `npm run storybook` (dev workbench), `npm run build-storybook` (static), `npm run test-storybook` (interaction + smoke tests, needs Storybook served), and a note that axe a11y is report-only pending the a11y workstream.

- [ ] **Step 4: Commit**

```bash
git add .storybook/test-runner.ts package.json package-lock.json README.md
git commit -m "storybook: report-only axe a11y in test-runner; document Storybook scripts"
```

---

## Self-Review

- **Spec coverage (Phase 3 + 4):** test-runner real-browser smoke (T1), `play` interaction tests on the interactive set (T2), axe report-only in the runner + final gate + README (T3). Matches the spec's Phase 3 (interaction tests) + Phase 4 (gate) + a11y report-only.
- **Placeholder scan:** none — concrete commands + example `play` code (adapt selectors to real roles) + the test-runner config. The import path (`storybook/test`) and hook API are flagged as "confirm against installed version," not TBD.
- **Consistency:** play imports from `storybook/test`; teleported UI (dialog/menu/toast) queried via `document`/`within(document.body)`; a11y `console.log` report-only matches the spec posture; runner targets the served static build.
- **Go/no-go:** T1 carries the Playwright/runner feasibility gate; if it can't run headlessly here, BLOCKED is reported and the play functions still work in the SB UI.
