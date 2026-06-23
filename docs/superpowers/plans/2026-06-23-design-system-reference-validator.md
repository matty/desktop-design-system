# Design-System Reference + Validator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate an always-accurate, machine-consumable catalog of the entire design-system surface (CSS classes, tokens, states/modes, layout patterns, all Vue components, icons) as `reference/manifest.json` + `REFERENCE.md` + `llms.txt`, plus a `lint-usage` validator that mechanically catches markup/Vue referencing classes/components/props that don't exist.

**Architecture:** A pure, unit-tested core (`tools/reference-core.mjs`) does all extraction and manifest/markdown assembly from in-memory strings. A thin generator (`tools/build-reference.mjs`) does file IO + `--check`. A component-meta collector (`tools/component-meta.mjs`) runs `vue-component-meta` over `vue/index.ts`. A validator (`tools/lint-usage.mjs`) consumes the generated manifest. The low-level CSS class scanner is shared between the existing Vitest helper and the generator via one `tools/css-extract.mjs` module.

**Tech Stack:** Node ESM (`.mjs`, matching `tools/build-icons.mjs`), `vue-component-meta@2.2.12` (already resolvable; pin as explicit devDep), Vitest (existing test runner; tool tests are `tools/**/*.test.mjs`).

## Global Constraints

- This feature **catalogs/validates the existing surface only** — it adds **no** components, classes, or tokens, and changes none of `css/`, `vue/components/*.vue`, `pages/`, `index.html`, `js/`.
- **Warn-first coverage:** missing curated descriptions are reported as **warnings** and stay exit 0; only `--strict` (passed explicitly) turns description gaps into a non-zero exit. The **stale-output diff** in `--check` (generated output differs from committed) **does** hard-fail.
- Component coverage = **every export of `vue/index.ts`** matching `/^Ds[A-Z]/` (derive the list; do not hardcode a count).
- Outputs are **generated, committed, and shipped** in the offline bundle: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`, and `tools/lint-usage.mjs`.
- `reference-core.mjs` is **pure** — functions take strings/objects and return data; no `fs`/`process` inside it (IO lives in `build-reference.mjs`/`component-meta.mjs`). This keeps it unit-testable.
- No runtime dependency added; `vue-component-meta` is build/dev only.
- `reference:build` is **deterministic** — same inputs → byte-identical outputs (sort all collections; `JSON.stringify(..., null, 2)` + trailing `\n`, mirroring `build-icons.mjs`).
- ESM, two-space indentation. Existing gates (`npm test` 147, `npm run typecheck`, `npm run build`) must stay green.

## Manifest shape (canonical — every task conforms to this)

```jsonc
{
  "generated": "design-system reference",      // static string (NOT a timestamp — keeps output deterministic)
  "version": "0.0.0",                           // copied from package.json "version"
  "tokens":     [ { "name": "--bg", "value": "#0c0d0e", "description": "" } ],
  "primitives": [ { "name": "ds-btn", "type": "primitive", "category": "Buttons",
                    "description": "", "subParts": ["ds-btn-group"], "states": ["is-primary","is-ghost"],
                    "examples": ["<button class=\"ds-btn is-primary\">…</button>"] } ],
  "utilities":  [ { "name": "u-flex", "type": "utility", "category": "Display", "description": "", "examples": [] } ],
  "states":     [ { "name": "is-primary", "type": "state", "description": "", "examples": [] } ],
  "modes":      [ { "name": "data-theme", "type": "mode", "values": ["dark","light"], "description": "" } ],
  "patterns":   [ { "name": "p-app", "type": "pattern", "category": "App shell", "description": "", "examples": [] } ],
  "components": [ { "name": "DsButton", "type": "component", "import": "import { DsButton } from 'design-language/vue'",
                    "description": "", "renders": ["ds-btn"],
                    "props":  [ { "name": "variant", "type": "'primary' | 'ghost' | 'danger'", "default": "undefined", "required": false, "description": "" } ],
                    "events": [ { "name": "click", "type": "[event: MouseEvent]", "description": "" } ],
                    "slots":  [ { "name": "default", "description": "" } ] } ],
  "icons": { "count": 42, "source": "icons/registry.json", "approved": "icons/approved.json" }
}
```

Items are sorted by `name` within each array. `description` is `""` when no curated description exists (warn-first).

---

### Task 1: Shared CSS class extractor

**Files:**
- Create: `tools/css-extract.mjs`
- Create: `tools/css-extract.test.mjs`
- Modify: `vue/__support__/css.ts` (consume the shared extractor)
- Modify: `vitest.config.mjs` (add `tools/**/*.test.mjs` to `include`)

**Interfaces:**
- Produces: `extractClassNames(css: string): string[]` — sorted, de-duped class tokens (the part after `.`) found in a CSS string. Consumed by `css.ts` and (Task 2) `reference-core.mjs`.

- [ ] **Step 1: Extend the Vitest include so tool tests run**

In `vitest.config.mjs`, change the `include` line to:
```js
    include: ["vue/**/*.test.ts", "tools/**/*.test.mjs"],
```

- [ ] **Step 2: Write the failing test**

Create `tools/css-extract.test.mjs`:
```js
import { describe, it, expect } from "vitest";
import { extractClassNames } from "./css-extract.mjs";

