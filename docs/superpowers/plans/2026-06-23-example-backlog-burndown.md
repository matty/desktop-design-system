# Example Backlog Burn-Down Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clear the coverage gate's primitive-example backlog (29 primitives with no docs example) by authoring focused `.example` blocks on the right pages, resolving the `ds-radio-group` renders mismatch, and exempting the two genuinely non-visual infrastructure classes — so `coverage:check` reports the example assertion clean.

**Architecture:** Most uncovered primitives are presentational and just lack a counted `.example-preview` block; a few are composed (split-pane, app-shell) so one example covers several primitives at once. Two classes are non-visual infrastructure and get a documented exemption set in the coverage core. The reference manifest is regenerated from the new examples.

**Tech Stack:** Plain HTML `.example` blocks in `pages/*.html` (two-space indent), CSS in `css/components.css`, the existing `tools/coverage-core.mjs` + `tools/build-reference.mjs` generators. No new dependencies.

## Global Constraints

- Class grammar: primitives `.ds-*`, utilities `.u-*`, states/variants `.is-*`, modes `data-*`. Design values reference `tokens.css` custom properties — never hard-coded colors/sizes.
- Every class used in a new example MUST already exist in the manifest grammar — `npm run reference:lint` must stay clean (it rejects unknown `ds-`/`u-`/`is-`/`ptn-` classes).
- `.example` block shape (copy this structure exactly): `<div class="example"><div class="example-preview [modifier]"> …markup… </div><div class="example-caption"> …text… </div></div>`. The extractor counts every `class="…"` token inside `example-preview`, so a composed preview covers all primitives it contains.
- After any change that affects examples or CSS surface, regenerate with `npm run reference:build` and commit the regenerated `reference/manifest.json`, `REFERENCE.md`, `llms.txt` — otherwise `npm run reference:check` (in `build`) fails on drift.
- The coverage gate stays **warn-only** (no `--strict`); do not flip it in this plan.
- Two-space indentation for nested HTML.

## Coverage map (which example covers which primitives)

| Example to author | Page | Primitives it covers |
|---|---|---|
| Tag/chip strip | forms | `ds-chip` |
| Textarea field | forms | `ds-textarea` |
| Radio group | forms | `ds-radio`, `ds-radio-group` |
| Card | data-display | `ds-card` |
| Table | data-display | `ds-table` |
| Labeled meter | data-display | `ds-meter` |
| Breadcrumb | navigation | `ds-breadcrumb` |
| Context menu (with submenu) | navigation | `ds-context-menu`, `ds-submenu-chev` |
| Modal dialog | feedback | `ds-dialog`, `ds-overlay` |
| Popover | feedback | `ds-popover` |
| Tooltip | feedback | `ds-tip` |
| Type scale | foundations | `ds-h1`, `ds-sub`, `ds-muted`, `ds-label` |
| Split pane | patterns | `ds-resizable`, `ds-pane-first`, `ds-pane-rest`, `ds-splitter` |
| App-shell composite | system | `ds-titlebar`, `ds-winbtns`, `ds-rail`, `ds-navi`, `ds-toolbar`, `ds-statusbar` |
| (exempt — no example) | — | `ds-live`, `ds-drop-placeholder` |

That accounts for all 29 + `ds-radio-group`.

---

### Task 1: Resolve the `ds-radio-group` renders mismatch

`DsRadioGroup.vue` renders `<div class="ds-radio-group">` but `css/components.css` has no `.ds-radio-group` rule (only `.ds-radio`), so the gate flags it. A radiogroup wrapper genuinely needs layout (the radios are `inline-flex` and would otherwise wrap awkwardly). Add the rule; it becomes a real primitive.

**Files:**
- Modify: `css/components.css` (near the `.ds-radio` rules, ~line 187)
- Regenerate: `reference/manifest.json`, `REFERENCE.md`, `llms.txt`

- [ ] **Step 1: Add the CSS rule**

In `css/components.css`, immediately before the `.ds-radio {` rule, add:

```css
.ds-radio-group { display:flex; flex-direction:column; gap:8px; }
```

