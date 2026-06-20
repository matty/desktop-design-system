#!/usr/bin/env node
// Offline icon-registry generator shipped in the design-language bundle.
// Reads ./approved.json and ./lucide-catalog.json (next to this script) and
// writes ./registry.json. No network and no npm install required.
//
// Usage (inside the bundle's icons/ folder):
//   1. Add entries to approved.json, e.g. "rocket": "lucide:rocket"
//   2. node extend-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const approved = JSON.parse(await readFile(resolve(here, "approved.json"), "utf8"));
const lucide = JSON.parse(await readFile(resolve(here, "lucide-catalog.json"), "utf8"));

function resolveIcon(name, seen = new Set()) {
  if (lucide.icons[name]) return lucide.icons[name];
  const alias = lucide.aliases?.[name];
  if (!alias) return null;
  if (seen.has(name)) throw new Error(`Circular icon alias for ${name}`);
  seen.add(name);
  return resolveIcon(alias.parent, seen);
}

const registry = {
  source: {
    catalog: "Iconify",
    collection: "lucide",
    license: approved.source.license,
    runtimeNetwork: false,
    generated: true
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
  const icon = resolveIcon(iconName);
  if (!icon) throw new Error(`Missing ${iconifyName} for local icon ${localName}`);
  registry.icons[localName] = { iconify: iconifyName, body: icon.body };
}

await writeFile(resolve(here, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Wrote registry.json with ${Object.keys(registry.icons).length} icons.`);
