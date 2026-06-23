import { readFile, glob } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  storyCoverage,
  exampleCoverage,
  rendersCoverage,
  docsCoverage
} from "./coverage-core.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

async function loadManifest() {
  const candidates = [
    resolve(root, "reference/manifest.json"),
    resolve(dirname(fileURLToPath(import.meta.url)), "reference-manifest.json")
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(await readFile(p, "utf8"));
    } catch {
      // try next
    }
  }
  console.error("coverage: could not find reference/manifest.json — run npm run reference:build first.");
  process.exit(2);
}

async function gatherStoryNames() {
  const names = [];
  for await (const entry of glob("vue/components/*.stories.ts", { cwd: root })) {
    names.push(basename(entry).replace(/\.stories\.ts$/, ""));
  }
  return names;
}

async function gatherPageSources() {
  const sources = [];
  for await (const entry of glob("pages/*.html", { cwd: root })) {
    sources.push(await readFile(resolve(root, entry), "utf8"));
  }
  sources.push(await readFile(resolve(root, "index.html"), "utf8"));
  return sources;
}

function report(title, violations) {
  if (!violations.length) {
    console.log(`  ${title}: ok`);
    return;
  }
  console.warn(`  ${title}: ${violations.length} issue(s)`);
  for (const v of violations) console.warn(`    - ${v.entity}: ${v.detail}`);
}

async function main() {
  const manifest = await loadManifest();
  const components = manifest.components || [];
  const primitives = manifest.primitives || [];

  const storyNames = await gatherStoryNames();
  const pageSources = await gatherPageSources();

  const story = storyCoverage({ components, storyNames });
  const example = exampleCoverage({ primitives });
  const renders = rendersCoverage({ components, primitives });
  const docs = docsCoverage({ components, pageSources });

  console.log("coverage:check —");
  report("story (component → .stories.ts)", story);
  report("example (primitive → docs example)", example);
  report("renders (component → primitive)", renders);
  if (docs.skipped) {
    console.log(`  docs (component → data-vue): skipped — ${docs.reason}`);
  } else {
    report("docs (component → data-vue)", docs.violations);
  }

  const all = [...story, ...example, ...renders, ...docs.violations];
  const total = all.length;
  if (!total) {
    console.log("coverage:check passed — all layers aligned.");
    return;
  }
  if (strict) {
    console.error(`\ncoverage:check --strict: failing on ${total} alignment issue(s).`);
    process.exit(1);
  }
  console.warn(`\ncoverage:check — ${total} alignment issue(s) (warn-only; pass --strict to fail the build).`);
}

const selfPath = fileURLToPath(import.meta.url);
const argPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (selfPath === argPath) {
  main();
}
