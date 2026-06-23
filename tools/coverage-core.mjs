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
