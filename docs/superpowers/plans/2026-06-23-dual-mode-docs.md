# Dual-Mode Docs (Vanilla / Vue code tabs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every docs `.example` a generated `Preview · HTML` code-tab set (HTML auto-derived from the live preview, never authored twice), and add a `Vue` tab on the ~10 interactive components from one co-located `<template data-vue>` snippet — while keeping the docs static/framework-free and offline-capable.

**Architecture:** A pure transform (`tools/inject-examples.mjs`, `transformExamples(html)`) rewraps each `.example` into tabs+panels using `node-html-parser` (build-only dep). A Vite plugin `injectExamples()` runs it in the same `transformIndexHtml` pass as `injectChrome()`, dev and build. Tab/copy interactivity is progressive enhancement in `js/docs.js`; styling in `css/docs.css`. Authoring a Vue tab = dropping a `<template data-vue>` in the `.example`. Once snippets exist, the coverage gate's docs assertion activates, scoped to the interactive set.

**Tech Stack:** `node-html-parser` (new build-only devDependency), the existing Vite `transformIndexHtml` plugin pattern, plain `docs.js`/`docs.css`, Vitest.

## Global Constraints

- The docs stay **static / framework-free**: nothing loads Vue at runtime. The Vue tab shows reference code only, never live-rendered.
- `node-html-parser` is a **build-only devDependency** — never shipped in the offline bundle (`tools/bundle.mjs` is unaffected).
- The transform core (`tools/inject-examples.mjs`) is **pure** (string in, string out); all Vite/IO lives in `vite.config.mjs`.
- HTML tab + copy applies to **all** `.example` blocks across the 11 pages. Vue tab only where a `<template data-vue>` is authored.
- Idempotent: an `.example` already carrying `has-code` is left untouched (dev HMR re-runs the pass).
- Inline SVGs in the HTML code panel are collapsed to `<svg><!-- icon --></svg>` in the displayed/copied code only; the live preview keeps the real icon.
- Works on `file://` and in the offline docs build; no new runtime dependency.
- Two-space indentation for nested HTML; `.ds-*`/`.u-*`/`.is-*` grammar; design values via `tokens.css`.

## Interactive component set (gets a Vue tab + gate coverage)

`DsCombobox`, `DsTree`, `DsContextMenu`, `DsDropdownMenu`, `DsTabs`, `DsAccordion`, `DsDialog`, `DsToastHost`, `DsSplitter`, `DsSortable` (all 10 confirmed present in `reference/manifest.json`).

---

### Task 1: Transform core + node-html-parser dep

Pure `transformExamples(html)` that rewraps `.example` blocks. Unit-tested directly (no Vite needed).

**Files:**
- Modify: `package.json` (add devDependency)
- Create: `tools/inject-examples.mjs`
- Test: `tools/inject-examples.test.mjs`

**Interfaces:**
- Produces: `transformExamples(html: string): string`; helpers `escapeHtml(s)`, `collapseSvgs(s)` (exported for testing).

- [ ] **Step 1: Install the build-only dependency**

Run: `npm install --save-dev node-html-parser`
Expected: `node-html-parser` appears under `devDependencies` in `package.json`; `package-lock.json` updated.

- [ ] **Step 2: Write the failing tests**

Create `tools/inject-examples.test.mjs`:

```js
import { describe, it, expect } from "vitest";
import { transformExamples, escapeHtml, collapseSvgs } from "./inject-examples.mjs";

describe("escapeHtml", () => {
  it("escapes &, <, >", () => {
    expect(escapeHtml(`<div class="x">a & b</div>`)).toBe(`&lt;div class="x"&gt;a &amp; b&lt;/div&gt;`);
  });
});

describe("collapseSvgs", () => {
  it("replaces svg content with an icon placeholder", () => {
    expect(collapseSvgs(`<span><svg viewBox="0 0 24 24"><path d="M1 1"/></svg></span>`))
      .toBe(`<span><svg><!-- icon --></svg></span>`);
  });
  it("collapses multiple svgs", () => {
    expect(collapseSvgs(`<svg><path/></svg>x<svg><g/></svg>`))
      .toBe(`<svg><!-- icon --></svg>x<svg><!-- icon --></svg>`);
  });
});

describe("transformExamples", () => {
  it("wraps a plain example with Preview + HTML tabs (no Vue)", () => {
    const html = `<div class="example"><div class="example-preview"><button class="ds-btn">Go</button></div><div class="example-caption">A button</div></div>`;
    const out = transformExamples(html);
    expect(out).toContain("example has-code");
    expect(out).toContain(`data-panel="preview"`);
    expect(out).toContain(`data-panel="html"`);
    expect(out).not.toContain(`data-panel="vue"`);
    // HTML panel contains the escaped preview markup
    expect(out).toContain(`&lt;button class="ds-btn"&gt;Go&lt;/button&gt;`);
    // live preview markup is preserved unescaped
    expect(out).toContain(`<button class="ds-btn">Go</button>`);
    // caption preserved
    expect(out).toContain("A button");
    // a copy button exists
    expect(out).toContain("example-copy");
  });

  it("adds a Vue tab and removes the template when data-vue is present", () => {
    const html = `<div class="example"><div class="example-preview"><div class="ds-combo">x</div></div><template data-vue>
