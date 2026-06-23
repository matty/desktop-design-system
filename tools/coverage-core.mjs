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

export function exampleCoverage({ primitives }) {
  return primitives
    .filter((p) => !p.examples || p.examples.length === 0)
    .map((p) => ({
      rule: "example",
      entity: p.name,
      detail: "no docs example in pages/*.html"
    }));
}

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