- [ ] **Step 2: Regenerate the reference and confirm the renders finding clears**

Run: `npm run reference:build && node tools/coverage.mjs`
Expected: the `renders` line now reads `renders (component → primitive): ok` (the `DsRadioGroup → ds-radio-group` finding is gone). The `example` count is unchanged for now (a `ds-radio-group` example is added in Task 2).

- [ ] **Step 3: Commit**

```bash
git add css/components.css reference/manifest.json REFERENCE.md llms.txt
git commit -m "fix(css): add ds-radio-group layout rule (resolves renders drift)"
```

---

### Task 2: Add the two-class example exemption to the coverage core

`ds-live` (a visually-hidden ARIA live region) and `ds-drop-placeholder` (a transient drag-state marker) have no standalone visual and should not require an example. Add a documented exempt set so `exampleCoverage` skips them.

**Files:**
- Modify: `tools/coverage-core.mjs` (the `exampleCoverage` function + a new exported constant)
- Modify: `tools/coverage.test.mjs` (add cases)

**Interfaces:**
- Produces: `EXAMPLE_EXEMPT: Set<string>`; `exampleCoverage({ primitives, exempt? })` gains an optional `exempt` param defaulting to `EXAMPLE_EXEMPT`. Existing callers (the CLI) need no change — the default applies.

- [ ] **Step 1: Write the failing test**

Append to `tools/coverage.test.mjs`:

