import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(here, "../../css/components.css");

let cache: Set<string> | null = null;

export function cssClasses(): Set<string> {
  if (cache) return cache;
  const css = readFileSync(cssPath, "utf8");
  const set = new Set<string>();
  for (const m of css.matchAll(/\.([a-z][a-z0-9-]*)/g)) set.add(m[1]);
  cache = set;
  return set;
}

export function cssHas(cls: string): boolean {
  return cssClasses().has(cls.replace(/^\./, ""));
}
