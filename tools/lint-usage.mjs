import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "node:fs/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Only validate classes that belong to our grammar.
// Patterns use the ptn- prefix (not p-), so we match: ds-, u-, is-, ptn-
// Excluding p- avoids false positives on consumer utility classes like p-4, p-something.
const OURS = /^(ds|u|is|ptn)-/;

function knownClassSet(manifest) {
  const s = new Set();
  for (const g of ["primitives", "utilities", "states", "patterns"]) {
    for (const it of manifest[g] || []) {
      s.add(it.name);
      // Also include sub-parts (e.g. ds-btn-group under ds-btn) and states
      // attached to primitives — all are valid classes in the grammar.
      for (const sp of it.subParts || []) s.add(sp);
    }
  }
  return s;
}

// Normalize a kebab-case HTML attribute name to camelCase prop name.
function toCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function lint({ files, manifest }) {
  const known = knownClassSet(manifest);
  const components = new Map(
    (manifest.components || []).map((c) => [c.name, new Set((c.props || []).map((p) => p.name))])
  );
  const errors = [];

  for (const f of files) {
    // Check class="..." tokens (works for both HTML and Vue static class bindings).
    for (const m of f.source.matchAll(/class="([^"]*)"/g)) {
      for (const c of m[1].split(/\s+/).filter(Boolean)) {
        if (OURS.test(c) && !known.has(c)) {
          errors.push({ file: f.name, kind: "unknown-class", name: c });
        }
      }
    }

    if (f.kind === "vue") {
      // Find component tags: <DsX ...> or <DsX ... /> — match opening tags only.
      for (const m of f.source.matchAll(/<(Ds[A-Za-z0-9]+)((?:[^>]|\n)*?)\/?>/g)) {
        const name = m[1];
        if (!components.has(name)) {
          errors.push({ file: f.name, kind: "unknown-component", name });
          continue;
        }
        const props = components.get(name);
        const attrStr = m[2];
        // Match attribute names that have a value (attr="..." or :attr="..." or v-bind:attr="...").
        for (const pm of attrStr.matchAll(/(?:^|\s)((?:v-bind:|:)?[a-zA-Z][a-zA-Z0-9-]*)=/g)) {
          const raw = pm[1];
          // Skip Vue directives (v-*), event listeners (@), and standard framework attrs.
          if (
            raw.startsWith("v-") ||
            raw.startsWith("@") ||
            raw.startsWith(":") ||
            /^(key|ref|class|style|is)$/.test(raw)
          ) continue;
          // If it's a bound prop like :attr or v-bind:attr, the raw has that prefix — strip it.
          const attr = raw.replace(/^(?:v-bind:|:)/, "");
          const camel = toCamel(attr);
          if (!props.has(attr) && !props.has(camel)) {
            errors.push({ file: f.name, kind: "unknown-prop", name: `${name}.${attr}` });
          }
        }
      }
    }
  }

  return errors;
}

// --- CLI ----------------------------------------------------------------
async function main() {
  const patterns = process.argv.slice(2);
  if (!patterns.length) {
    console.error("usage: node tools/lint-usage.mjs \"<glob>\" [...]");
    process.exit(2);
  }

  // Load manifest — try the repo path, then the bundle fallback path.
  let manifestJson;
  const repoPaths = [
    resolve(root, "reference/manifest.json"),
    resolve(dirname(fileURLToPath(import.meta.url)), "reference-manifest.json")
  ];
  for (const p of repoPaths) {
    try {
      manifestJson = await readFile(p, "utf8");
      break;
    } catch {
      // try next
    }
  }
  if (!manifestJson) {
    console.error("lint-usage: could not find reference/manifest.json");
    process.exit(2);
  }
  const manifest = JSON.parse(manifestJson);

  const files = [];
  for (const pat of patterns) {
    for await (const entry of glob(pat, { cwd: process.cwd() })) {
      const kind = entry.endsWith(".vue") ? "vue" : "html";
      files.push({ name: entry, kind, source: await readFile(entry, "utf8") });
    }
  }

  const errors = lint({ files, manifest });
  if (errors.length) {
    for (const e of errors) console.error(`${e.file}: ${e.kind} '${e.name}'`);
    console.error(`\nlint-usage: ${errors.length} problem(s).`);
    process.exit(1);
  }
  console.log(`lint-usage: ${files.length} file(s) clean.`);
}

// Run as CLI only when invoked directly.
const selfPath = fileURLToPath(import.meta.url);
const argPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (selfPath === argPath) {
  main();
}
