// Build the offline release bundle into dist/bundle/.
// Run after `vite build`. CI zips dist/bundle + publishes a SHA-256.
import { build } from "esbuild";
import { rm, mkdir, readFile, writeFile, readdir, copyFile } from "node:fs/promises";
import { dirname, resolve, relative, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "dist/bundle");
const pkg = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const lucide = JSON.parse(await readFile(resolve(root, "node_modules/@iconify-json/lucide/icons.json"), "utf8"));

await rm(out, { recursive: true, force: true });
await mkdir(resolve(out, "fonts"), { recursive: true });
await mkdir(resolve(out, "icons"), { recursive: true });

// 1. App CSS — esbuild bundles the @import chain and copies woff2 with stable names.
const cssOpts = {
  entryPoints: [resolve(root, "src/design-language.css")],
  bundle: true,
  loader: { ".woff2": "file" },
  assetNames: "fonts/[name]",
  logLevel: "warning"
};
await build({ ...cssOpts, outfile: resolve(out, "design-language.css") });
await build({ ...cssOpts, outfile: resolve(out, "design-language.min.css"), minify: true });

// 2. Component-runtime JS (docs.js is NOT shipped).
await copyFile(resolve(root, "js/ds.js"), resolve(out, "ds.js"));
await copyFile(resolve(root, "js/vendor/sortable.min.js"), resolve(out, "sortable.min.js"));

// 3. Icons: curated registry + approved map + full offline catalog + generator + helper.
await copyFile(resolve(root, "icons/registry.json"), resolve(out, "icons/registry.json"));
await copyFile(resolve(root, "icons/approved.json"), resolve(out, "icons/approved.json"));
await copyFile(resolve(root, "node_modules/@iconify-json/lucide/icons.json"), resolve(out, "icons/lucide-catalog.json"));
await copyFile(resolve(root, "tools/extend-icons.mjs"), resolve(out, "icons/extend-icons.mjs"));
await copyFile(resolve(root, "tools/icon-core.mjs"), resolve(out, "icons/icon-core.mjs"));
await copyFile(resolve(root, "icons/icons.js"), resolve(out, "icons/icons.js"));

// 4. Docs, licenses, version.
await copyFile(resolve(root, "tools/bundle-readme.md"), resolve(out, "README.md"));
const licenses = (await readFile(resolve(root, "THIRD_PARTY_LICENSES.md"), "utf8"))
  .replaceAll("assets/fonts/", "fonts/");
await writeFile(resolve(out, "THIRD_PARTY_LICENSES.md"), licenses);
await copyFile(resolve(root, "assets/fonts/Sora-OFL.txt"), resolve(out, "fonts/Sora-OFL.txt"));
await copyFile(resolve(root, "assets/fonts/JetBrainsMono-OFL.txt"), resolve(out, "fonts/JetBrainsMono-OFL.txt"));
await writeFile(resolve(out, "VERSION"), `${pkg.version}\n`);

// 5. Manifest — list every file except manifest.json itself.
async function walk(dir) {
  const ents = await readdir(dir, { withFileTypes: true });
  const out2 = [];
  for (const e of ents) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out2.push(...await walk(p));
    else out2.push(relative(out, p).split("\\").join("/"));
  }
  return out2;
}
const files = (await walk(out)).sort();
const manifest = {
  name: pkg.name,
  version: pkg.version,
  generated: true,
  lucideCatalogVersion: lucide.lastModified ?? null,
  files
};
await writeFile(resolve(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Bundle written to dist/bundle (${files.length + 1} files).`);
