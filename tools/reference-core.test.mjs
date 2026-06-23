import { describe, it, expect } from "vitest";
import { extractTokens, extractCssSurface, extractModes, extractExamples, assembleComponents, buildManifest, coverageGaps, renderReferenceMd, renderLlmsTxt } from "./reference-core.mjs";

describe("extractTokens", () => {
  it("parses --name: value with descriptions empty", () => {
    const css = ":root {\n  --bg: #0c0d0e;\n  --accent: rgba(255,255,255,.07);\n}";
    expect(extractTokens(css)).toEqual([
      { name: "--accent", value: "rgba(255,255,255,.07)", description: "" },
      { name: "--bg", value: "#0c0d0e", description: "" }
    ]);
  });
});

describe("extractCssSurface", () => {
  const components = [
    "/* ---------- Buttons ---------- */",
    ".ds-btn { color:red; }",
    ".ds-btn.is-primary { color:blue; }",
    ".ds-btn-group { display:flex; }",
    "/* ---------- Cards ---------- */",
    ".ds-card { padding:1rem; }"
  ].join("\n");
  const utilities = "/* ---------- Display ---------- */\n.u-flex { display:flex; }";
  const patterns = "/* ---------- App shell ---------- */\n.p-app { display:grid; }";
  const surface = extractCssSurface({ components, utilities, patterns });

  it("groups sub-parts under their primitive and collects states", () => {
    const btn = surface.primitives.find((p) => p.name === "ds-btn");
    expect(btn).toMatchObject({ type: "primitive", category: "Buttons", subParts: ["ds-btn-group"], states: ["is-primary"] });
    // sub-part is not a separate top-level primitive
    expect(surface.primitives.some((p) => p.name === "ds-btn-group")).toBe(false);
  });
  it("captures nearest section comment as category", () => {
    expect(surface.primitives.find((p) => p.name === "ds-card").category).toBe("Cards");
  });
  it("lists utilities, states, and patterns separately", () => {
    expect(surface.utilities.map((u) => u.name)).toEqual(["u-flex"]);
    expect(surface.states.map((s) => s.name)).toEqual(["is-primary"]);
    expect(surface.patterns.map((p) => p.name)).toEqual(["p-app"]);
  });
});

describe("extractModes", () => {
  it("returns data-theme and data-density with values", () => {
    expect(extractModes()).toEqual([
      { name: "data-density", type: "mode", values: ["comfortable", "compact"], description: "" },
      { name: "data-theme", type: "mode", values: ["dark", "light"], description: "" }
    ]);
  });
});

describe("extractExamples", () => {
  const html = `
    <section class="doc-section"><h2>Variants</h2>
      <div class="example">
        <div class="example-preview">
          <button class="ds-btn is-primary"><svg viewBox="0 0 24 24"><path d="M5 5"/></svg>Start</button>
          <button class="ds-btn">Secondary</button>
        </div>
      </div>
    </section>`;
  const { byClass } = extractExamples([{ name: "buttons", html }]);

  it("indexes the example markup by class, collapsing svgs", () => {
    expect(byClass["ds-btn"][0]).toContain('<button class="ds-btn is-primary">');
    expect(byClass["ds-btn"][0]).toContain("<svg><!-- icon --></svg>");
    expect(byClass["ds-btn"][0]).not.toContain("viewBox");
    expect(byClass["is-primary"]).toBeDefined();
  });
  it("does not duplicate the same markup for a class", () => {
    expect(byClass["ds-btn"].length).toBe(1); // one preview block
  });
  it("handles nested divs inside example-preview", () => {
    const nestedHtml = `
      <div class="example">
        <div class="example-preview">
          <div class="ds-btn-group">
            <button class="ds-btn">A</button>
            <button class="ds-btn">B</button>
          </div>
        </div>
        <div class="example-caption">caption</div>
      </div>`;
    const { byClass: bc } = extractExamples([{ name: "buttons", html: nestedHtml }]);
    expect(bc["ds-btn-group"]).toBeDefined();
    expect(bc["ds-btn"]).toBeDefined();
  });
});

describe("assembleComponents", () => {
  const raw = [{
    name: "DsButton", file: "DsButton.vue",
    props: [{ name: "variant", type: "'primary' | 'ghost'", default: "undefined", required: false }],
    events: [{ name: "click", type: "[e: MouseEvent]" }],
    slots: [{ name: "default" }]
  }];
  const sfc = { DsButton: `<template><button class="ds-btn" :class="cls"><slot/></button></template>` };
  const out = assembleComponents(raw, sfc);

  it("shapes a component item with import + renders + description fields", () => {
    expect(out[0]).toMatchObject({
      name: "DsButton",
      type: "component",
      import: "import { DsButton } from 'design-language/vue'",
      renders: ["ds-btn"],
      description: ""
    });
    expect(out[0].props[0]).toMatchObject({ name: "variant", default: "undefined", required: false, description: "" });
    expect(out[0].events[0]).toMatchObject({ name: "click", description: "" });
    expect(out[0].slots[0]).toMatchObject({ name: "default", description: "" });
  });
});

const parts = () => ({
  version: "1.2.3",
  tokens: [{ name: "--bg", value: "#000", description: "" }],
  cssSurface: {
    primitives: [{ name: "ds-btn", type: "primitive", category: "Buttons", description: "", subParts: [], states: ["is-primary"], examples: [] }],
    utilities: [{ name: "u-flex", type: "utility", category: "Display", description: "", examples: [] }],
    states: [{ name: "is-primary", type: "state", description: "", examples: [] }],
    patterns: []
  },
  modes: [{ name: "data-theme", type: "mode", values: ["dark", "light"], description: "" }],
  components: [{ name: "DsButton", type: "component", import: "import { DsButton } from 'design-language/vue'", description: "", renders: ["ds-btn"], props: [], events: [], slots: [] }],
  examples: { byClass: { "ds-btn": ["<button class=\"ds-btn\">x</button>"] }, patterns: [] },
  descriptions: { "ds-btn": { description: "Primary action button." }, "DsButton": { description: "Button component." } },
  icons: { count: 5, source: "icons/registry.json", approved: "icons/approved.json" }
});

describe("buildManifest", () => {
  const m = buildManifest(parts());
  it("merges descriptions and attaches examples by name", () => {
    expect(m.primitives[0].description).toBe("Primary action button.");
    expect(m.primitives[0].examples).toEqual(["<button class=\"ds-btn\">x</button>"]);
    expect(m.components[0].description).toBe("Button component.");
    expect(m.version).toBe("1.2.3");
    expect(m.generated).toBe("design-system reference");
  });
});

describe("coverageGaps", () => {
  it("lists only items still missing a description", () => {
    const gaps = coverageGaps(buildManifest(parts()));
    expect(gaps).toContain("--bg");
    expect(gaps).toContain("u-flex");
    expect(gaps).toContain("is-primary");
    expect(gaps).not.toContain("ds-btn");
    expect(gaps).not.toContain("DsButton");
  });
});

describe("renderers", () => {
  it("REFERENCE.md is deterministic and contains entries", () => {
    const a = renderReferenceMd(buildManifest(parts()));
    const b = renderReferenceMd(buildManifest(parts()));
    expect(a).toBe(b);
    expect(a).toContain("ds-btn");
    expect(a).toContain("DsButton");
  });
  it("llms.txt embeds the guide text and links the artifacts", () => {
    const out = renderLlmsTxt(buildManifest(parts()), "## Class Rules\nUse .ds-*");
    expect(out).toContain("Use .ds-*");
    expect(out).toContain("REFERENCE.md");
    expect(out).toContain("manifest.json");
  });
});
