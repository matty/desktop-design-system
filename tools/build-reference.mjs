import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as core from "./reference-core.mjs";
import { collectComponentMeta, componentNames } from "./component-meta.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const strict = process.argv.includes("--strict");
const r = (p) => resolve(root, p);

async function buildOutputs() {
  const pkg = JSON.parse(await readFile(r("package.json"), "utf8"));
  const tokens = core.extractTokens(await readFile(r("css/tokens.css"), "utf8"));
  const cssSurface = core.extractCssSurface({
    components: await readFile(r("css/components.css"), "utf8"),
    utilities: await readFile(r("css/utilities.css"), "utf8"),
    patterns: await readFile(r("css/patterns.css"), "utf8")
  });
  const modes = core.extractModes();

  const docFiles = [
    "index.html",
    ...(await readdir(r("pages"))).filter((f) => f.endsWith(".html")).map((f) => `pages/${f}`)
  ];
  const htmlDocs = await Promise.all(
    docFiles.map(async (p) => ({ name: p, html: await readFile(r(p), "utf8") }))
  );
  const examples = core.extractExamples(htmlDocs);

  const indexSrc = await readFile(r("vue/index.ts"), "utf8");
  const names = componentNames(indexSrc);
  const sfcSource = Object.fromEntries(
    names.map((n) => [n, readFileSync(r(`vue/components/${n}.vue`), "utf8")])
  );
  const rawMeta = collectComponentMeta();
  const components = core.assembleComponents(rawMeta, sfcSource);

  const registry = JSON.parse(await readFile(r("icons/registry.json"), "utf8"));
  const icons = {
    count: Object.keys(registry.icons || {}).length,
    source: "icons/registry.json",
    approved: "icons/approved.json"
  };

  const descriptions = JSON.parse(await readFile(r("docs/reference/descriptions.json"), "utf8"));
  const manifest = core.buildManifest({
    version: pkg.version,
    tokens,
    cssSurface,
    modes,
    components,
    examples,
    descriptions,
    icons
  });

  // Guide text: pass the relevant rules sections to renderLlmsTxt.
  // If LLM_GUIDE.md has a "## Class Rules" section, use from there to end of that section.
  // Defensive: if the slice is awkward, fall back to the full guide.
  const guide = await readFile(r("LLM_GUIDE.md"), "utf8");
  let guideText = guide;
  const classRulesIdx = guide.indexOf("## Class Rules");
  if (classRulesIdx !== -1) {
    // Find where the rules content ends — at the first "## Good Example" or "## Generated Reference"
    const afterRules = guide.slice(classRulesIdx);
    const goodExampleIdx = afterRules.search(/^## Good Example/m);
    const genRefIdx = afterRules.search(/^## Generated Reference/m);
    const stopIdx = Math.min(
      goodExampleIdx === -1 ? Infinity : goodExampleIdx,
      genRefIdx === -1 ? Infinity : genRefIdx
    );
    guideText = stopIdx === Infinity ? afterRules : afterRules.slice(0, stopIdx).trimEnd();
  }

  return {
    manifest,
    manifestJson: JSON.stringify(manifest, null, 2) + "\n",
    referenceMd: core.renderReferenceMd(manifest),
    llmsTxt: core.renderLlmsTxt(manifest, guideText)
  };
}

const built = await buildOutputs();
const targets = [
  ["reference/manifest.json", built.manifestJson],
  ["REFERENCE.md", built.referenceMd],
  ["llms.txt", built.llmsTxt]
];

if (check) {
  let drift = false;
  for (const [p, content] of targets) {
    const current = await readFile(r(p), "utf8").catch(() => null);
    if (current !== content) {
      drift = true;
      console.error(`DRIFT: ${p} is out of date. Run npm run reference:build.`);
    }
  }
  if (drift) process.exit(1);
  const gaps = core.coverageGaps(built.manifest);
  if (gaps.length) {
    console.warn(`reference:check — ${gaps.length} item(s) missing a description:`);
    console.warn("  " + gaps.join(", "));
    if (strict) {
      console.error("reference:check --strict: failing on description gaps.");
      process.exit(1);
    }
  } else {
    console.log("reference:check — all surface items have descriptions.");
  }
  console.log("reference:check passed — outputs are current.");
} else {
  // Ensure the reference/ directory exists before writing.
  await mkdir(r("reference"), { recursive: true });
  for (const [p, content] of targets) await writeFile(r(p), content);
  console.log("Wrote reference/manifest.json, REFERENCE.md, llms.txt.");
}
