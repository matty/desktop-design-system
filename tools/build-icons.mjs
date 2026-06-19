import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const approvedPath = resolve(root, "icons/approved.json");
const registryPath = resolve(root, "icons/registry.json");
const lucidePath = resolve(root, "node_modules/@iconify-json/lucide/icons.json");
const check = process.argv.includes("--check");

const approved = JSON.parse(await readFile(approvedPath, "utf8"));
const lucide = JSON.parse(await readFile(lucidePath, "utf8"));

function resolveIcon(iconName, seen = new Set()) {
  if (lucide.icons[iconName]) {
    return lucide.icons[iconName];
  }

  const alias = lucide.aliases?.[iconName];
  if (!alias) {
    return null;
  }

  if (seen.has(iconName)) {
    throw new Error(`Circular icon alias for ${iconName}`);
  }

  seen.add(iconName);
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
  if (collection !== "lucide") {
    throw new Error(`${localName} uses unsupported collection ${collection}`);
  }

  const icon = resolveIcon(iconName);
  if (!icon) {
    throw new Error(`Missing ${iconifyName} for local icon ${localName}`);
  }

  registry.icons[localName] = {
    iconify: iconifyName,
    body: icon.body
  };
}

const output = `${JSON.stringify(registry, null, 2)}\n`;

if (check) {
  const current = await readFile(registryPath, "utf8");
  if (current !== output) {
    throw new Error("icons/registry.json is out of date. Run npm run icons:build.");
  }
} else {
  await writeFile(registryPath, output);
}
