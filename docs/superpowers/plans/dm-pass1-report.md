# Dual-Mode Docs — Task 1 Pass Report

**Date:** 2026-06-23
**Task:** Transform core + node-html-parser dependency (Task 1 of dual-mode-docs plan)
**Status:** DONE

---

## node-html-parser Version Installed

**v8.0.3** (installed under `devDependencies` as required; confirmed not in `dependencies`).

---

## API Adjustments vs. the Plan's Reference Code

The plan's reference implementation was written against node-html-parser v6. v8.0.3 was installed. Two behavioral differences required a design change:

### 1. Self-closing tag re-serialization (critical)

**Problem:** node-html-parser v8 re-serializes ALL custom/unknown elements and SVG children as expanded tags:
- `<DsCombobox v-model="v" :options="opts" />` → `<DsCombobox v-model="v" :options="opts" ></DsCombobox>`
- `<path d="M1 1"/>` → `<path d="M1 1"></path>`

This affects two tests:
- *"vue snippet escaped and trimmed"* — expects `/&gt;` not `&gt;&lt;/DsCombobox&gt;`
- *"collapses svgs in the HTML panel but not in the live preview"* — expects `<path d="M1 1"/>` in the preview panel

**Root cause:** `set_content(innerStr)` re-parses `innerStr` through node-html-parser's DOM, normalizing all tags. Then `root.toString()` serializes from the AST, losing original slash syntax.

**Fix:** Abandoned DOM mutation entirely. Instead:
1. Use node-html-parser **only as a locator** — find nodes and read their `.range` property (`[startOffset, endOffset]` in the source string).
2. Extract raw source with `html.slice(node.range[0], node.range[1])` — preserves the original characters verbatim.
3. Build replacement strings from those raw slices.
4. Apply replacements to the original source string in **reverse offset order** (so earlier offsets remain valid), never touching the AST serializer.

This means `set_content`, `setAttribute`, and `root.toString()` are **not used** in the final implementation.

### 2. `template[data-vue]` innerHTML — same root cause

The plan's `tpl.innerHTML` would have returned the re-serialized form. The raw-slice approach (`rawInner(html, tpl)`) correctly returns `\n<DsCombobox v-model="v" :options="opts" />\n`, which after `.trim()` and `escapeHtml()` produces the expected `&lt;DsCombobox v-model="v" :options="opts" /&gt;`.

### 3. Methods that DID work as expected in v8.0.3

- `parse(html, { comment: true })` — works, comment nodes preserved
- `querySelectorAll(".example")` — works
- `querySelector(".example-preview")`, `querySelector("template[data-vue]")`, `querySelector(".example-caption")` — all work, including attribute selector
- `ex.classList.contains("has-code")` — works
- `node.range` — present and correct, returns `[start, end]` byte offsets into the source string
- `node.rawTagName` — present; gives the original case tag name (e.g. `"div"`, `"template"`)

---

## Final Implementation Summary

`tools/inject-examples.mjs` exports:
- `escapeHtml(s)` — replaces `&`, `<`, `>` with HTML entities (as per plan)
- `collapseSvgs(s)` — regex-replaces `<svg…</svg>` with `<svg><!-- icon --></svg>` (as per plan)
- `transformExamples(html)` — uses node-html-parser to locate `.example` nodes, extracts raw source via `.range`, builds replacement strings, applies them in reverse order; never calls `set_content`/`toString()` on modified AST

---

## Final Test Output

```
 ✓ tools/inject-examples.test.mjs (8 tests) 10ms

 Test Files  1 passed (1)
       Tests  8 passed (8)
    Start at  20:04:28
    Duration  1.03s (transform 27ms, setup 0ms, collect 97ms, tests 10ms, environment 546ms, prepare 120ms)
```

All 8 tests pass.

---

## Commit History (85af091..HEAD)

```
91f96be feat(docs): example transform core (Preview/HTML/Vue tabs) + node-html-parser
```

---

## Notes for Future Tasks

**Task 2 (Vite plugin wiring):** `transformExamples(html)` is a pure string→string function; wiring into `transformIndexHtml` is straightforward. No special handling needed.

