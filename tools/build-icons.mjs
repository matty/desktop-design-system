import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRegistry } from "./icon-core.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const approvedPath = resolve(root, "icons/approved.json");
const registryPath = resolve(root, "icons/registry.json");
const lucidePath = resolve(root, "node_modules/@iconify-json/lucide/icons.json");
const check = process.argv.includes("--check");

const approved = JSON.parse(await readFile(approvedPath, "utf8"));
const lucide = JSON.parse(await readFile(lucidePath, "utf8"));
const output = `${JSON.stringify(buildRegistry(approved, lucide), null, 2)}\n`;

if (check) {
  const current = await readFile(registryPath, "utf8");
  if (current !== output) throw new Error("icons/registry.json is out of date. Run npm run icons:build.");
  console.log("icons:check passed — registry.json is current.");
} else {
  await writeFile(registryPath, output);
  console.log("Wrote icons/registry.json.");
}