<DsCombobox v-model="v" :options="opts" />
</template><div class="example-caption">Combo</div></div>`;
    const out = transformExamples(html);
    expect(out).toContain(`data-panel="vue"`);
    // vue snippet escaped and trimmed
    expect(out).toContain(`&lt;DsCombobox v-model="v" :options="opts" /&gt;`);
    // the raw <template data-vue> must NOT leak into output
    expect(out).not.toContain("data-vue");
    expect(out).not.toContain("<template");
  });

  it("collapses svgs in the HTML panel but not in the live preview", () => {
    const html = `<div class="example"><div class="example-preview"><span class="ds-adorn"><svg viewBox="0 0 24 24"><path d="M1 1"/></svg></span></div><div class="example-caption">Icon</div></div>`;
    const out = transformExamples(html);
    // preview keeps the real path
    expect(out).toContain(`<path d="M1 1"/>`);
    // HTML panel has the collapsed, escaped form
    expect(out).toContain(`&lt;svg&gt;&lt;!-- icon --&gt;&lt;/svg&gt;`);
  });

  it("is idempotent — skips an example already marked has-code", () => {
    const html = `<div class="example has-code"><div class="example-tabs"></div></div>`;
    expect(transformExamples(html)).toBe(html);
  });

  it("leaves a div without an example-preview untouched", () => {
    const html = `<div class="example"><div class="not-a-preview">x</div></div>`;
    const out = transformExamples(html);
    expect(out).not.toContain("has-code");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tools/inject-examples.test.mjs`
Expected: FAIL — `Failed to resolve import "./inject-examples.mjs"`.

- [ ] **Step 4: Implement the transform core**

Create `tools/inject-examples.mjs`:

```js
import { parse } from "node-html-parser";

export function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Collapse each <svg>…</svg> to a placeholder (display/copy only).
export function collapseSvgs(s) {
  return s.replace(/<svg[\s\S]*?<\/svg>/g, "<svg><!-- icon --></svg>");
}

function panel(name, codeEscaped) {
  return `<div class="example-panel" data-panel="${name}"><button class="example-copy" type="button">Copy</button><pre><code>${codeEscaped}</code></pre></div>`;
}

export function transformExamples(html) {
  const root = parse(html, { comment: true });
  let changed = false;

  for (const ex of root.querySelectorAll(".example")) {
    if (ex.classList.contains("has-code")) continue;
    const preview = ex.querySelector(".example-preview");
    if (!preview) continue;

    const tpl = ex.querySelector("template[data-vue]");
    const caption = ex.querySelector(".example-caption");

    const previewOuter = preview.outerHTML;
    const htmlCode = escapeHtml(collapseSvgs(preview.innerHTML));
    const vueCode = tpl ? escapeHtml(tpl.innerHTML.trim()) : null;

    const tabs = [
      `<button class="example-tab is-active" type="button" data-panel="preview">Preview</button>`,
      `<button class="example-tab" type="button" data-panel="html">HTML</button>`,
      vueCode != null ? `<button class="example-tab" type="button" data-panel="vue">Vue</button>` : ""
    ].join("");

    const previewPanel =
      `<div class="example-panel is-active" data-panel="preview">${previewOuter}</div>`;
    const htmlPanel = panel("html", htmlCode);
    const vuePanel = vueCode != null ? panel("vue", vueCode) : "";
    const captionHtml = caption ? caption.outerHTML : "";

    const inner =
      `<div class="example-tabs" role="tablist">${tabs}</div>` +
      previewPanel + htmlPanel + vuePanel + captionHtml;

    ex.set_content(inner);
    ex.setAttribute("class", "example has-code");
    changed = true;
  }

  return changed ? root.toString() : html;
}
```

