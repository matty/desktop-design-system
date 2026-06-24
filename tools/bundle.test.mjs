// Proves `tools/bundle.mjs` produced a complete offline release in dist/bundle/.
// Requires a prior `npm run build` (dist/ is gitignored). The release workflow
// runs this via `npm test` right after `npm run build`; locally, build first.
import { describe, it, expect, beforeAll } from "vitest";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundle = resolve(root, "dist/bundle");

// Every file bundle.mjs copies/writes by an explicit path. A broken copyFile
// source or a deleted upstream file must fail here, not ship a silent gap.
const CRITICAL_FILES = [
  "design-language.css",
  "design-language.min.css",
  "ds.js",
  "sortable.min.js",
  "icons/registry.json",
  "icons/approved.json",
  "icons/lucide-catalog.json",
  "icons/extend-icons.mjs",
  "icons/icon-core.mjs",
  "icons/icons.js",
  "reference-manifest.json",
  "REFERENCE.md",
  "llms.txt",
  "LLM_GUIDE.md",
  "lint-usage.mjs",
  "README.md",
  "THIRD_PARTY_LICENSES.md",
  "fonts/Sora-OFL.txt",
  "fonts/JetBrainsMono-OFL.txt",
  "VERSION",
  "manifest.json"
];

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(relative(bundle, p).split("\\").join("/"));
  }
  return out;
}

describe("offline bundle (dist/bundle)", () => {
  let bundleExists;
  beforeAll(async () => { bundleExists = await exists(bundle); });

  it("exists — run `npm run build` first if this fails", () => {
    expect(bundleExists, `dist/bundle missing — run \`npm run build\``).toBe(true);
  });

  it("contains every critical file, each non-empty", async () => {
    for (const rel of CRITICAL_FILES) {
      const p = resolve(bundle, rel);
      expect(await exists(p), `missing ${rel}`).toBe(true);
      const { size } = await stat(p);
      expect(size, `empty ${rel}`).toBeGreaterThan(0);
    }
  });

  it("ships the variable woff2 fonts esbuild emitted", async () => {
    const fonts = (await readdir(resolve(bundle, "fonts"))).filter((f) => f.endsWith(".woff2"));
    expect(fonts.length, "no .woff2 in fonts/").toBeGreaterThanOrEqual(2);
  });

  it("ships the Vue source layer without tests or type shims", async () => {
    const vue = await walk(resolve(bundle, "vue"));
    expect(vue).toContain("vue/index.ts");
    expect(vue.some((f) => f.startsWith("vue/components/Ds"))).toBe(true);
    // bundle.mjs filters these out — none must leak into the release.
    for (const f of vue) {
      expect(f.endsWith(".test.ts"), `leaked test ${f}`).toBe(false);
      expect(f.endsWith("env.d.ts"), `leaked shim ${f}`).toBe(false);
      expect(f.includes("__"), `leaked support file ${f}`).toBe(false);
    }
  });

  it("rewrites LLM-onboarding doc paths to the flattened bundle layout", async () => {
    for (const doc of ["llms.txt", "LLM_GUIDE.md"]) {
      const text = await readFile(resolve(bundle, doc), "utf8");
      // Repo-relative paths must not survive into the bundle — they don't resolve here.
      expect(text, `${doc} still has repo path reference/manifest.json`).not.toContain("reference/manifest.json");
      expect(text, `${doc} still has repo path tools/lint-usage.mjs`).not.toContain("tools/lint-usage.mjs");
      // The flattened equivalents that actually exist in the bundle.
      expect(text, `${doc} missing bundle path reference-manifest.json`).toContain("reference-manifest.json");
      expect(text, `${doc} missing bundle path lint-usage.mjs`).toContain("lint-usage.mjs");
    }
  });

  it("has a manifest that exactly matches the files on disk", async () => {
    const manifest = JSON.parse(await readFile(resolve(bundle, "manifest.json"), "utf8"));
    const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
    expect(manifest.name).toBe(pkg.name);
    expect(manifest.version).toBe(pkg.version);

    const onDisk = (await walk(bundle)).filter((f) => f !== "manifest.json").sort();
    const listed = [...manifest.files].sort();
    // Self-referential manifest can't catch a gap on its own; pin it to disk.
    expect(listed).toEqual(onDisk);
    expect(manifest.files, "manifest must not list itself").not.toContain("manifest.json");
  });
});
