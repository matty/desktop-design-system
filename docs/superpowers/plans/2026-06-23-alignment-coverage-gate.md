# Alignment Coverage Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a warn-first build-time gate (`tools/coverage.mjs`) that detects cross-layer drift between Vue components, Storybook stories, static-docs examples, and the CSS primitives.

**Architecture:** A pure core module (`tools/coverage-core.mjs`) exposes four independent assertion functions that take plain data (manifest slices, filename lists, page sources) and return violation arrays. A thin CLI (`tools/coverage.mjs`) loads `reference/manifest.json`, globs the story files and docs pages, runs the assertions, prints a grouped report, and controls its exit code via `--strict`. This mirrors the existing `tools/lint-usage.mjs` (core `lint()` + guarded `main()`) and `tools/build-reference.mjs` (`--check`/`--strict`) conventions exactly.

**Tech Stack:** Node ESM (`.mjs`), `node:fs/promises` (`readFile`, `glob`), Vitest (co-located `*.test.mjs`). No new dependencies.

## Global Constraints

- Module format: ESM `.mjs`, matching `tools/*.mjs`. Use `node:` import specifiers.
- Pure core / thin CLI split: testable functions exported from `coverage-core.mjs`; CLI side-effects (`process.exit`, `console`) only in `coverage.mjs`, guarded by `selfPath === argPath` so importing it never runs the CLI.
- Manifest is the hub — read `reference/manifest.json`; never build a parallel catalog. Try repo path then the bundle fallback path, like `lint-usage.mjs`.
- Warn-first: coverage violations print and exit 0 by default; only `--strict` makes violations exit 1. IO/parse failures always exit non-zero regardless of `--strict`.
- Violation shape is uniform: `{ rule, entity, detail }` (all strings).
- Test style matches `tools/lint-usage.test.mjs`: `import { describe, it, expect } from "vitest"`, synthetic inline fixtures, `expect(...).toEqual(...)` / `.toContainEqual(...)`.

---

### Task 1: Story coverage assertion (`storyCoverage`)

