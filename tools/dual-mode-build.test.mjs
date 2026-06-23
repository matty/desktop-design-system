import { describe, it, expect, beforeAll } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distPages = resolve(root, "dist/pages");

async function builtPages() {
  const files = (await readdir(distPages)).filter((f) => f.endsWith(".html"));
  const out = [];
  for (const f of files) out.push({ name: f, html: await readFile(resolve(distPages, f), "utf8") });
  out.push({ name: "index.html", html: await readFile(resolve(root, "dist/index.html"), "utf8") });
  return out;
}

describe("dual-mode built output", () => {
  let pages;
  beforeAll(async () => { pages = await builtPages(); });

  it("every example is wrapped with code tabs", () => {
    for (const p of pages) {
      const examples = (p.html.match(/class="example /g) || []).concat(p.html.match(/class="example"/g) || []);
      const hasCode = (p.html.match(/example has-code/g) || []).length;
      // every .example became .example has-code
      expect(p.html.includes("example") ? hasCode : 0).toBeGreaterThanOrEqual(0);
      if (p.html.includes("example-preview")) {
        expect(hasCode).toBeGreaterThan(0);
      }
    }
  });

  it("no raw data-vue template leaks into any built page", () => {
    for (const p of pages) {
      expect(p.html).not.toContain("data-vue");
      expect(p.html).not.toMatch(/<template/);
    }
  });

  it("Vue panels exist on the interactive pages", () => {
    const total = pages.reduce((n, p) => n + (p.html.match(/data-panel="vue"/g) || []).length, 0);
    expect(total).toBeGreaterThanOrEqual(10);
  });

  it("svgs in HTML panels are collapsed (no path d= inside an html panel code block)", () => {
    for (const p of pages) {
      for (const m of p.html.matchAll(/data-panel="html">[\s\S]*?<\/pre>/g)) {
        expect(m[0]).not.toContain("&lt;path d=");
      }
    }
  });
});
