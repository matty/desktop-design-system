import { extractClassNames } from "./css-extract.mjs";

// --- tokens -------------------------------------------------------------
const TOKEN_RE = /(--[a-z][a-z0-9-]*)\s*:\s*([^;]+);/g;

export function extractTokens(tokensCss) {
  const seen = new Map();
  for (const m of tokensCss.matchAll(TOKEN_RE)) {
    const name = m[1];
    // De-duplicate: first definition wins (base theme values take precedence over theme overrides).
    if (!seen.has(name)) seen.set(name, { name, value: m[2].trim(), description: "" });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
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

// Detect the primary recipe prefix used in the patterns CSS.
// Falls back to "p-" if no clear non-ds/u/is prefix is found (e.g. for test fixtures).
function detectPatternPrefix(classes) {
  const counts = new Map();
  for (const c of classes) {
    if (c.startsWith("ds-") || c.startsWith("u-") || c.startsWith("is-")) continue;
    const dash = c.indexOf("-");
    if (dash < 1) continue;
    const prefix = c.slice(0, dash + 1); // e.g. "ptn-" or "p-"
    counts.set(prefix, (counts.get(prefix) || 0) + 1);
  }
  if (counts.size === 0) return "p-";
  // Return the most-frequent prefix; alphabetical secondary key keeps ties deterministic.
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
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
  const utilClasses = extractClassNames(utilities);
  const utilitiesOut = utilClasses
    .filter((c) => c.startsWith("u-"))
    .map((name) => ({ name, type: "utility", category: utilCats.get(name) || "", description: "", examples: [] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Collect is-* states from both components.css and utilities.css (de-duped).
  const utilStates = utilClasses.filter((c) => c.startsWith("is-"));
  const allStates = [...new Set([...states, ...utilStates])];
  const statesOut = allStates
    .map((name) => ({ name, type: "state", description: "", examples: [] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Detect the recipe prefix actually used in patterns.css (may be "ptn-", "p-", etc.)
  const patAllClasses = extractClassNames(patterns);
  const patPrefix = detectPatternPrefix(patAllClasses);

  const patCats = categoryByClass(patterns);
  const patternsOut = patAllClasses
    .filter((c) => c.startsWith(patPrefix))
    .map((name) => ({ name, type: "pattern", category: patCats.get(name) || "", description: "", examples: [] }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { primitives, utilities: utilitiesOut, states: statesOut, patterns: patternsOut };
}

// --- example extraction -------------------------------------------------

// Collapse <svg ...>...</svg> (including self-closing) to a stable placeholder.
function collapseSvgs(markup) {
  return markup
    .replace(/<svg\b[\s\S]*?<\/svg>/g, "<svg><!-- icon --></svg>")
    .replace(/<svg\b[^>]*\/>/g, "<svg><!-- icon --></svg>");
}

// Extract the inner content of every <div class="example-preview..."> block.
// Uses div-depth counting so nested divs are handled correctly.
function extractPreviewBlocks(html) {
  const blocks = [];
  const previewRe = /<div class="example-preview[^"]*">/g;

  let m;
  previewRe.lastIndex = 0;
  while ((m = previewRe.exec(html)) !== null) {
    // position after the opening tag
    const contentStart = m.index + m[0].length;
    let depth = 1;
    let pos = contentStart;
    while (depth > 0 && pos < html.length) {
      const nextOpen = html.indexOf("<div", pos);
      const nextClose = html.indexOf("</div>", pos);
      const oIdx = nextOpen === -1 ? Infinity : nextOpen;
      const cIdx = nextClose === -1 ? Infinity : nextClose;
      if (oIdx < cIdx) {
        depth++;
        pos = oIdx + 4;
      } else if (cIdx < Infinity) {
        depth--;
        pos = cIdx + 6;
      } else {
        break;
      }
    }
    // pos now points to just after the closing </div>; content ends before last </div>
    const contentEnd = pos - 6; // subtract len("</div>")
    blocks.push(html.slice(contentStart, contentEnd));
  }
  return blocks;
}

export function extractExamples(htmlDocs) {
  const byClass = {};
  const patterns = [];
  for (const { html } of htmlDocs) {
    for (const inner of extractPreviewBlocks(html)) {
      const markup = collapseSvgs(inner.trim()).replace(/\s+\n/g, "\n").trim();
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

// Extract ds-* class names from SFC template HTML (class="..." attribute values).
function templateDsClasses(tpl) {
  const set = new Set();
  for (const m of tpl.matchAll(/class="([^"]*)"/g)) {
    for (const c of m[1].split(/\s+/)) {
      if (c.startsWith("ds-")) set.add(c);
    }
  }
  return [...set].sort();
}

// --- component assembly -------------------------------------------------
export function assembleComponents(rawMeta, sfcSource) {
  return rawMeta.map((c) => {
    const src = sfcSource[c.name] || "";
    const tpl = (src.match(/<template>([\s\S]*?)<\/template>/) || [, ""])[1];
    const renders = templateDsClasses(tpl);
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

// --- modes --------------------------------------------------------------
export function extractModes() {
  return [
    { name: "data-density", type: "mode", values: ["comfortable", "compact"], description: "" },
    { name: "data-theme", type: "mode", values: ["dark", "light"], description: "" }
  ];
}

// --- manifest assembly --------------------------------------------------
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
    L.push(c.description || "_(no description yet)_", "", "```ts", c.import, "```");
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