describe("extractClassNames", () => {
  it("returns sorted, de-duped class tokens", () => {
    const css = ".ds-btn { color: red; }\n.ds-btn.is-primary { color: blue; }\n.u-flex { display:flex; }";
    expect(extractClassNames(css)).toEqual(["ds-btn", "is-primary", "u-flex"]);
  });
  it("ignores property values and hex colors", () => {
    const css = ".ds-card { background:#0c0d0e; border:.5px solid var(--line); }";
    expect(extractClassNames(css)).toEqual(["ds-card"]);
  });
  it("matches compound and descendant selectors", () => {
    const css = ".ds-combo .ds-combo-menu .ds-combo-option { color:red; }";
    expect(extractClassNames(css)).toEqual(["ds-combo", "ds-combo-menu", "ds-combo-option"]);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx vitest run tools/css-extract.test.mjs`
Expected: FAIL — cannot resolve `./css-extract.mjs`.

- [ ] **Step 4: Implement `tools/css-extract.mjs`**

```js
// Low-level CSS class-name scanner. Shared by the Vitest support helper and the
// reference generator so "what classes exist" has ONE implementation.

// Matches a class token: a dot followed by an identifier (letter-led, kebab ok).
// Deliberately ignores hex colors (#abc), property values, and var() names.
const CLASS_RE = /\.([a-z][a-z0-9-]*)/g;

export function extractClassNames(css) {
  const set = new Set();
  for (const m of css.matchAll(CLASS_RE)) set.add(m[1]);
  return [...set].sort();
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npx vitest run tools/css-extract.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 6: Refactor `vue/__support__/css.ts` to use the shared extractor**

Replace the body of `vue/__support__/css.ts` with:
```ts
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error - plain JS module shared with the Node tools (no .d.ts)
import { extractClassNames } from "../../tools/css-extract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(here, "../../css/components.css");

let cache: Set<string> | null = null;

export function cssClasses(): Set<string> {
  if (cache) return cache;
  cache = new Set(extractClassNames(readFileSync(cssPath, "utf8")));
  return cache;
}

export function cssHas(cls: string): boolean {
  return cssClasses().has(cls.replace(/^\./, ""));
}
```

- [ ] **Step 7: Verify the existing suite + typecheck still pass**

Run: `npx vitest run vue/__support__/css.test.ts` → PASS.
Run: `npm test 2>&1 | tail -3` → 147 (or 147 + the 3 new) passing; **no failures**.
Run: `npm run typecheck` → exit 0.

- [ ] **Step 8: Commit**

```bash
git add tools/css-extract.mjs tools/css-extract.test.mjs vue/__support__/css.ts vitest.config.mjs
git commit -m "reference: shared CSS class extractor (css-extract.mjs); reuse in css.ts"
```

---

### Task 2: reference-core — tokens, CSS surface, modes

**Files:**
- Create: `tools/reference-core.mjs`
- Create: `tools/reference-core.test.mjs`

**Interfaces:**
- Consumes: `extractClassNames` from `tools/css-extract.mjs`.
- Produces (all pure):
  - `extractTokens(tokensCss: string): {name,value,description}[]`
  - `extractCssSurface({components, utilities, patterns}: {string,string,string}): {primitives,utilities,states,patterns}` — arrays of items with `name,type,category,subParts?,states?,description,examples`.
  - `extractModes(): {name,type:'mode',values,description}[]` (the two known modes; see code).

- [ ] **Step 1: Write the failing test**

Create `tools/reference-core.test.mjs`:
```js
import { describe, it, expect } from "vitest";
import { extractTokens, extractCssSurface, extractModes } from "./reference-core.mjs";

describe("extractTokens", () => {
  it("parses --name: value with descriptions empty", () => {
    const css = ":root {\n  --bg: #0c0d0e;\n  --accent: rgba(255,255,255,.07);\n}";
    expect(extractTokens(css)).toEqual([
      { name: "--accent", value: "rgba(255,255,255,.07)", description: "" },
      { name: "--bg", value: "#0c0d0e", description: "" }
    ]);
  });
});

describe("extractCssSurface", () => {
  const components = [
    "/* ---------- Buttons ---------- */",
    ".ds-btn { color:red; }",
    ".ds-btn.is-primary { color:blue; }",
    ".ds-btn-group { display:flex; }",
    "/* ---------- Cards ---------- */",
    ".ds-card { padding:1rem; }"
  ].join("\n");
  const utilities = "/* ---------- Display ---------- */\n.u-flex { display:flex; }";
  const patterns = "/* ---------- App shell ---------- */\n.p-app { display:grid; }";
  const surface = extractCssSurface({ components, utilities, patterns });

  it("groups sub-parts under their primitive and collects states", () => {
    const btn = surface.primitives.find((p) => p.name === "ds-btn");
    expect(btn).toMatchObject({ type: "primitive", category: "Buttons", subParts: ["ds-btn-group"], states: ["is-primary"] });
    // sub-part is not a separate top-level primitive
    expect(surface.primitives.some((p) => p.name === "ds-btn-group")).toBe(false);
  });
  it("captures nearest section comment as category", () => {
    expect(surface.primitives.find((p) => p.name === "ds-card").category).toBe("Cards");
  });
  it("lists utilities, states, and patterns separately", () => {
    expect(surface.utilities.map((u) => u.name)).toEqual(["u-flex"]);
    expect(surface.states.map((s) => s.name)).toEqual(["is-primary"]);
    expect(surface.patterns.map((p) => p.name)).toEqual(["p-app"]);
  });
});

describe("extractModes", () => {
  it("returns data-theme and data-density with values", () => {
    expect(extractModes()).toEqual([
      { name: "data-density", type: "mode", values: ["comfortable", "compact"], description: "" },
      { name: "data-theme", type: "mode", values: ["dark", "light"], description: "" }
    ]);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tools/reference-core.test.mjs`
Expected: FAIL — cannot resolve `./reference-core.mjs`.

- [ ] **Step 3: Implement the three extractors in `tools/reference-core.mjs`**

```js
import { extractClassNames } from "./css-extract.mjs";

// --- tokens -------------------------------------------------------------
const TOKEN_RE = /(--[a-z][a-z0-9-]*)\s*:\s*([^;]+);/g;

export function extractTokens(tokensCss) {
  const out = [];
  for (const m of tokensCss.matchAll(TOKEN_RE)) {
    out.push({ name: m[1], value: m[2].trim(), description: "" });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// --- css surface --------------------------------------------------------
const SECTION_RE = /\/\*\s*-+\s*(.+?)\s*-+\s*\*\//; // /* ---------- Name ---------- */

// Walk the CSS line by line, tracking the nearest section comment, and record
// the first category seen for each class token.
function categoryByClass(css) {
  const cat = new Map();
  let section = "";
  for (const line of css.split("\n")) {
    const sec = line.match(SECTION_RE);
    if (sec) { section = sec[1]; continue; }
    for (const cls of extractClassNames(line)) {
      if (!cat.has(cls)) cat.set(cls, section);
    }
  }
  return cat;
}

// ds-combo-menu -> parent ds-combo if that base class also exists.
function parentOf(name, allBases) {
  const parts = name.split("-");
  for (let i = parts.length - 1; i > 1; i--) {
    const cand = parts.slice(0, i).join("-");
    if (allBases.has(cand)) return cand;
  }
  return null;
}

export function extractCssSurface({ components, utilities, patterns }) {
  const compCats = categoryByClass(components);
  const compClasses = extractClassNames(components);

  const states = compClasses.filter((c) => c.startsWith("is-"));
  const dsClasses = compClasses.filter((c) => c.startsWith("ds-"));
  const dsSet = new Set(dsClasses);

  // top-level primitives vs sub-parts
  const subParts = new Map();   // parent -> [child]
  const tops = [];
  for (const c of dsClasses) {
    const parent = parentOf(c, dsSet);
    if (parent) {
      if (!subParts.has(parent)) subParts.set(parent, []);
      subParts.get(parent).push(c);
    } else {
      tops.push(c);
    }
  }

  // states that co-occur on a primitive's selectors -> attach by category match
  const statesByCategory = new Map();
  for (const s of states) {
    const sectionCat = compCats.get(s) || "";
    if (!statesByCategory.has(sectionCat)) statesByCategory.set(sectionCat, []);
    statesByCategory.get(sectionCat).push(s);
  }

  const primitives = tops.map((name) => ({
    name,
    type: "primitive",
    category: compCats.get(name) || "",
    description: "",
    subParts: (subParts.get(name) || []).sort(),
    states: (statesByCategory.get(compCats.get(name) || "") || []).sort(),
    examples: []
  })).sort((a, b) => a.name.localeCompare(b.name));

  const utilCats = categoryByClass(utilities);
  const utilitiesOut = extractClassNames(utilities)
    .filter((c) => c.startsWith("u-"))
    .map((name) => ({ name, type: "utility", category: utilCats.get(name) || "", description: "", examples: [] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const statesOut = states
    .map((name) => ({ name, type: "state", description: "", examples: [] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const patCats = categoryByClass(patterns);
  const patternsOut = extractClassNames(patterns)
    .filter((c) => c.startsWith("p-") || c.startsWith("u-") || c.startsWith("ds-"))
    .filter((c) => c.startsWith("p-")) // only pattern-prefixed recipes are pattern items
    .map((name) => ({ name, type: "pattern", category: patCats.get(name) || "", description: "", examples: [] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { primitives, utilities: utilitiesOut, states: statesOut, patterns: patternsOut };
}

// --- modes --------------------------------------------------------------
export function extractModes() {
  return [
    { name: "data-density", type: "mode", values: ["comfortable", "compact"], description: "" },
    { name: "data-theme", type: "mode", values: ["dark", "light"], description: "" }
  ];
}
```

> NOTE: if the test reveals `css/patterns.css` uses a prefix other than `p-` for its recipe classes, adjust the `patterns` filter to match the real prefix (read `css/patterns.css`); keep the intent: pattern-recipe classes only, not re-listed utilities/primitives.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run tools/reference-core.test.mjs`
Expected: PASS.

- [ ] **Step 5: Smoke against real CSS (sanity, not committed)**

Run:
```bash
node -e "import('./tools/reference-core.mjs').then(async m=>{const fs=await import('node:fs');const s=m.extractCssSurface({components:fs.readFileSync('css/components.css','utf8'),utilities:fs.readFileSync('css/utilities.css','utf8'),patterns:fs.readFileSync('css/patterns.css','utf8')});console.log('primitives',s.primitives.length,'utilities',s.utilities.length,'states',s.states.length,'patterns',s.patterns.length);console.log('sample',JSON.stringify(s.primitives[0]))})"
```
Expected: non-zero counts for primitives/utilities/states; a sample primitive printed with a category. (Patterns may be 0 if `css/patterns.css` uses a different prefix — if so, fix the filter per the NOTE and re-run.)

- [ ] **Step 6: Commit**

```bash
git add tools/reference-core.mjs tools/reference-core.test.mjs
git commit -m "reference: extract tokens, CSS surface (primitives/utilities/states/patterns), modes"
```

---

### Task 3: reference-core — example extraction

**Files:**
- Modify: `tools/reference-core.mjs` (add `extractExamples`)
- Modify: `tools/reference-core.test.mjs` (add tests)

**Interfaces:**
- Produces: `extractExamples(htmlDocs: {name,html}[]): {byClass: Record<string,string[]>, patterns: {title,markup}[]}` — for each `.example-preview` block, the trimmed inner markup (with `<svg>…</svg>` collapsed to `<svg><!-- icon --></svg>`), indexed by every `.ds-*`/`.u-*`/`.is-*`/`p-*` class appearing in it.

- [ ] **Step 1: Write the failing test**

Add to `tools/reference-core.test.mjs`:
```js
import { extractExamples } from "./reference-core.mjs";

describe("extractExamples", () => {
  const html = `
    <section class="doc-section"><h2>Variants</h2>
      <div class="example">
        <div class="example-preview">
          <button class="ds-btn is-primary"><svg viewBox="0 0 24 24"><path d="M5 5"/></svg>Start</button>
          <button class="ds-btn">Secondary</button>
        </div>
      </div>
    </section>`;
  const { byClass } = extractExamples([{ name: "buttons", html }]);

  it("indexes the example markup by class, collapsing svgs", () => {
    expect(byClass["ds-btn"][0]).toContain('<button class="ds-btn is-primary">');
    expect(byClass["ds-btn"][0]).toContain("<svg><!-- icon --></svg>");
    expect(byClass["ds-btn"][0]).not.toContain("viewBox");
    expect(byClass["is-primary"]).toBeDefined();
  });
  it("does not duplicate the same markup for a class", () => {
    expect(byClass["ds-btn"].length).toBe(1); // one preview block
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run tools/reference-core.test.mjs -t extractExamples`
Expected: FAIL — `extractExamples is not a function`.

- [ ] **Step 3: Implement `extractExamples` in `tools/reference-core.mjs`**

```js
// Collapse <svg ...>...</svg> (including self-closing) to a stable placeholder.
function collapseSvgs(markup) {
  return markup
    .replace(/<svg\b[\s\S]*?<\/svg>/g, "<svg><!-- icon --></svg>")
    .replace(/<svg\b[^>]*\/>/g, "<svg><!-- icon --></svg>");
}

const PREVIEW_RE = /<div class="example-preview">([\s\S]*?)<\/div>\s*(?:<div class="example-caption">|<\/div>)/g;

export function extractExamples(htmlDocs) {
  const byClass = {};
  const patterns = [];
  for (const { html } of htmlDocs) {
    for (const m of html.matchAll(PREVIEW_RE)) {
      const markup = collapseSvgs(m[1].trim()).replace(/\s+\n/g, "\n").trim();
      const classes = new Set();
      for (const cm of markup.matchAll(/class="([^"]*)"/g)) {
        for (const c of cm[1].split(/\s+/)) {
          if (/^(ds|u|is|p)-/.test(c)) classes.add(c);
        }
      }
      for (const c of classes) {
        if (!byClass[c]) byClass[c] = [];
        if (!byClass[c].includes(markup)) byClass[c].push(markup);
      }
    }
  }
  return { byClass, patterns };
}
```

> NOTE: the `PREVIEW_RE` terminator assumes each `.example-preview` is followed by either an `.example-caption` div or the closing `.example` div, as in `pages/buttons.html`. If a page nests differently and a block is missed, widen the terminator to `<\/div>` and rely on the non-greedy body; verify against the real pages in Step 5.

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run tools/reference-core.test.mjs -t extractExamples`
Expected: PASS.

- [ ] **Step 5: Smoke against real docs pages (sanity)**

Run:
```bash
node -e "import('./tools/reference-core.mjs').then(async m=>{const fs=await import('node:fs');const docs=['index.html',...fs.readdirSync('pages').filter(f=>f.endsWith('.html')).map(f=>'pages/'+f)].map(p=>({name:p,html:fs.readFileSync(p,'utf8')}));const ex=m.extractExamples(docs);console.log('classes-with-examples',Object.keys(ex.byClass).length);console.log('ds-btn examples',(ex.byClass['ds-btn']||[]).length)})"
```
Expected: a substantial class count (dozens), and `ds-btn` has ≥1 example. If 0, fix `PREVIEW_RE` per the NOTE.

- [ ] **Step 6: Commit**

```bash
git add tools/reference-core.mjs tools/reference-core.test.mjs
git commit -m "reference: extract docs-page examples indexed by class (svgs collapsed)"
```

---

### Task 4: Vue component metadata collection

**Files:**
- Create: `tools/component-meta.mjs`
- Create: `tools/component-meta.test.mjs`
- Modify: `tools/reference-core.mjs` (add `assembleComponents`)
- Modify: `tools/reference-core.test.mjs` (add `assembleComponents` test)
- Modify: `package.json` (add `vue-component-meta` to devDependencies explicitly)

**Interfaces:**
- Produces:
  - `collectComponentMeta(opts: {tsconfigPath, indexPath, componentsDir}): RawMeta[]` (IO/integration) — for each `Ds*` export of `vue/index.ts`, `{ name, file, props:[{name,type,default,required}], events:[{name,type}], slots:[{name}] }`.
  - `assembleComponents(rawMeta: RawMeta[], sfcSource: Record<name,string>): Component[]` (pure) — adds `import` string and `renders` (the `ds-*` classes found in the SFC `<template>`), shapes to the manifest component item, sorts.

- [ ] **Step 1: Add the explicit devDep**

Run: `npm i -D vue-component-meta@2.2.12`
Verify it does NOT change `vitest.config.mjs` (`git diff --stat vitest.config.mjs` empty) and `npm test` still passes.

- [ ] **Step 2: Write the failing test for `assembleComponents` (pure)**

Add to `tools/reference-core.test.mjs`:
```js
import { assembleComponents } from "./reference-core.mjs";

describe("assembleComponents", () => {
  const raw = [{
    name: "DsButton", file: "DsButton.vue",
    props: [{ name: "variant", type: "'primary' | 'ghost'", default: "undefined", required: false }],
    events: [{ name: "click", type: "[e: MouseEvent]" }],
    slots: [{ name: "default" }]
  }];
  const sfc = { DsButton: `<template><button class="ds-btn" :class="cls"><slot/></button></template>` };
  const out = assembleComponents(raw, sfc);

  it("shapes a component item with import + renders + description fields", () => {
    expect(out[0]).toMatchObject({
      name: "DsButton",
      type: "component",
      import: "import { DsButton } from 'design-language/vue'",
      renders: ["ds-btn"],
      description: ""
    });
    expect(out[0].props[0]).toMatchObject({ name: "variant", default: "undefined", required: false, description: "" });
    expect(out[0].events[0]).toMatchObject({ name: "click", description: "" });
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npx vitest run tools/reference-core.test.mjs -t assembleComponents`
Expected: FAIL — `assembleComponents is not a function`.

- [ ] **Step 4: Implement `assembleComponents` in `tools/reference-core.mjs`**

```js
export function assembleComponents(rawMeta, sfcSource) {
  return rawMeta.map((c) => {
    const src = sfcSource[c.name] || "";
    const tpl = (src.match(/<template>([\s\S]*?)<\/template>/) || [, ""])[1];
    const renders = [...new Set(extractClassNames(tpl).filter((x) => x.startsWith("ds-")))].sort();
    return {
      name: c.name,
      type: "component",
      import: `import { ${c.name} } from 'design-language/vue'`,
      description: "",
      renders,
      props: (c.props || []).map((p) => ({ ...p, description: "" })).sort((a, b) => a.name.localeCompare(b.name)),
      events: (c.events || []).map((e) => ({ ...e, description: "" })).sort((a, b) => a.name.localeCompare(b.name)),
      slots: (c.slots || []).map((s) => ({ ...s, description: "" })).sort((a, b) => a.name.localeCompare(b.name))
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npx vitest run tools/reference-core.test.mjs -t assembleComponents`
Expected: PASS.

- [ ] **Step 6: Implement `tools/component-meta.mjs` (vue-component-meta integration)**

```js
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createComponentMetaChecker } from "vue-component-meta";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// Names exported from vue/index.ts that look like components (Ds*).
function componentNames(indexSrc) {
  return [...indexSrc.matchAll(/export \{ default as (Ds[A-Za-z0-9]+) \}/g)].map((m) => m[1]).sort();
}

export function collectComponentMeta({
  tsconfigPath = resolve(root, "tsconfig.json"),
  indexPath = resolve(root, "vue/index.ts"),
  componentsDir = resolve(root, "vue/components")
} = {}) {
  const indexSrc = readFileSync(indexPath, "utf8");
  const names = componentNames(indexSrc);
  const checker = createComponentMetaChecker(tsconfigPath, { forceUseTs: true, printer: { newLine: 1 } });

  return names.map((name) => {
    const file = join(componentsDir, `${name}.vue`);
    const meta = checker.getComponentMeta(file);
    const isPublic = (p) => !p.global && !/^(on[A-Z]|key|ref|class|style)/.test(p.name);
    return {
      name,
      file: `${name}.vue`,
      props: meta.props.filter(isPublic).map((p) => ({
        name: p.name,
        type: p.type,
        default: p.default ?? "undefined",
        required: !!p.required
      })),
      events: meta.events.map((e) => ({ name: e.name, type: e.type })),
      slots: meta.slots.map((s) => ({ name: s.name }))
    };
  });
}

export { componentNames };
```

> NOTE: `vue-component-meta`'s exact field names (`meta.props[].type`, `.default`, `.required`, `meta.events`, `meta.slots`) are from v2.2.x; if a field differs at runtime, inspect one `getComponentMeta` result and adjust the mapping. Keep the output shape (the `RawMeta` interface above) stable so `assembleComponents` is unaffected.

- [ ] **Step 7: Write an integration test for `collectComponentMeta` (real components)**

Create `tools/component-meta.test.mjs`:
```js
import { describe, it, expect } from "vitest";
import { collectComponentMeta, componentNames } from "./component-meta.mjs";
import { readFileSync } from "node:fs";

describe("componentNames", () => {
  it("lists every Ds* export from vue/index.ts", () => {
    const src = readFileSync(new URL("../vue/index.ts", import.meta.url), "utf8");
    const names = componentNames(src);
    expect(names).toContain("DsButton");
    expect(names).toContain("DsCombobox");
    expect(names).toContain("DsToastHost");
    expect(names.length).toBeGreaterThan(40);
  });
});

describe("collectComponentMeta", () => {
  it("extracts props + events for representative components", () => {
    const meta = collectComponentMeta();
    const byName = Object.fromEntries(meta.map((m) => [m.name, m]));
    expect(byName.DsButton).toBeTruthy();
    const combo = byName.DsCombobox;
    expect(combo.props.some((p) => p.name === "modelValue")).toBe(true);
    expect(combo.events.some((e) => e.name === "update:modelValue")).toBe(true);
  }, 60000); // vue-component-meta first run is slow
});
```

- [ ] **Step 8: Run the component-meta tests**

Run: `npx vitest run tools/component-meta.test.mjs`
Expected: PASS. If `collectComponentMeta` errors on a field shape, fix per the Step 6 NOTE and re-run. If the run is very slow, the 60s timeout covers it.

- [ ] **Step 9: Commit**

```bash
git add tools/component-meta.mjs tools/component-meta.test.mjs tools/reference-core.mjs tools/reference-core.test.mjs package.json package-lock.json
git commit -m "reference: collect Vue component metadata via vue-component-meta; assembleComponents"
```

---

### Task 5: Manifest assembly, descriptions merge, coverage, renderers

**Files:**
- Modify: `tools/reference-core.mjs` (add `buildManifest`, `coverageGaps`, `mergeDescriptions`, `renderReferenceMd`, `renderLlmsTxt`)
- Modify: `tools/reference-core.test.mjs` (tests)
- Create: `docs/reference/descriptions.json` (seed — `{}` plus a few real entries)

**Interfaces:**
- Produces (pure):
  - `buildManifest(parts): Manifest` where `parts = {version, tokens, cssSurface, modes, components, examples, descriptions, icons}` — merges descriptions, attaches `examples` to primitives/utilities/states by name, returns the full manifest object in the canonical shape (with stable `generated:"design-system reference"`).
  - `coverageGaps(manifest): string[]` — sorted names of items whose `description===""` (tokens, primitives, utilities, states, modes, patterns, components).
  - `renderReferenceMd(manifest): string` and `renderLlmsTxt(manifest, guideText): string` — deterministic strings.

- [ ] **Step 1: Write the failing tests**

Add to `tools/reference-core.test.mjs`:
```js
import { buildManifest, coverageGaps, renderReferenceMd, renderLlmsTxt } from "./reference-core.mjs";

const parts = () => ({
  version: "1.2.3",
  tokens: [{ name: "--bg", value: "#000", description: "" }],
  cssSurface: {
    primitives: [{ name: "ds-btn", type: "primitive", category: "Buttons", description: "", subParts: [], states: ["is-primary"], examples: [] }],
    utilities: [{ name: "u-flex", type: "utility", category: "Display", description: "", examples: [] }],
    states: [{ name: "is-primary", type: "state", description: "", examples: [] }],
    patterns: []
  },
  modes: [{ name: "data-theme", type: "mode", values: ["dark", "light"], description: "" }],
  components: [{ name: "DsButton", type: "component", import: "import { DsButton } from 'design-language/vue'", description: "", renders: ["ds-btn"], props: [], events: [], slots: [] }],
  examples: { byClass: { "ds-btn": ["<button class=\"ds-btn\">x</button>"] }, patterns: [] },
  descriptions: { "ds-btn": { description: "Primary action button." }, "DsButton": { description: "Button component." } },
  icons: { count: 5, source: "icons/registry.json", approved: "icons/approved.json" }
});

describe("buildManifest", () => {
  const m = buildManifest(parts());
  it("merges descriptions and attaches examples by name", () => {
    expect(m.primitives[0].description).toBe("Primary action button.");
    expect(m.primitives[0].examples).toEqual(["<button class=\"ds-btn\">x</button>"]);
    expect(m.components[0].description).toBe("Button component.");
    expect(m.version).toBe("1.2.3");
    expect(m.generated).toBe("design-system reference");
  });
});

describe("coverageGaps", () => {
  it("lists only items still missing a description", () => {
    const gaps = coverageGaps(buildManifest(parts()));
    expect(gaps).toContain("--bg");
    expect(gaps).toContain("u-flex");
    expect(gaps).toContain("is-primary");
    expect(gaps).not.toContain("ds-btn");
    expect(gaps).not.toContain("DsButton");
  });
});

describe("renderers", () => {
  it("REFERENCE.md is deterministic and contains entries", () => {
    const a = renderReferenceMd(buildManifest(parts()));
    const b = renderReferenceMd(buildManifest(parts()));
    expect(a).toBe(b);
    expect(a).toContain("ds-btn");
    expect(a).toContain("DsButton");
  });
  it("llms.txt embeds the guide text and links the artifacts", () => {
    const out = renderLlmsTxt(buildManifest(parts()), "## Class Rules\nUse .ds-*");
    expect(out).toContain("Use .ds-*");
    expect(out).toContain("REFERENCE.md");
    expect(out).toContain("manifest.json");
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run tools/reference-core.test.mjs -t "buildManifest|coverageGaps|renderers"`
Expected: FAIL — functions not defined.

- [ ] **Step 3: Implement in `tools/reference-core.mjs`**

```js
function applyDescription(item, descriptions) {
  const d = descriptions[item.name];
  return d ? { ...item, description: d.description || "" } : item;
}
function attachExamples(item, byClass) {
  const ex = byClass[item.name];
  return ex && ex.length ? { ...item, examples: ex } : item;
}

export function buildManifest(parts) {
  const { version, tokens, cssSurface, modes, components, examples, descriptions, icons } = parts;
  const d = descriptions || {};
  const withMeta = (arr, useExamples) =>
    arr.map((it) => {
      let out = applyDescription(it, d);
      if (useExamples) out = attachExamples(out, examples.byClass);
      return out;
    });
  return {
    generated: "design-system reference",
    version,
    tokens: tokens.map((t) => applyDescription(t, d)),
    primitives: withMeta(cssSurface.primitives, true),
    utilities: withMeta(cssSurface.utilities, true),
    states: withMeta(cssSurface.states, true),
    modes: modes.map((mm) => applyDescription(mm, d)),
    patterns: withMeta(cssSurface.patterns, true),
    components: components.map((c) => applyDescription(c, d)),
    icons
  };
}

export function coverageGaps(manifest) {
  const groups = ["tokens", "primitives", "utilities", "states", "modes", "patterns", "components"];
  const gaps = [];
  for (const g of groups) for (const it of manifest[g] || []) if (!it.description) gaps.push(it.name);
  return gaps.sort();
}

// --- renderers ----------------------------------------------------------
function mdEscape(s) { return String(s).replace(/\|/g, "\\|"); }

export function renderReferenceMd(m) {
  const L = [];
  L.push("# Design System Reference", "", "> Generated by `npm run reference:build`. Do not edit by hand.", "");
  const section = (title, items, fmt) => {
    if (!items.length) return;
    L.push(`## ${title}`, "");
    for (const it of items) { L.push(`### ${it.name}`, ""); fmt(it); L.push(""); }
  };
  section("Tokens", m.tokens, (t) => L.push(`- value: \`${t.value}\``, t.description ? `- ${t.description}` : "- _(no description yet)_"));
  const classFmt = (it) => {
    if (it.description) L.push(it.description); else L.push("_(no description yet)_");
    if (it.category) L.push(`- category: ${it.category}`);
    if (it.subParts && it.subParts.length) L.push(`- sub-parts: ${it.subParts.map((s) => `\`${s}\``).join(", ")}`);
    if (it.states && it.states.length) L.push(`- states: ${it.states.map((s) => `\`${s}\``).join(", ")}`);
    if (it.examples && it.examples.length) L.push("", "```html", it.examples[0], "```");
  };
  section("Primitives", m.primitives, classFmt);
  section("Utilities", m.utilities, classFmt);
  section("States", m.states, classFmt);
  section("Modes", m.modes, (mm) => L.push(`- values: ${mm.values.map((v) => `\`${v}\``).join(", ")}`, mm.description || "_(no description yet)_"));
  section("Patterns", m.patterns, classFmt);
  section("Components", m.components, (c) => {
    L.push(c.description || "_(no description yet)_", "", `\`\`\`ts`, c.import, "```");
    if (c.renders.length) L.push(`- renders: ${c.renders.map((r) => `\`${r}\``).join(", ")}`);
    if (c.props.length) {
      L.push("", "| Prop | Type | Default | Required |", "| --- | --- | --- | --- |");
      for (const p of c.props) L.push(`| ${p.name} | \`${mdEscape(p.type)}\` | \`${mdEscape(p.default)}\` | ${p.required} |`);
    }
    if (c.events.length) { L.push("", "**Events:** " + c.events.map((e) => `\`${e.name}\``).join(", ")); }
    if (c.slots.length) { L.push("", "**Slots:** " + c.slots.map((s) => `\`${s.name}\``).join(", ")); }
  });
  return L.join("\n") + "\n";
}

