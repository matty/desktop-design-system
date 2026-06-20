// Shared icon-registry builder used by tools/build-icons.mjs (repo) and the
// shipped tools/extend-icons.mjs. Keeping the logic here prevents the two
// generators from silently diverging. Pure: callers load the JSON.
export function resolveIcon(lucide, name, seen = new Set()) {
  if (lucide.icons[name]) return lucide.icons[name];
  const alias = lucide.aliases?.[name];
  if (!alias) return null;
  if (seen.has(name)) throw new Error(`Circular icon alias for ${name}`);
  seen.add(name);
  return resolveIcon(lucide, alias.parent, seen);
}

export function buildRegistry(approved, lucide) {
  const registry = {
    source: {
      catalog: "Iconify",
      collection: "lucide",
      license: approved.source.license,
      runtimeNetwork: false,
      generated: true,
      lucideLastModified: lucide.lastModified ?? null
    },
    style: {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 2
    },
    icons: {}
  };
  for (const [localName, iconifyName] of Object.entries(approved.icons)) {
    const [collection, iconName] = iconifyName.split(":");
    if (collection !== "lucide") throw new Error(`${localName} uses unsupported collection ${collection}`);
    const icon = resolveIcon(lucide, iconName);
    if (!icon) throw new Error(`Missing ${iconifyName} for local icon ${localName}`);
    registry.icons[localName] = { iconify: iconifyName, body: icon.body };
  }
  return registry;
}
