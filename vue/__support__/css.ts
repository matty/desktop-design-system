import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error - plain JS module shared with the Node tools (no .d.ts)
import { extractClassNames } from "../../tools/css-extract.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(here, "../../css/components.css");

let cache: Set<string> | null = null;

export function cssClasses(): Set<string> {
  if (cache) return cache;
  cache = new Set(extractClassNames(readFileSync(cssPath, "utf8")));
  return cache;
}

export function cssHas(cls: string): boolean {
  return cssClasses().has(cls.replace(/^\./, ""));
}
