#!/usr/bin/env node
// Offline icon-registry generator shipped in the design-language bundle.
// Reads ./approved.json + ./lucide-catalog.json (next to this script) and
// writes ./registry.json. No network, no npm install. Shares logic with the
// repo generator via ./icon-core.mjs (which also ships in the bundle).
//
// Usage (inside the bundle's icons/ folder):
//   1. Add entries inside the "icons" object of approved.json, e.g. "rocket": "lucide:rocket"
//   2. node extend-icons.mjs
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRegistry } from "./icon-core.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const approved = JSON.parse(await readFile(resolve(here, "approved.json"), "utf8"));
const lucide = JSON.parse(await readFile(resolve(here, "lucide-catalog.json"), "utf8"));
const registry = buildRegistry(approved, lucide);
await writeFile(resolve(here, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Wrote registry.json with ${Object.keys(registry.icons).length} icons.`);