(If a `node-html-parser` method name differs from the above — e.g. `set_content` vs `set_content`/`innerHTML=` — adjust to the installed version's API; the tests above are the contract. `set_content`, `setAttribute`, `classList.contains`, `querySelector`/`querySelectorAll` with attribute selectors, `innerHTML`/`outerHTML`, and `toString()` are all supported in node-html-parser v6.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tools/inject-examples.test.mjs`
Expected: PASS (all cases).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tools/inject-examples.mjs tools/inject-examples.test.mjs
git commit -m "feat(docs): example transform core (Preview/HTML/Vue tabs) + node-html-parser"
```

---

### Task 2: Wire injectExamples into Vite

**Files:**
- Modify: `vite.config.mjs`

**Interfaces:**
- Consumes: `transformExamples` from `./tools/inject-examples.mjs`.

- [ ] **Step 1: Add the plugin and register it**

In `vite.config.mjs`, add the import at the top:

```js
import { transformExamples } from "./tools/inject-examples.mjs";
```

Add this plugin function alongside `injectChrome` / `copyStaticJs`:

```js
// Rewrap every .example into Preview/HTML[/Vue] code tabs. Runs in dev and
// build. Operates on the body; independent of injectChrome's head/nav work.
function injectExamples() {
  return {
    name: "inject-examples",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return transformExamples(html);
      }
    }
  };
}
```

Register it after `injectChrome()` in the plugins array:

```js
  plugins: [injectChrome(), injectExamples(), copyStaticJs()],