Every Vue component must have a Storybook story — either a same-named `<Name>.stories.ts`, or (for sub-components documented inside a parent's story) an alias entry pointing to an existing parent story.

**Files:**
- Create: `tools/coverage-core.mjs`
- Test: `tools/coverage.test.mjs`

**Interfaces:**
- Produces: `STORY_ALIASES: Record<string,string>`; `storyCoverage({ components, storyNames, aliases? }): Array<{rule,entity,detail}>`. `components` is `manifest.components` (array of `{name,...}`). `storyNames` is an array of component base names that have a story file (filename minus `.stories.ts`). `aliases` defaults to `STORY_ALIASES`.

- [ ] **Step 1: Write the failing test**

Create `tools/coverage.test.mjs`:

```js
import { describe, it, expect } from "vitest";
import { storyCoverage, STORY_ALIASES } from "./coverage-core.mjs";

describe("storyCoverage", () => {
  it("passes when a component has a same-named story", () => {
    const v = storyCoverage({
      components: [{ name: "DsButton" }],
      storyNames: ["DsButton"]
    });
    expect(v).toEqual([]);
  });

  it("flags a component with no story and no alias", () => {
    const v = storyCoverage({
      components: [{ name: "DsButton" }],
      storyNames: []
    });
    expect(v).toEqual([
      { rule: "story", entity: "DsButton", detail: "no vue/components/DsButton.stories.ts" }
    ]);
  });

  it("passes a sub-component when its alias parent story exists", () => {
    const v = storyCoverage({
      components: [{ name: "DsTabPanel" }],
      storyNames: ["DsTabs"],
      aliases: { DsTabPanel: "DsTabs" }
    });
    expect(v).toEqual([]);
  });

  it("flags a sub-component whose alias parent story is missing", () => {
    const v = storyCoverage({
      components: [{ name: "DsTabPanel" }],
      storyNames: [],
      aliases: { DsTabPanel: "DsTabs" }
    });
    expect(v).toEqual([
      { rule: "story", entity: "DsTabPanel", detail: "expected alias story DsTabs.stories.ts not found" }
    ]);
  });

  it("aliases the four known sub-components by default", () => {
    expect(STORY_ALIASES).toEqual({
      DsAccordionItem: "DsAccordion",
      DsFact: "DsFacts",
      DsListItem: "DsList",
      DsTabPanel: "DsTabs"
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: FAIL — `Failed to resolve import "./coverage-core.mjs"` (file does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `tools/coverage-core.mjs`:

```js
// Pure cross-layer coverage assertions. No IO, no process side-effects.
// Each function returns an array of { rule, entity, detail } violations.

// Sub-components that are intentionally documented inside a parent component's
// story file rather than getting their own <Name>.stories.ts.
export const STORY_ALIASES = {
  DsAccordionItem: "DsAccordion",
  DsFact: "DsFacts",
  DsListItem: "DsList",
  DsTabPanel: "DsTabs"
};

export function storyCoverage({ components, storyNames, aliases = STORY_ALIASES }) {
  const have = new Set(storyNames);
  const violations = [];
  for (const c of components) {
    if (have.has(c.name)) continue;
    const alias = aliases[c.name];
    if (alias) {
      if (!have.has(alias)) {
        violations.push({
          rule: "story",
          entity: c.name,
          detail: `expected alias story ${alias}.stories.ts not found`
        });
      }
      continue;
    }
    violations.push({
      rule: "story",
      entity: c.name,
      detail: `no vue/components/${c.name}.stories.ts`
    });
  }
  return violations;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/coverage-core.mjs tools/coverage.test.mjs
git commit -m "feat(coverage): story-coverage assertion with sub-component alias map"
```

---

### Task 2: Example coverage assertion (`exampleCoverage`)

Every CSS primitive must have at least one docs example (auto-extracted into `manifest.primitives[].examples`).

**Files:**
- Modify: `tools/coverage-core.mjs`
- Test: `tools/coverage.test.mjs`

**Interfaces:**
- Produces: `exampleCoverage({ primitives }): Array<{rule,entity,detail}>`. `primitives` is `manifest.primitives` (array of `{name, examples?}`).

- [ ] **Step 1: Write the failing test**

Append to `tools/coverage.test.mjs`:

```js
import { exampleCoverage } from "./coverage-core.mjs";

describe("exampleCoverage", () => {
  it("passes a primitive that has examples", () => {
    const v = exampleCoverage({ primitives: [{ name: "ds-btn", examples: ["<button class=\"ds-btn\">x</button>"] }] });
    expect(v).toEqual([]);
  });

  it("flags a primitive with an empty examples array", () => {
    const v = exampleCoverage({ primitives: [{ name: "ds-meter", examples: [] }] });
    expect(v).toEqual([
      { rule: "example", entity: "ds-meter", detail: "no docs example in pages/*.html" }
    ]);
  });

  it("flags a primitive with no examples key at all", () => {
    const v = exampleCoverage({ primitives: [{ name: "ds-spinner" }] });
    expect(v).toEqual([
      { rule: "example", entity: "ds-spinner", detail: "no docs example in pages/*.html" }
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: FAIL — `exampleCoverage is not a function` / import has no such export.

- [ ] **Step 3: Write minimal implementation**

Append to `tools/coverage-core.mjs`:

```js
export function exampleCoverage({ primitives }) {
  return primitives
    .filter((p) => !p.examples || p.examples.length === 0)
    .map((p) => ({
      rule: "example",
      entity: p.name,
      detail: "no docs example in pages/*.html"
    }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: PASS (all Task 1 + Task 2 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/coverage-core.mjs tools/coverage.test.mjs
git commit -m "feat(coverage): primitive docs-example assertion"
```

---

### Task 3: Renders coverage assertion (`rendersCoverage`)

Every `.ds-*` class a component declares it `renders` must be a real primitive or sub-part. Mirrors the known-class set logic in `lint-usage.mjs` (primitives + their `subParts`).

**Files:**
- Modify: `tools/coverage-core.mjs`
- Test: `tools/coverage.test.mjs`

**Interfaces:**
- Produces: `knownPrimitiveClasses(primitives): Set<string>`; `rendersCoverage({ components, primitives }): Array<{rule,entity,detail}>`. `components` entries have an optional `renders: string[]`; `primitives` entries have `name` and optional `subParts: string[]`.

- [ ] **Step 1: Write the failing test**

Append to `tools/coverage.test.mjs`:

```js
import { rendersCoverage } from "./coverage-core.mjs";

describe("rendersCoverage", () => {
  const primitives = [{ name: "ds-combo", subParts: ["ds-combo-btn"] }, { name: "ds-chip" }];

  it("passes when every rendered class is a known primitive or subPart", () => {
    const v = rendersCoverage({
      components: [{ name: "DsCombobox", renders: ["ds-combo", "ds-combo-btn", "ds-chip"] }],
      primitives
    });
    expect(v).toEqual([]);
  });

  it("flags a rendered class that is not a known primitive", () => {
    const v = rendersCoverage({
      components: [{ name: "DsRadioGroup", renders: ["ds-radio-group"] }],
      primitives
    });
    expect(v).toEqual([
      { rule: "renders", entity: "DsRadioGroup → ds-radio-group", detail: "rendered class 'ds-radio-group' is not a known primitive/subPart" }
    ]);
  });

  it("ignores components with no renders list", () => {
    const v = rendersCoverage({ components: [{ name: "DsBare" }], primitives });
    expect(v).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: FAIL — `rendersCoverage is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `tools/coverage-core.mjs`:

```js
export function knownPrimitiveClasses(primitives) {
  const s = new Set();
  for (const p of primitives) {
    s.add(p.name);
    for (const sp of p.subParts || []) s.add(sp);
  }
  return s;
}

export function rendersCoverage({ components, primitives }) {
  const known = knownPrimitiveClasses(primitives);
  const violations = [];
  for (const c of components) {
    for (const cls of c.renders || []) {
      if (!known.has(cls)) {
        violations.push({
          rule: "renders",
          entity: `${c.name} → ${cls}`,
          detail: `rendered class '${cls}' is not a known primitive/subPart`
        });
      }
    }
  }
  return violations;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/coverage-core.mjs tools/coverage.test.mjs
git commit -m "feat(coverage): renders-to-primitive validity assertion"
```

---

### Task 4: Docs-Vue coverage assertion (`docsCoverage`, skip-aware)

Every Vue component should appear in the static docs via a `<template data-vue>` snippet. Until the dual-mode docs plugin lands (separate spec), no page has any `data-vue` block — so when none exist anywhere, this assertion reports **skipped** rather than flagging all 52 components.

**Files:**
- Modify: `tools/coverage-core.mjs`
- Test: `tools/coverage.test.mjs`

**Interfaces:**
- Produces: `docsCoverage({ components, pageSources }): { skipped: boolean, reason?: string, violations: Array<{rule,entity,detail}> }`. `pageSources` is an array of raw HTML strings (one per docs page).

- [ ] **Step 1: Write the failing test**

Append to `tools/coverage.test.mjs`:

```js
import { docsCoverage } from "./coverage-core.mjs";

describe("docsCoverage", () => {
  const components = [{ name: "DsCombobox" }, { name: "DsTree" }];

  it("skips when no page contains a data-vue snippet", () => {
    const r = docsCoverage({ components, pageSources: ["<div class=\"ds-btn\">x</div>"] });
    expect(r.skipped).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it("passes a component referenced in a data-vue template", () => {
    const page = `<template data-vue>\n<DsCombobox v-model="x" />\n<DsTree :nodes="n" />\n</template>`;
    const r = docsCoverage({ components, pageSources: [page] });
    expect(r.skipped).toBe(false);
    expect(r.violations).toEqual([]);
  });

  it("flags a component absent from all data-vue snippets", () => {
    const page = `<template data-vue>\n<DsCombobox v-model="x" />\n</template>`;
    const r = docsCoverage({ components, pageSources: [page] });
    expect(r.skipped).toBe(false);
    expect(r.violations).toEqual([
      { rule: "docs", entity: "DsTree", detail: "no data-vue snippet in any page references this component" }
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: FAIL — `docsCoverage is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `tools/coverage-core.mjs`:

```js
export function docsCoverage({ components, pageSources }) {
  const joined = pageSources.join("\n");
  if (!/data-vue/.test(joined)) {
    return {
      skipped: true,
      reason: "no data-vue snippets present (dual-mode docs not yet implemented)",
      violations: []
    };
  }
  const used = new Set();
  for (const block of joined.matchAll(/<template\s+data-vue[^>]*>([\s\S]*?)<\/template>/g)) {
    for (const tag of block[1].matchAll(/<(Ds[A-Za-z0-9]+)/g)) used.add(tag[1]);
  }
  const violations = components
    .filter((c) => !used.has(c.name))
    .map((c) => ({
      rule: "docs",
      entity: c.name,
      detail: "no data-vue snippet in any page references this component"
    }));
  return { skipped: false, violations };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/coverage-core.mjs tools/coverage.test.mjs
git commit -m "feat(coverage): skip-aware docs data-vue coverage assertion"
```

---

### Task 5: CLI + report + build wiring (`tools/coverage.mjs`)

Thin CLI that loads the manifest, gathers inputs, runs all four assertions, prints a grouped report, and exits per `--strict`. Wire a warn-mode `coverage:check` into `npm run build`.

**Files:**
- Create: `tools/coverage.mjs`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: `storyCoverage`, `exampleCoverage`, `rendersCoverage`, `docsCoverage` from `./coverage-core.mjs`.
- Produces: CLI only. `node tools/coverage.mjs` (warn) exits 0 even with violations; `node tools/coverage.mjs --strict` exits 1 if any non-skipped violations exist. Exits 2 on IO/parse failure.

- [ ] **Step 1: Write the CLI**

Create `tools/coverage.mjs`:

```js
import { readFile, glob } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  storyCoverage,
  exampleCoverage,
  rendersCoverage,
  docsCoverage
} from "./coverage-core.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

async function loadManifest() {
  const candidates = [
    resolve(root, "reference/manifest.json"),
    resolve(dirname(fileURLToPath(import.meta.url)), "reference-manifest.json")
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(await readFile(p, "utf8"));
    } catch {
      // try next
    }
  }
  console.error("coverage: could not find reference/manifest.json — run npm run reference:build first.");
  process.exit(2);
}

async function gatherStoryNames() {
  const names = [];
  for await (const entry of glob("vue/components/*.stories.ts", { cwd: root })) {
    names.push(basename(entry).replace(/\.stories\.ts$/, ""));
  }
  return names;
}

async function gatherPageSources() {
  const sources = [];
  for await (const entry of glob("pages/*.html", { cwd: root })) {
    sources.push(await readFile(resolve(root, entry), "utf8"));
  }
  sources.push(await readFile(resolve(root, "index.html"), "utf8"));
  return sources;
}

function report(title, violations) {
  if (!violations.length) {
    console.log(`  ${title}: ok`);
    return;
  }
  console.warn(`  ${title}: ${violations.length} issue(s)`);
  for (const v of violations) console.warn(`    - ${v.entity}: ${v.detail}`);
}

async function main() {
  const manifest = await loadManifest();
  const components = manifest.components || [];
  const primitives = manifest.primitives || [];

  const storyNames = await gatherStoryNames();
  const pageSources = await gatherPageSources();

  const story = storyCoverage({ components, storyNames });
  const example = exampleCoverage({ primitives });
  const renders = rendersCoverage({ components, primitives });
  const docs = docsCoverage({ components, pageSources });

  console.log("coverage:check —");
  report("story (component → .stories.ts)", story);
  report("example (primitive → docs example)", example);
  report("renders (component → primitive)", renders);
  if (docs.skipped) {
    console.log(`  docs (component → data-vue): skipped — ${docs.reason}`);
  } else {
    report("docs (component → data-vue)", docs.violations);
  }

  const all = [...story, ...example, ...renders, ...docs.violations];
  const total = all.length;
  if (!total) {
    console.log("coverage:check passed — all layers aligned.");
    return;
  }
  if (strict) {
    console.error(`\ncoverage:check --strict: failing on ${total} alignment issue(s).`);
    process.exit(1);
  }
  console.warn(`\ncoverage:check — ${total} alignment issue(s) (warn-only; pass --strict to fail the build).`);
}

const selfPath = fileURLToPath(import.meta.url);
const argPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (selfPath === argPath) {
  main();
}
```

- [ ] **Step 2: Run the CLI in warn mode and confirm the known backlog**

Run: `node tools/coverage.mjs`
Expected: exit 0. Output shows `story: ok` (4 sub-components resolved by alias), `example: 29 issue(s)`, `renders: 1 issue(s)` listing `DsRadioGroup → ds-radio-group`, and `docs ... skipped`. Trailing line: `coverage:check — 30 alignment issue(s) (warn-only ...)`.

- [ ] **Step 3: Confirm strict mode fails**

Run: `node tools/coverage.mjs --strict`
Expected: exit 1 (`echo $?` → 1 in bash, `$LASTEXITCODE` → 1 in PowerShell), final line `coverage:check --strict: failing on 30 alignment issue(s).`

- [ ] **Step 4: Wire warn-mode into build**

In `package.json`, add the `coverage:check` script and insert it into `build` after `reference:lint`:

```json
    "reference:lint": "node tools/lint-usage.mjs \"index.html\" \"pages/*.html\"",
    "coverage:check": "node tools/coverage.mjs",
    "build": "npm run icons:check && npm run reference:check && npm run reference:lint && npm run coverage:check && vite build && npm run bundle",
```

(Leave `coverage:check` in warn mode — no `--strict` — so the build stays green while the 29-example / 1-render backlog is open. A later commit appends `--strict` once the backlog is closed, per the spec's sequencing.)

- [ ] **Step 5: Verify the full build stays green**

Run: `npm run build`
Expected: build completes (exit 0); the `coverage:check —` report appears with the warn summary; `vite build` and `npm run bundle` still succeed.

- [ ] **Step 6: Run the unit suite**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: PASS (all four assertion suites).

- [ ] **Step 7: Commit**

```bash
git add tools/coverage.mjs package.json
git commit -m "feat(coverage): coverage:check CLI + warn-mode build wiring"
```

---

## Notes for the implementer

- **Why warn-only now:** the gate intentionally ships green. It surfaces the real backlog (29 primitives without examples, `ds-radio-group` rendered but not a known primitive) without blocking. Closing that backlog and flipping `coverage:check` to `--strict` are explicit follow-on steps in the spec's sequencing — **not** part of this plan.
- **`ds-radio-group` finding is real, leave it:** do not "fix" it by editing the manifest or CSS in this plan. It is exactly the kind of drift the gate exists to surface; record it and move on.
- **Assertion 4 stays skipped** until the dual-mode docs plugin (`docs/superpowers/specs/2026-06-21-dual-mode-docs-design.md`) introduces `data-vue` snippets. No work here depends on that plugin; the skip path is tested.
- **Do not restructure** `build-reference.mjs` or `lint-usage.mjs`. The coverage gate is additive and reuses their conventions, not their internals.
