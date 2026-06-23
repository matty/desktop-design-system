import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "vue-component-meta";

// vue-component-meta v2.2.x is CommonJS; named exports via destructuring.
const { createChecker } = pkg;

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

// Names exported from vue/index.ts that look like components (Ds*).
export function componentNames(indexSrc) {
  return [...indexSrc.matchAll(/export \{ default as (Ds[A-Za-z0-9]+) \}/g)]
    .map((m) => m[1])
    .sort();
}

export function collectComponentMeta({
  tsconfigPath = resolve(root, "tsconfig.json"),
  indexPath = resolve(root, "vue/index.ts"),
  componentsDir = resolve(root, "vue/components")
} = {}) {
  const indexSrc = readFileSync(indexPath, "utf8");
  const names = componentNames(indexSrc);
  const checker = createChecker(tsconfigPath, { forceUseTs: true, printer: { newLine: 1 } });

  // Filter out global/internal props: HTML global attrs (global flag), event handlers,
  // and Vue reserved names (key, ref, class, style).
  const isPublic = (p) =>
    !p.global && !/^(on[A-Z]|key|ref|class|style)/.test(p.name);

  return names.map((name) => {
    const file = join(componentsDir, `${name}.vue`);
    const meta = checker.getComponentMeta(file);
    return {
      name,
      file: `${name}.vue`,
      props: meta.props
        .filter(isPublic)
        .map((p) => ({
          name: p.name,
          type: p.type,
          default: p.default !== undefined ? String(p.default) : "undefined",
          required: !!p.required
        })),
      events: meta.events.map((e) => ({
        name: e.name,
        type: e.type
      })),
      slots: meta.slots.map((s) => ({
        name: s.name
      }))
    };
  });
}