export function renderLlmsTxt(m, guideText) {
  const counts = `${m.primitives.length} primitives, ${m.utilities.length} utilities, ${m.states.length} states, ${m.components.length} Vue components, ${m.tokens.length} tokens`;
  return [
    "# Design Language",
    "",
    `A monochrome-first, desktop-density design system: ${counts}.`,
    "Prefer existing tokens, utilities, primitives, states, and patterns over custom CSS.",
    "",
    guideText.trim(),
    "",
    "## Reference",
    "- Full catalog (human-readable): REFERENCE.md",
    "- Machine-readable manifest: reference/manifest.json",
    "- Validate your usage: `node tools/lint-usage.mjs \"src/**/*.{vue,html}\"`",
    ""
  ].join("\n");
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run tools/reference-core.test.mjs`
Expected: ALL pass.

- [ ] **Step 5: Seed `docs/reference/descriptions.json`**

Create `docs/reference/descriptions.json` with real entries for a handful of the most-used items (the rest stay warn-listed):
```json
{
  "ds-btn": { "description": "Button. Add .is-primary for the single main action, .is-ghost for low-emphasis, .is-danger for destructive." },
  "ds-card": { "description": "Bordered surface container for grouped content." },
  "ds-panel": { "description": "Titled content region with a .ds-panel-head and body." },
  "u-flex": { "description": "display:flex container." },
  "u-stack": { "description": "Vertical flex stack; pair with .u-gap-* for spacing." },
  "is-primary": { "description": "Marks the single primary action on a .ds-btn." },
  "data-theme": { "description": "Global light/dark mode set on a root element." },
  "data-density": { "description": "Global comfortable/compact spacing mode." },
  "DsButton": { "description": "Button primitive as a Vue component; maps variant/size props to .is-* classes." }
}
```

- [ ] **Step 6: Commit**

```bash
git add tools/reference-core.mjs tools/reference-core.test.mjs docs/reference/descriptions.json
git commit -m "reference: manifest assembly, description merge, coverage report, REFERENCE.md/llms.txt renderers"
```

---

### Task 6: Generator `tools/build-reference.mjs` + scripts + committed outputs

**Files:**
- Create: `tools/build-reference.mjs`
- Create: `reference/manifest.json`, `REFERENCE.md`, `llms.txt` (generated, committed)
- Modify: `package.json` (scripts `reference:build`, `reference:check`)
- Create: `tools/build-reference.test.mjs` (determinism)

**Interfaces:**
- Consumes all `reference-core` functions + `collectComponentMeta`.
- CLI: `node tools/build-reference.mjs` writes outputs; `--check` regenerates to memory, diffs against committed files (hard-fail on drift), prints coverage gaps as warnings; `--check --strict` additionally exits non-zero if any gaps.

- [ ] **Step 1: Implement `tools/build-reference.mjs`**

```js
import { readFile, writeFile, readdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "./reference-core.mjs";
import { collectComponentMeta, componentNames } from "./component-meta.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const strict = process.argv.includes("--strict");
const r = (p) => resolve(root, p);

async function buildOutputs() {
  const pkg = JSON.parse(await readFile(r("package.json"), "utf8"));
  const tokens = core.extractTokens(await readFile(r("css/tokens.css"), "utf8"));
  const cssSurface = core.extractCssSurface({
    components: await readFile(r("css/components.css"), "utf8"),
    utilities: await readFile(r("css/utilities.css"), "utf8"),
    patterns: await readFile(r("css/patterns.css"), "utf8")
  });
  const modes = core.extractModes();

  const docFiles = ["index.html", ...(await readdir(r("pages"))).filter((f) => f.endsWith(".html")).map((f) => `pages/${f}`)];
  const htmlDocs = await Promise.all(docFiles.map(async (p) => ({ name: p, html: await readFile(r(p), "utf8") })));
  const examples = core.extractExamples(htmlDocs);

  const indexSrc = await readFile(r("vue/index.ts"), "utf8");
  const names = componentNames(indexSrc);
  const sfcSource = Object.fromEntries(names.map((n) => [n, readFileSync(r(`vue/components/${n}.vue`), "utf8")]));
  const components = core.assembleComponents(collectComponentMeta(), sfcSource);

  const registry = JSON.parse(await readFile(r("icons/registry.json"), "utf8"));
  const icons = { count: Object.keys(registry).length, source: "icons/registry.json", approved: "icons/approved.json" };

  const descriptions = JSON.parse(await readFile(r("docs/reference/descriptions.json"), "utf8"));
  const manifest = core.buildManifest({ version: pkg.version, tokens, cssSurface, modes, components, examples, descriptions, icons });
  const guide = await readFile(r("LLM_GUIDE.md"), "utf8");

  return {
    manifest,
    manifestJson: JSON.stringify(manifest, null, 2) + "\n",
    referenceMd: core.renderReferenceMd(manifest),
    llmsTxt: core.renderLlmsTxt(manifest, guide.split("## Layout Rules")[0].split("## Class Rules")[1] ? "## Class Rules\n" + guide.split("## Class Rules")[1].split("\n## ")[0] : guide)
  };
}

const built = await buildOutputs();
const targets = [
  ["reference/manifest.json", built.manifestJson],
  ["REFERENCE.md", built.referenceMd],
  ["llms.txt", built.llmsTxt]
];

if (check) {
  let drift = false;
  for (const [p, content] of targets) {
    const current = await readFile(r(p), "utf8").catch(() => null);
    if (current !== content) { drift = true; console.error(`DRIFT: ${p} is out of date. Run npm run reference:build.`); }
  }
  if (drift) process.exit(1);
  const gaps = core.coverageGaps(built.manifest);
  if (gaps.length) {
    console.warn(`reference:check — ${gaps.length} item(s) missing a description:`);
    console.warn("  " + gaps.join(", "));
    if (strict) { console.error("reference:check --strict: failing on description gaps."); process.exit(1); }
  } else {
    console.log("reference:check — all surface items have descriptions.");
  }
  console.log("reference:check passed — outputs are current.");
} else {
  for (const [p, content] of targets) await writeFile(r(p), content);
  console.log("Wrote reference/manifest.json, REFERENCE.md, llms.txt.");
}
```

> NOTE: the `llmsTxt` guide-slice expression is defensive; if it produces an awkward slice, simplify to pass the whole `LLM_GUIDE.md` Class/Token/Icon rules. The only requirement (per the renderer test) is that `renderLlmsTxt` receives the rules text — exact slicing is cosmetic.

- [ ] **Step 2: Add npm scripts**

In `package.json` scripts, add:
```json
    "reference:build": "node tools/build-reference.mjs",
    "reference:check": "node tools/build-reference.mjs --check",
```

- [ ] **Step 3: Generate the committed outputs**

Run: `npm run reference:build`
Expected: writes the three files; prints the "Wrote …" line. Inspect `reference/manifest.json` — it should contain `primitives`, `components` (every Ds*), `tokens`, etc.; spot-check `DsButton` has props and `ds-btn` has an example.

- [ ] **Step 4: Determinism test**

Create `tools/build-reference.test.mjs`:
```js
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

describe("reference build determinism", () => {
  it("reference:check passes against freshly committed outputs", () => {
    // Rebuild then check must be clean (no drift).
    execFileSync("node", ["tools/build-reference.mjs"], { cwd: process.cwd() });
    const before = readFileSync("reference/manifest.json", "utf8");
    execFileSync("node", ["tools/build-reference.mjs"], { cwd: process.cwd() });
    const after = readFileSync("reference/manifest.json", "utf8");
    expect(after).toBe(before);
    execFileSync("node", ["tools/build-reference.mjs", "--check"], { cwd: process.cwd() }); // throws on non-zero exit
  }, 120000);
});
```

- [ ] **Step 5: Run determinism test + check**

Run: `npx vitest run tools/build-reference.test.mjs` → PASS.
Run: `npm run reference:check` → exit 0, prints the coverage-gap warning list (warn-first) and "reference:check passed".

- [ ] **Step 6: Commit**

```bash
git add tools/build-reference.mjs tools/build-reference.test.mjs reference/manifest.json REFERENCE.md llms.txt package.json
git commit -m "reference: generator (build + --check/--strict); commit manifest.json, REFERENCE.md, llms.txt"
```

---

### Task 7: Validator `tools/lint-usage.mjs`

**Files:**
- Create: `tools/lint-usage.mjs`
- Create: `tools/lint-usage.test.mjs`
- Modify: `package.json` (script `reference:lint`)

**Interfaces:**
- Produces:
  - `lint({ files, manifest }): {file, kind, name}[]` (pure-ish; `files = [{name, source, kind:'html'|'vue'}]`) — `kind` ∈ `unknown-class`/`unknown-component`/`unknown-prop`.
  - CLI: `node tools/lint-usage.mjs "<glob>" [...]` → prints errors, exits 1 if any.

- [ ] **Step 1: Write the failing test**

Create `tools/lint-usage.test.mjs`:
```js
import { describe, it, expect } from "vitest";
import { lint } from "./lint-usage.mjs";

const manifest = {
  primitives: [{ name: "ds-btn" }], utilities: [{ name: "u-flex" }], states: [{ name: "is-primary" }],
  patterns: [], tokens: [], modes: [],
  components: [{ name: "DsButton", props: [{ name: "variant" }, { name: "size" }] }]
};

describe("lint", () => {
  it("passes on known classes", () => {
    const errs = lint({ manifest, files: [{ name: "a.html", kind: "html", source: `<button class="ds-btn is-primary u-flex">x</button>` }] });
    expect(errs).toEqual([]);
  });
  it("flags an unknown class", () => {
    const errs = lint({ manifest, files: [{ name: "a.html", kind: "html", source: `<div class="ds-buton">x</div>` }] });
    expect(errs).toEqual([{ file: "a.html", kind: "unknown-class", name: "ds-buton" }]);
  });
  it("flags an unknown component and unknown prop in a Vue template", () => {
    const vue = `<template><DsButton variant="primary" /><DsNope /><DsButton bogus="x" /></template>`;
    const errs = lint({ manifest, files: [{ name: "c.vue", kind: "vue", source: vue }] });
    expect(errs).toContainEqual({ file: "c.vue", kind: "unknown-component", name: "DsNope" });
    expect(errs).toContainEqual({ file: "c.vue", kind: "unknown-prop", name: "DsButton.bogus" });
  });
  it("ignores non-ds classes and HTML attributes", () => {
    const errs = lint({ manifest, files: [{ name: "a.html", kind: "html", source: `<div class="my-app grid">x</div>` }] });
    expect(errs).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run tools/lint-usage.test.mjs`
Expected: FAIL — cannot resolve `./lint-usage.mjs`.

- [ ] **Step 3: Implement `tools/lint-usage.mjs`**

```js
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "node:fs/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Only validate classes in our grammar; everything else is the consumer's own CSS.
const OURS = /^(ds|u|is|p)-/;

function knownClassSet(manifest) {
  const s = new Set();
  for (const g of ["primitives", "utilities", "states", "patterns"]) for (const it of manifest[g] || []) s.add(it.name);
  return s;
}

export function lint({ files, manifest }) {
  const known = knownClassSet(manifest);
  const components = new Map((manifest.components || []).map((c) => [c.name, new Set((c.props || []).map((p) => p.name))]));
  const errors = [];

  for (const f of files) {
    // class="..." tokens (HTML + Vue static class)
    for (const m of f.source.matchAll(/class="([^"]*)"/g)) {
      for (const c of m[1].split(/\s+/).filter(Boolean)) {
        if (OURS.test(c) && !known.has(c)) errors.push({ file: f.name, kind: "unknown-class", name: c });
      }
    }
    if (f.kind === "vue") {
      // component tags <DsX ...>
      for (const m of f.source.matchAll(/<(Ds[A-Za-z0-9]+)([^>]*?)\/?>/g)) {
        const name = m[1];
        if (!components.has(name)) { errors.push({ file: f.name, kind: "unknown-component", name }); continue; }
        const props = components.get(name);
        for (const pm of m[2].matchAll(/(?:^|\s)(?::|v-bind:)?([a-zA-Z][a-zA-Z0-9-]*)=/g)) {
          let prop = pm[1];
          if (/^(v-|@|key$|ref$|class$|style$|is$)/.test(prop)) continue;
          // normalize kebab-case attribute to camelCase prop
          const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          if (!props.has(prop) && !props.has(camel)) errors.push({ file: f.name, kind: "unknown-prop", name: `${name}.${prop}` });
        }
      }
    }
  }
  return errors;
}

// --- CLI ---------------------------------------------------------------
async function main() {
  const patterns = process.argv.slice(2);
  if (!patterns.length) { console.error("usage: node tools/lint-usage.mjs \"<glob>\" [...]"); process.exit(2); }
  const manifest = JSON.parse(await readFile(resolve(root, "reference/manifest.json"), "utf8"));
  const files = [];
  for (const pat of patterns) {
    for await (const entry of glob(pat)) {
      const kind = entry.endsWith(".vue") ? "vue" : "html";
      files.push({ name: entry, kind, source: await readFile(entry, "utf8") });
    }
  }
  const errors = lint({ files, manifest });
  if (errors.length) {
    for (const e of errors) console.error(`${e.file}: ${e.kind} '${e.name}'`);
    console.error(`\nlint-usage: ${errors.length} problem(s).`);
    process.exit(1);
  }
  console.log(`lint-usage: ${files.length} file(s) clean.`);
}

// Run as CLI only when invoked directly.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("lint-usage.mjs")) {
  main();
}
```

> NOTE: `node:fs/promises`'s `glob` requires Node ≥ 22. Confirm `node -v` ≥ 22 (the repo's other tooling assumes modern Node). If unavailable, fall back to a tiny recursive `readdir` walk filtered by extension — keep the `lint({files,manifest})` signature identical so tests are unaffected.

- [ ] **Step 4: Run the unit tests**

Run: `npx vitest run tools/lint-usage.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Add the script + lint the real docs pages**

In `package.json` scripts add:
```json
    "reference:lint": "node tools/lint-usage.mjs \"index.html\" \"pages/*.html\"",
```
Run: `npm run reference:lint`
Expected: `lint-usage: N file(s) clean.` (exit 0). If it flags a real class, that means either the manifest missed a class (bug — investigate extraction) or a genuine docs typo (fix the page). Resolve until clean.

- [ ] **Step 6: Commit**

```bash
git add tools/lint-usage.mjs tools/lint-usage.test.mjs package.json
git commit -m "reference: lint-usage validator (unknown class/component/prop); lint docs pages clean"
```

---

### Task 8: Build integration, bundle, and docs wiring

**Files:**
- Modify: `package.json` (`build` script chains reference steps)
- Modify: `tools/bundle.mjs` (copy the four artifacts)
- Modify: `LLM_GUIDE.md` (link the generated reference)
- Modify: `AGENTS.md` and `CLAUDE.md` (point at `llms.txt`)
- Modify: `.gitignore` if needed (it should NOT ignore `reference/` — verify)

**Interfaces:** none new — wires existing pieces into `npm run build` and the bundle.

- [ ] **Step 1: Chain reference steps into the build**

In `package.json`, change `build` to run the reference check + lint alongside `icons:check`:
```json
    "build": "npm run icons:check && npm run reference:check && npm run reference:lint && vite build && npm run bundle",
```

- [ ] **Step 2: Copy artifacts into the offline bundle**

In `tools/bundle.mjs`, after the icons copy block (section 3), add a section:
```js
// 3c. Design-system reference + validator (offline catalog for humans + LLMs).
await copyFile(resolve(root, "reference/manifest.json"), resolve(out, "reference-manifest.json"));
await copyFile(resolve(root, "REFERENCE.md"), resolve(out, "REFERENCE.md"));
await copyFile(resolve(root, "llms.txt"), resolve(out, "llms.txt"));
await copyFile(resolve(root, "tools/lint-usage.mjs"), resolve(out, "lint-usage.mjs"));
```

> NOTE: the bundled `lint-usage.mjs` reads `reference/manifest.json` relative to its own `../reference/`. In the bundle the manifest is `reference-manifest.json` at the bundle root. Add a small fallback in `lint-usage.mjs`'s `main()` manifest-load: try `reference/manifest.json`, then `reference-manifest.json` in the same dir as the script. Implement this fallback now (edit `main()`), keeping the `lint()` signature unchanged, and re-run `npx vitest run tools/lint-usage.test.mjs` (still green — `lint()` untouched).

- [ ] **Step 3: Link the reference from the guide + agent docs**

Append to `LLM_GUIDE.md`:
```markdown

## Generated Reference

This guide states the rules; the full, always-accurate catalog is generated:

- `llms.txt` — orientation + rules + links (start here).
- `REFERENCE.md` — every token, class, state, mode, pattern, and Vue component with descriptions and examples.
- `reference/manifest.json` — machine-readable manifest.
- Validate usage: `node tools/lint-usage.mjs "src/**/*.{vue,html}"` (flags unknown classes/components/props).
```

In both `AGENTS.md` and `CLAUDE.md` — `CLAUDE.md` is just `@AGENTS.md`, so edit `AGENTS.md` only — add to the "Build, Test, and Development Commands" list:
```markdown
- `npm run reference:build`: regenerate `reference/manifest.json`, `REFERENCE.md`, and `llms.txt` from the CSS + Vue source. See `llms.txt` for the catalog AI tools should read.
```

- [ ] **Step 4: Verify `reference/` is shipped, not ignored**

Run: `git check-ignore reference/manifest.json REFERENCE.md llms.txt || echo "not ignored (good)"`
Expected: `not ignored (good)`. If any is ignored, remove the offending `.gitignore` rule.

- [ ] **Step 5: Full build gate**

Run, capturing output:
- `npm run build` → exit 0. The chain runs `reference:check` (warn-first, prints gaps), `reference:lint` (clean), then `vite build` + `bundle`.
- Confirm the bundle copied the artifacts: `ls dist/bundle/reference-manifest.json dist/bundle/REFERENCE.md dist/bundle/llms.txt dist/bundle/lint-usage.mjs`.
- `npm test 2>&1 | tail -3` → all pass (147 + the new tool tests).
- `npm run typecheck` → exit 0.

- [ ] **Step 6: Commit**

```bash
git add package.json tools/bundle.mjs tools/lint-usage.mjs LLM_GUIDE.md AGENTS.md
git commit -m "reference: wire reference:check + lint into build; bundle artifacts; link from guide/agent docs"
```

---

## Self-Review

- **Spec coverage:**
  - Generated manifest enumerating CSS classes/tokens/states/modes/patterns/components/icons → Tasks 2,3,4,5,6 (`buildManifest` + extractors).
  - 53 components from `vue/index.ts` (not hardcoded) → Task 4 `componentNames` + Task 6 wiring; test asserts `>40` and named exemplars.
  - Reuse `vue/__support__/css.ts` extractor → Task 1 (`css-extract.mjs` shared).
  - `vue-component-meta` props/types/defaults/slots/events → Task 4; event descriptions curated via sidecar → Task 5 (`applyDescription`).
  - Examples auto-extracted from `.example-preview`, SVGs collapsed → Task 3.
  - Outputs `manifest.json` + `REFERENCE.md` + `llms.txt` → Task 6; shipped in bundle → Task 8.
  - Warn-first coverage; `--strict` hard-fail; stale-diff hard-fail → Task 6 (`coverageGaps`, exit logic).
  - Validator unknown class/component/prop; runs over docs pages in build; exposed for consumers → Task 7 + Task 8 (build chain + bundle copy + path fallback).
  - `LLM_GUIDE.md`/`AGENTS.md`/`CLAUDE.md` link `llms.txt` → Task 8.
  - Deterministic build → Task 6 determinism test; sorting throughout.
  - Existing gates green → verified at end of Tasks 1,4,8.
- **Placeholder scan:** none — every code step has full code. The few NOTE blocks are explicit adjust-to-runtime instructions (CSS pattern prefix, vue-component-meta field names, preview regex terminator, Node `glob` availability, llms.txt slice), each with a concrete fallback and an invariant to preserve — not deferred work.
- **Type/consistency:** the `RawMeta` shape from `collectComponentMeta` (Task 4) matches `assembleComponents`'s input; the manifest shape in the header is the single contract used by `buildManifest` (Task 5), the generator (Task 6), and the validator (Task 7); `lint({files,manifest})` signature is stable across Tasks 7–8 so the bundle path-fallback edit doesn't touch tests. `componentNames` is defined once (Task 4) and reused (Task 6).
- **Scope:** one cohesive subsystem (reference generation + validation); single plan is appropriate.
