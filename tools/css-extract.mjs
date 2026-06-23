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