**Task 4 (author Vue snippets):** The `<template data-vue>` content in source pages must use Vue self-closing syntax (`<DsCombobox … />`) if that's what should appear in the code tab. The transform preserves it verbatim from source.

**Task 6 (build assertions):** The no-`<template` leak assertion will pass because the transform removes the entire example element's original markup (including any template tags) and replaces it with the generated HTML that never contains `<template` or `data-vue`.

**General:** For any future use of node-html-parser to write/mutate HTML, avoid `set_content` + `toString()` if the content includes self-closing custom elements or void-like SVG children — the re-serialization will break the output. The range-based slicing pattern in `inject-examples.mjs` is the reliable approach.

---

## Robustness Fixes — Pass 2 (2026-06-23, commit a9c7008)

### Fix 1 — Quote-aware opening-tag-end detection (`rawInner` helper)

**Problem:** `rawInner` used `outer.indexOf(">") + 1` to find the end of the opening tag. If an attribute value contains a `>` character (e.g. `data-x="a>b"`), the first `>` found is inside the quoted value, not the actual tag end, causing the inner content extraction to start mid-attribute and corrupt output.

**Before (line 23):**
```js
const tagEnd = outer.indexOf(">") + 1;
```

**After:** A `findOpenTagEnd(outer)` helper walks the string tracking `"..."` / `'...'` quote state and returns the index of the first `>` that is NOT inside any quoted string:
```js
function findOpenTagEnd(outer) {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < outer.length; i++) {
    const ch = outer[i];
    if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
    if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
    if (ch === ">" && !inSingle && !inDouble) return i + 1;
  }
  return -1;
}
// rawInner now uses:
const tagEnd = findOpenTagEnd(outer);
if (tagEnd === -1) return "";
```

The original source string (`rawOuter`) is still used — no node-html-parser re-serialization.

---

### Fix 2 — Skip nested `.example` nodes (top-level-only processing)

**Problem:** `querySelectorAll(".example")` returns all matching descendants, including ones nested inside another `.example`. Processing both parent and child applies reverse-offset splices on stale offsets, corrupting output. Nested examples are also semantically nonsensical.

**Before:** No guard; every `.example` found by querySelectorAll was processed.

**After:** Added an ancestor-walk guard immediately after the `has-code` skip:
```js
let ancestor = ex.parentNode;
let isNested = false;
while (ancestor) {
  if (ancestor.classList && ancestor.classList.contains("example")) {
    isNested = true;
    break;
  }
  ancestor = ancestor.parentNode;
}
if (isNested) continue;
```

---

### New Tests Added

Four new tests added to `tools/inject-examples.test.mjs`:

1. **Two sibling `.example` blocks** — asserts both become `example has-code`, each gets its own HTML panel div, and escaped markup for button "A" and "B" appears in separate positions with no bleed.

2. **Nested `<template #slot>` inside `data-vue`** — a `<template data-vue>` whose body contains `<DsSplitter>` with `<template #left>` and `<template #right>` children. Asserts the Vue panel contains the full inner markup including nested templates, that `data-vue` and `<template` do not leak to output. Pins that `rawInner` uses the outer `</template>` close, not the first inner one.

3. **Skip nested `.example` nodes** — a `.example` containing a child `.example` inside its preview; asserts exactly one `example has-code` in output (the outer one only).

4. **SVG in preview AND `data-vue`** — asserts svg is collapsed/escaped in HTML panel, real svg path preserved in live preview, and Vue panel is present with the snippet.

---

### Full Vitest Output

```
 ✓ tools/inject-examples.test.mjs (12 tests) 13ms

 Test Files  1 passed (1)
       Tests  12 passed (12)
    Start at  20:12:43
    Duration  953ms (transform 27ms, setup 0ms, collect 96ms, tests 13ms, environment 472ms, prepare 121ms)
```

All 8 prior tests continue to pass; 4 new tests added and passing.

---

### Commit

`a9c7008` — `fix(docs): quote-aware tag scan + skip nested examples in transform core`