```js
import { EXAMPLE_EXEMPT } from "./coverage-core.mjs";

describe("exampleCoverage exemptions", () => {
  it("does not flag an exempt non-visual primitive", () => {
    const v = exampleCoverage({ primitives: [{ name: "ds-live", examples: [] }] });
    expect(v).toEqual([]);
  });

  it("still flags a non-exempt primitive with no examples", () => {
    const v = exampleCoverage({ primitives: [{ name: "ds-card", examples: [] }] });
    expect(v).toEqual([
      { rule: "example", entity: "ds-card", detail: "no docs example in pages/*.html" }
    ]);
  });

  it("exempts exactly the two documented infrastructure classes", () => {
    expect([...EXAMPLE_EXEMPT].sort()).toEqual(["ds-drop-placeholder", "ds-live"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: FAIL — `EXAMPLE_EXEMPT` is not exported; the first test fails because `ds-live` is currently flagged.

- [ ] **Step 3: Implement**

In `tools/coverage-core.mjs`, add the constant near `STORY_ALIASES`:

```js
// Non-visual infrastructure primitives that legitimately have no standalone
// docs example: a visually-hidden ARIA live region and a transient drag-state
// placeholder. Excluded from the example-coverage assertion by design.
export const EXAMPLE_EXEMPT = new Set(["ds-live", "ds-drop-placeholder"]);
```

Replace the existing `exampleCoverage` with:

```js
export function exampleCoverage({ primitives, exempt = EXAMPLE_EXEMPT }) {
  return primitives
    .filter((p) => !exempt.has(p.name) && (!p.examples || p.examples.length === 0))
    .map((p) => ({
      rule: "example",
      entity: p.name,
      detail: "no docs example in pages/*.html"
    }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tools/coverage.test.mjs`
Expected: PASS (all prior + 3 new).

- [ ] **Step 5: Commit**

```bash
git add tools/coverage-core.mjs tools/coverage.test.mjs
git commit -m "feat(coverage): exempt non-visual ds-live/ds-drop-placeholder from example rule"
```

---

### Task 3: Author form + data-display examples

Add focused `.example` blocks. Match the existing block structure on each page (see Task references). Use only existing classes. Do not disturb existing demos — add new blocks in the relevant section.

**Files:**
- Modify: `pages/forms.html`, `pages/data-display.html`

- [ ] **Step 1: Add the forms examples**

In `pages/forms.html`, within the appropriate section, add three `.example` blocks. Markup to use (adapt indentation to the surrounding file):

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-chip">Design <button class="ds-chip-x" aria-label="Remove">×</button></div>
    <div class="ds-chip">Engineering <button class="ds-chip-x" aria-label="Remove">×</button></div>
    <div class="ds-chip">Research <button class="ds-chip-x" aria-label="Remove">×</button></div>
  </div>
  <div class="example-caption">Removable tags using <code>.ds-chip</code>.</div>
</div>

<div class="example">
  <div class="example-preview col">
    <div class="ds-field w-320">
      <label class="ds-field-label">Release notes</label>
      <textarea class="ds-textarea" rows="3">Describe what changed…</textarea>
    </div>
  </div>
  <div class="example-caption">Multiline input with <code>.ds-textarea</code>.</div>
</div>

<div class="example">
  <div class="example-preview">
    <div class="ds-radio-group" role="radiogroup" aria-label="Density">
      <label class="ds-radio"><input type="radio" name="density" checked /> Comfortable</label>
      <label class="ds-radio"><input type="radio" name="density" /> Compact</label>
    </div>
  </div>
  <div class="example-caption">Vertical radio set with <code>.ds-radio-group</code>.</div>
</div>
```

(Confirm `.ds-chip-x`, `.ds-field`, `.ds-field-label`, `.w-320` exist on the page already — they are used in the existing forms examples. If `.w-320` is not a manifest class it is a page-local utility already in use; mirror whatever the existing field examples use.)

- [ ] **Step 2: Add the data-display examples**

In `pages/data-display.html`, add three `.example` blocks:

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-card">
      <div class="ds-label">Storage</div>
      <div class="ds-h1">68%</div>
      <div class="ds-muted">of 512 GB used</div>
    </div>
  </div>
  <div class="example-caption">Surface container with <code>.ds-card</code>.</div>
</div>

<div class="example">
  <div class="example-preview">
    <table class="ds-table">
      <thead><tr><th>Name</th><th>Size</th></tr></thead>
      <tbody>
        <tr><td>report.pdf</td><td>2.4 MB</td></tr>
        <tr><td>data.csv</td><td>880 KB</td></tr>
      </tbody>
    </table>
  </div>
  <div class="example-caption">Tabular data with <code>.ds-table</code>.</div>
</div>

<div class="example">
  <div class="example-preview col">
    <div class="ds-meter"><span class="k">CPU</span><div class="track"><span class="fill" style="width:42%"></span></div><span class="v">42%</span></div>
  </div>
  <div class="example-caption">Labeled progress with <code>.ds-meter</code>.</div>
</div>
```

(Check the existing `.ds-meter` markup on data-display.html or in the manifest `subParts` for the exact inner class names — `k`/`track`/`fill`/`v` — and match them. If the page already shows a meter inside a non-example block, mirror that markup.)

- [ ] **Step 3: Regenerate, lint, and check coverage**

Run: `npm run reference:build && npm run reference:lint && node tools/coverage.mjs`
Expected: lint clean; the `example` count drops by the primitives now covered (ds-chip, ds-textarea, ds-radio, ds-radio-group, ds-card, ds-table, ds-meter, and ds-h1/ds-muted via the card). No new `unknown-class` errors.

- [ ] **Step 4: Commit**

```bash
git add pages/forms.html pages/data-display.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "docs: focused examples for chip/textarea/radio-group, card/table/meter"
```

---

### Task 4: Author navigation + feedback + foundations examples

**Files:**
- Modify: `pages/navigation.html`, `pages/feedback.html`, `pages/foundations.html`

- [ ] **Step 1: Add the navigation examples**

In `pages/navigation.html`:

```html
<div class="example">
  <div class="example-preview">
    <nav class="ds-breadcrumb" aria-label="Breadcrumb">
      <a href="#">Home</a><span>/</span><a href="#">Projects</a><span>/</span><span class="current">Atlas</span>
    </nav>
  </div>
  <div class="example-caption">Wayfinding with <code>.ds-breadcrumb</code>.</div>
</div>

<div class="example">
  <div class="example-preview">
    <div class="ds-context-menu">
      <div class="ds-menu">
        <button class="ds-menu-item">Cut</button>
        <button class="ds-menu-item">Copy</button>
        <button class="ds-menu-item">More<span class="ds-submenu-chev"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" d="m9 18 6-6-6-6"/></svg></span></button>
      </div>
    </div>
  </div>
  <div class="example-caption">Right-click surface with <code>.ds-context-menu</code> and a submenu chevron.</div>
</div>
```

(Verify the exact menu item class names — `.ds-menu`, `.ds-menu-item` — against the existing menu examples on navigation.html and the manifest; match them. Use the page's existing chevron SVG markup if one exists.)

- [ ] **Step 2: Add the feedback examples**

In `pages/feedback.html`:

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-overlay" style="position:relative; inset:auto; padding:24px;">
      <div class="ds-dialog">
        <div class="ds-dialog-head">Delete file?</div>
        <div class="ds-dialog-body">This action cannot be undone.</div>
        <div class="ds-dialog-foot"><button class="ds-btn">Cancel</button><button class="ds-btn is-danger">Delete</button></div>
      </div>
    </div>
  </div>
  <div class="example-caption">Modal shell: <code>.ds-overlay</code> wrapping <code>.ds-dialog</code>.</div>
</div>

<div class="example">
  <div class="example-preview">
    <div class="ds-popover">Saved automatically a few seconds ago.</div>
  </div>
  <div class="example-caption">Floating surface with <code>.ds-popover</code>.</div>
</div>

<div class="example">
  <div class="example-preview">
    <button class="ds-btn ds-tip" data-tip="Saves to the cloud">Hover me</button>
  </div>
  <div class="example-caption">CSS tooltip via <code>.ds-tip</code> + <code>data-tip</code>.</div>
</div>
```

(Verify `.ds-dialog-head`/`-body`/`-foot` names against the existing dialog markup on feedback.html and match them exactly. The inline `style` on the overlay is only to make the fixed-position backdrop render inline in the static preview — keep it minimal.)

- [ ] **Step 2b: Confirm ds-overlay still counts**

The overlay carries an inline `style` to neutralize `position:fixed` for the preview. The extractor keys on `class="…"` tokens, so `ds-overlay` is still counted regardless of the inline style.

- [ ] **Step 3: Add the foundations type-scale example**

In `pages/foundations.html`:

```html
<div class="example">
  <div class="example-preview col">
    <div class="ds-h1">Heading one</div>
    <div class="ds-sub">Secondary subtitle text</div>
    <div class="ds-label">Section label</div>
    <div class="ds-muted">Muted helper text</div>
  </div>
  <div class="example-caption">Type-scale primitives: <code>.ds-h1</code>, <code>.ds-sub</code>, <code>.ds-label</code>, <code>.ds-muted</code>.</div>
</div>
```

- [ ] **Step 4: Regenerate, lint, and check coverage**

Run: `npm run reference:build && npm run reference:lint && node tools/coverage.mjs`
Expected: lint clean; `example` count drops further (breadcrumb, context-menu, submenu-chev, dialog, overlay, popover, tip, h1, sub, label, muted now covered).

- [ ] **Step 5: Commit**

```bash
git add pages/navigation.html pages/feedback.html pages/foundations.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "docs: examples for breadcrumb/context-menu, dialog/popover/tip, type scale"
```

---

### Task 5: Author the split-pane and app-shell composite examples

These cover the remaining shell/composite primitives. They are larger; build them as compact static composites.

**Files:**
- Modify: `pages/patterns.html`, `pages/system.html`

- [ ] **Step 1: Add the split-pane example to patterns.html**

```html
<div class="example">
  <div class="example-preview">
    <div class="ds-resizable" style="height:160px;">
      <div class="ds-pane-first" style="width:160px;">
        <div class="ds-navi is-active">Inbox</div>
        <div class="ds-navi">Drafts</div>
      </div>
      <div class="ds-splitter" role="separator" aria-orientation="vertical"></div>
      <div class="ds-pane-rest" style="padding:12px;">Message body</div>
    </div>
  </div>
  <div class="example-caption">Resizable split: <code>.ds-resizable</code>, <code>.ds-pane-first</code>, <code>.ds-splitter</code>, <code>.ds-pane-rest</code>.</div>
</div>
```

(Match the exact pane/splitter markup the existing app-shell pattern on patterns.html uses — copy its inner structure so the preview renders correctly. The inline `height`/`width` styles bound the demo; keep them minimal.)

- [ ] **Step 2: Add the app-shell composite example to system.html**

```html
<div class="example">
  <div class="example-preview">
    <div style="border:1px solid var(--border); border-radius:var(--radius); overflow:hidden;">
      <div class="ds-titlebar">
        <div class="ds-winbtns"><span></span><span></span><span></span></div>
        <div>Atlas</div>
      </div>
      <div class="u-flex">
        <div class="ds-rail">
          <div class="ds-navi is-active">Home</div>
          <div class="ds-navi">Files</div>
        </div>
        <div class="u-flex-1">
          <div class="ds-toolbar"><span>Documents</span></div>
          <div style="padding:12px; min-height:60px;">Content</div>
          <div class="ds-statusbar"><span>Ready</span></div>
        </div>
      </div>
    </div>
  </div>
  <div class="example-caption">App-shell chrome: titlebar, window buttons, rail, toolbar, statusbar.</div>
</div>
```

(IMPORTANT: copy the real inner markup for `.ds-titlebar`, `.ds-winbtns`, `.ds-rail`, `.ds-navi`, `.ds-toolbar`, `.ds-statusbar` from the existing app-shell mock already present in system.html/patterns.html — reuse its exact child structure and class names rather than the simplified sketch above, so it renders faithfully. Use only `.ds-*`/`.u-*` classes that exist in the manifest; the `u-flex`/`u-flex-1` utilities must exist — if the page uses different layout utilities, use those.)

- [ ] **Step 3: Regenerate, lint, and verify the example backlog is clear**

Run: `npm run reference:build && npm run reference:lint && node tools/coverage.mjs`
Expected: lint clean. The `example` line now reads `example (primitive → docs example): ok` (every remaining primitive is covered or exempt). `renders` ok. `docs` skipped. Warn summary shows 0 alignment issues (or only the skipped docs line).

- [ ] **Step 4: Commit**

```bash
git add pages/patterns.html pages/system.html reference/manifest.json REFERENCE.md llms.txt
git commit -m "docs: split-pane and app-shell composite examples (clears example backlog)"
```

---

### Task 6: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the unit suite**

Run: `npx vitest run`
Expected: all tests pass (the new coverage exemption tests included).

- [ ] **Step 2: Run the full build**

Run: `npm run build`
Expected: exit 0 — `icons:check`, `reference:check` (manifest current, no drift), `reference:lint` (clean), `coverage:check` (example + renders ok, docs skipped), `vite build`, and `bundle` all succeed.

- [ ] **Step 3: Confirm the gate report**

Run: `node tools/coverage.mjs`
Expected: `story: ok`, `example: ok`, `renders: ok`, `docs: skipped`. Final line: `coverage:check passed — all layers aligned.` (Because docs is skipped, not a violation, the total is 0.)

---

## Notes for the implementer

- **Match existing markup over the sketches here.** Where a primitive already appears in a non-example showcase on its page (table, meter, dialog, app-shell parts), copy that page's real inner structure and class names into the new `.example` block instead of the simplified sketch — the sketches name the primitives to include, the page is the source of truth for exact sub-part markup.
- **Lint is the guardrail.** If `npm run reference:lint` reports an `unknown-class`, you used a class that isn't in the grammar — replace it with the real one from the manifest. Never invent classes.
- **Always regenerate + commit the reference artifacts** (`reference/manifest.json`, `REFERENCE.md`, `llms.txt`) in the same commit as the page/CSS change, or `reference:check` in `build` will fail on drift.
- **Do not flip the gate to `--strict`** — that is separate deferred work.
- The `ds-live` and `ds-drop-placeholder` exemptions are intentional; do not author examples for them.