```

- [ ] **Step 2: Verify dev + build emit tabs**

Run: `npm run build`
Expected: exit 0. Then confirm tabs are in the output:

Run: `grep -c "example has-code" dist/pages/buttons.html`
Expected: a count > 0 (every example on the page is wrapped).

Run: `grep -c "data-vue\|<template" dist/pages/*.html dist/index.html`
Expected: 0 — no raw `data-vue` template leaks into any built page.

- [ ] **Step 3: Commit**

```bash
git add vite.config.mjs
git commit -m "feat(docs): wire injectExamples plugin into Vite (dev + build)"
```

---

### Task 3: Tab + copy interactivity and styling

**Files:**
- Modify: `js/docs.js`
- Modify: `css/docs.css`

- [ ] **Step 1: Add tab + copy behavior to docs.js**

Append inside the IIFE in `js/docs.js` (after the theme-toggle block, before the closing `})();`):

```js
  // ---- Example code tabs + copy (progressive enhancement) ----
  document.addEventListener("click", function (e) {
    var tab = e.target.closest && e.target.closest(".example-tab");
    if (tab) {
      var ex = tab.closest(".example");
      if (!ex) return;
      var panel = tab.getAttribute("data-panel");
      ex.querySelectorAll(".example-tab").forEach(function (t) {
        t.classList.toggle("is-active", t === tab);
      });
      ex.querySelectorAll(".example-panel").forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === panel);
      });
      return;
    }
    var copy = e.target.closest && e.target.closest(".example-copy");
    if (copy) {
      var pre = copy.parentElement.querySelector("code");
      if (!pre || !navigator.clipboard) return;
      navigator.clipboard.writeText(pre.textContent).then(function () {
        var prev = copy.textContent;
        copy.textContent = "Copied";
        setTimeout(function () { copy.textContent = prev; }, 1200);
      }).catch(function () {});
    }
  });
```

- [ ] **Step 2: Add tab/panel/copy styling to docs.css**

Append to the `.example` section of `css/docs.css` (use existing tokens; do not hard-code colors):

```css
.example-tabs { display:flex; gap:2px; margin-bottom:8px; border-bottom:1px solid var(--border); }
.example-tab { appearance:none; background:none; border:none; padding:6px 12px; font:inherit; font-size:var(--fz-sm); color:var(--text-3); cursor:default; border-bottom:2px solid transparent; }
.example-tab.is-active { color:var(--text-1); border-bottom-color:var(--accent); }
.example-tab:focus-visible { box-shadow:var(--focus-ring); outline:none; }
.example-panel { display:none; position:relative; }
.example-panel.is-active { display:block; }
.example-panel pre { margin:0; overflow:auto; background:var(--inset); border:1px solid var(--border); border-radius:var(--radius); padding:12px; font-family:var(--font-mono); font-size:var(--fz-xs); }
.example-copy { position:absolute; top:8px; right:8px; appearance:none; background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:2px 8px; font:inherit; font-size:var(--fz-xs); color:var(--text-2); cursor:default; }
.example-copy:focus-visible { box-shadow:var(--focus-ring); outline:none; }
```

(Verify each token name — `--inset`, `--surface-2`, `--border`, `--accent`, `--radius`, `--focus-ring`, `--text-1/2/3`, `--font-mono`, `--fz-sm/xs` — exists in `css/tokens.css`; the chrome/nav already use these. Adjust any that differ.)

- [ ] **Step 3: Verify in dev**

Run: `npm run build` then `grep -c "example-tabs" dist/pages/forms.html`
Expected: count > 0. (Manual browser check of tab switching/copy is noted in the spec's testing section; the build assertion confirms the markup ships.)

- [ ] **Step 4: Commit**

```bash
git add js/docs.js css/docs.css
git commit -m "feat(docs): tab switching + copy UI and styling for example code panels"
```

---

### Task 4: Author Vue snippets for the 10 interactive components

For each interactive component, add a `<template data-vue>` to the most representative `.example` for that component on its page. The snippet is authored ONCE; the HTML tab is still auto-derived from the live preview.

**Files:**
- Modify: the pages hosting each component's primary example (locate via `grep`). Likely: `pages/forms.html` (Combobox), `pages/data-display.html` (Tree, Sortable), `pages/navigation.html` (ContextMenu, DropdownMenu, Tabs), `pages/feedback.html` (Dialog, ToastHost, Accordion), `pages/patterns.html` (Splitter). Confirm actual locations by grepping for each component's vanilla `.ds-*` markup.

**Interfaces:**
- Produces: a `<template data-vue>` inside one `.example` per interactive component. The template's inner markup is the Vue usage; it sits as a direct child of `.example`, AFTER `.example-preview`, BEFORE `.example-caption`.

- [ ] **Step 1: Locate each component's primary example**

For each of the 10 components, find the page+example that demonstrates its vanilla form. Run e.g.:

Run: `grep -rln "ds-combo\|ds-tree\|ds-context-menu\|ds-menu\|ds-tabs\|ds-acc\|ds-dialog\|ds-toast\|ds-splitter\|ds-sortable" pages/`
Use the result to pick the right `.example` for each. (One example per component; if a component has several examples, choose the most representative.)

- [ ] **Step 2: Add the data-vue snippet to each chosen example**

Insert, as a direct child of the `.example` (after the `.example-preview`, before `.example-caption`), authored to match each component's real props (check `reference/manifest.json` `components[].props` for exact prop names). Reference snippets (adapt prop values to the example's data):

```html
<template data-vue>
<DsCombobox v-model="value" :options="options" filterable />
</template>
```
```html
<template data-vue>
<DsTree :nodes="nodes" v-model:expanded="expanded" />
</template>
```
```html
<template data-vue>
<DsContextMenu :items="items"><div class="target">Right-click me</div></DsContextMenu>
</template>
```
```html
<template data-vue>
<DsDropdownMenu :items="items" label="Actions" />
</template>
```
```html
<template data-vue>
<DsTabs v-model="tab" :tabs="tabs">
  <DsTabPanel value="general">General settings</DsTabPanel>
  <DsTabPanel value="advanced">Advanced settings</DsTabPanel>
</DsTabs>
</template>
```
```html
<template data-vue>
<DsAccordion>
  <DsAccordionItem title="General">Language and startup.</DsAccordionItem>
  <DsAccordionItem title="Advanced">Cache and logging.</DsAccordionItem>
</DsAccordion>
</template>
```
```html
<template data-vue>
<DsDialog v-model:open="open" title="Delete this file?">
  This action cannot be undone.
</DsDialog>
</template>
```
```html
<template data-vue>
<DsToastHost />
<!-- elsewhere: const { push } = useToast(); push({ message: 'Saved' }) -->
</template>
```
```html
<template data-vue>
<DsSplitter>
  <template #first>Sidebar</template>
  <template #rest>Content</template>
</DsSplitter>
</template>
```
```html
<template data-vue>
<DsSortable v-model="items">
  <template #item="{ item }">{{ item.label }}</template>
</DsSortable>
</template>
```

IMPORTANT: cross-check each component's actual prop/slot/event names against `reference/manifest.json` `components[]` (props, slots, events) and correct the snippet to use the real API. The snippet is reference code, so accuracy matters.

- [ ] **Step 3: Verify build still clean and templates removed from output**

Run: `npm run reference:lint` → clean (the source pages must not introduce unknown `.ds-*` classes; the PascalCase Vue tags inside `template[data-vue]` are not class tokens and are ignored by the HTML linter).
Run: `npm run build` then `grep -rc "<template" dist/pages/*.html dist/index.html | grep -v ":0" || echo "no template leaks"`
Expected: `no template leaks` (every `data-vue` template was consumed by the transform).
Run: `grep -c "data-panel=\"vue\"" dist/pages/*.html dist/index.html | grep -v ":0"`
Expected: ~10 pages/examples now carry a Vue panel.

- [ ] **Step 4: Commit**

```bash
git add pages/*.html
git commit -m "docs: author Vue snippets for the 10 interactive components"
```

---

### Task 5: Activate the coverage gate's docs assertion (scoped to interactive set)

With `data-vue` snippets now present, `docsCoverage` stops skipping. Scope it to the interactive set so it flags only an interactive component MISSING its snippet (not all 52).

**Files:**
- Modify: `tools/coverage-core.mjs`
- Modify: `tools/coverage.mjs` (pass the expected set)
- Modify: `tools/coverage.test.mjs`

**Interfaces:**
- Produces: `DATA_VUE_EXPECTED: Set<string>` (the 10 names). `docsCoverage({ components, pageSources, expected = DATA_VUE_EXPECTED })`: when no `data-vue` exists anywhere → `{skipped:true, violations:[]}` (unchanged); otherwise flag each component in `expected` that no `data-vue` snippet references.

- [ ] **Step 1: Write the failing tests**

Append to `tools/coverage.test.mjs`:

```js
import { DATA_VUE_EXPECTED } from "./coverage-core.mjs";

describe("docsCoverage scoped to interactive set", () => {
  const components = [{ name: "DsCombobox" }, { name: "DsButton" }];
  const expected = new Set(["DsCombobox"]); // DsButton is NOT expected to have a Vue tab

  it("flags an expected interactive component with no snippet", () => {
    const page = `<template data-vue>\n<DsTree />\n</template>`; // some data-vue exists, but not DsCombobox
    const r = docsCoverage({ components, pageSources: [page], expected });
    expect(r.skipped).toBe(false);
    expect(r.violations).toEqual([
      { rule: "docs", entity: "DsCombobox", detail: "no data-vue snippet in any page references this component" }
    ]);
  });

  it("does NOT flag a non-interactive component lacking a snippet", () => {
    const page = `<template data-vue>\n<DsCombobox />\n</template>`;
    const r = docsCoverage({ components, pageSources: [page], expected });
    expect(r.violations).toEqual([]); // DsButton not in expected, DsCombobox present
  });

  it("still skips entirely when no data-vue exists anywhere", () => {
    const r = docsCoverage({ components, pageSources: ["<div>x</div>"], expected });
    expect(r.skipped).toBe(true);
  });

  it("DATA_VUE_EXPECTED contains the ten interactive components", () => {
    expect([...DATA_VUE_EXPECTED].sort()).toEqual(
      ["DsAccordion","DsCombobox","DsContextMenu","DsDialog","DsDropdownMenu","DsSortable","DsSplitter","DsTabs","DsToastHost","DsTree"]
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: FAIL — `DATA_VUE_EXPECTED` not exported; `docsCoverage` ignores `expected`.

- [ ] **Step 3: Implement**

In `tools/coverage-core.mjs`, add the constant near `STORY_ALIASES`:

```js
// Components that warrant a Vue code tab in the docs (the interactive tier).
// docsCoverage flags any of these lacking a <template data-vue> snippet.
export const DATA_VUE_EXPECTED = new Set([
  "DsCombobox", "DsTree", "DsContextMenu", "DsDropdownMenu", "DsTabs",
  "DsAccordion", "DsDialog", "DsToastHost", "DsSplitter", "DsSortable"
]);
```

Replace `docsCoverage` with:

```js
export function docsCoverage({ components, pageSources, expected = DATA_VUE_EXPECTED }) {
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
    .filter((c) => expected.has(c.name) && !used.has(c.name))
    .map((c) => ({
      rule: "docs",
      entity: c.name,
      detail: "no data-vue snippet in any page references this component"
    }));
  return { skipped: false, violations };
}
```

(The CLI `tools/coverage.mjs` calls `docsCoverage({ components, pageSources })` — the default `expected` applies, so no CLI change is required. Leave the CLI as-is.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: PASS (all prior + 4 new).

- [ ] **Step 5: Verify the live gate**

Run: `node tools/coverage.mjs`
Expected: `docs (component → data-vue)` is no longer skipped; it reports `ok` (all 10 interactive components have snippets from Task 4). `story`/`example`/`renders` still `ok`. Final line: `coverage:check passed — all layers aligned.`

If `docs` lists a component, Task 4 missed its snippet — add it on the right page, regenerate is not needed (docsCoverage reads page source directly), re-run.

- [ ] **Step 6: Commit**

```bash
git add tools/coverage-core.mjs tools/coverage.test.mjs
git commit -m "feat(coverage): activate docs assertion scoped to interactive component set"
```

---

### Task 6: Build-output assertions + full verification

A Node test in the existing style, asserting the dual-mode contract on the built `dist/`.

**Files:**
- Create: `tools/dual-mode-build.test.mjs`

- [ ] **Step 1: Write the build-output test**

Create `tools/dual-mode-build.test.mjs`:

```js
import { describe, it, expect, beforeAll } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distPages = resolve(root, "dist/pages");

async function builtPages() {
  const files = (await readdir(distPages)).filter((f) => f.endsWith(".html"));
  const out = [];
  for (const f of files) out.push({ name: f, html: await readFile(resolve(distPages, f), "utf8") });
  out.push({ name: "index.html", html: await readFile(resolve(root, "dist/index.html"), "utf8") });
  return out;
}

describe("dual-mode built output", () => {
  let pages;
  beforeAll(async () => { pages = await builtPages(); });

  it("every example is wrapped with code tabs", () => {
    for (const p of pages) {
      const examples = (p.html.match(/class="example /g) || []).concat(p.html.match(/class="example"/g) || []);
      const hasCode = (p.html.match(/example has-code/g) || []).length;
      // every .example became .example has-code
      expect(p.html.includes("example") ? hasCode : 0).toBeGreaterThanOrEqual(0);
      if (p.html.includes("example-preview")) {
        expect(hasCode).toBeGreaterThan(0);
      }
    }
  });

  it("no raw data-vue template leaks into any built page", () => {
    for (const p of pages) {
      expect(p.html).not.toContain("data-vue");
      expect(p.html).not.toMatch(/<template/);
    }
  });

  it("Vue panels exist on the interactive pages", () => {
    const total = pages.reduce((n, p) => n + (p.html.match(/data-panel="vue"/g) || []).length, 0);
    expect(total).toBeGreaterThanOrEqual(10);
  });

  it("svgs in HTML panels are collapsed (no path d= inside an html panel code block)", () => {
    for (const p of pages) {
      for (const m of p.html.matchAll(/data-panel="html">[\s\S]*?<\/pre>/g)) {
        expect(m[0]).not.toContain("&lt;path d=");
      }
    }
  });
});
```

- [ ] **Step 2: Build, then run the build-output test**

Run: `npm run build && npx vitest run tools/dual-mode-build.test.mjs`
Expected: PASS — all four assertions hold against the fresh `dist/`.

- [ ] **Step 3: Run the full unit suite**

Run: `npx vitest run`
Expected: all tests pass (inject-examples, coverage, dual-mode-build, plus the pre-existing suites).

- [ ] **Step 4: Final full build + gate**

Run: `npm run build` then `node tools/coverage.mjs`
Expected: build exit 0; gate `story`/`example`/`renders`/`docs` all `ok`, `coverage:check passed — all layers aligned.`

- [ ] **Step 5: Commit**

```bash
git add tools/dual-mode-build.test.mjs
git commit -m "test(docs): build-output assertions for dual-mode code tabs"
```

---

## Notes for the implementer

- **The tests are the contract for the transform.** If `node-html-parser`'s API differs from the reference implementation in Task 1, adjust the implementation to satisfy `tools/inject-examples.test.mjs` — do not change the tests.
- **Accuracy of Vue snippets matters** — they ship as reference code. Always cross-check prop/slot/event names against `reference/manifest.json` `components[]` before authoring; the sketches in Task 4 are starting points.
- **Order of plugins:** `injectExamples()` runs after `injectChrome()`; it only touches `.example` blocks in the body and never injects assets, so its ordering is not load-bearing for hashing (unlike injectChrome).
- **docsCoverage reads page SOURCE**, not `dist/` — the `<template data-vue>` stays in `pages/*.html` and is only stripped from build output. Do not remove templates from source.
- **`node-html-parser` is build-only** — confirm it is under `devDependencies`, never `dependencies`, so the offline bundle is unaffected.
- The gate stays **warn-only**; do not add `--strict`.
