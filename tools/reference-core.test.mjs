import { describe, it, expect } from "vitest";
import { extractTokens, extractCssSurface, extractModes } from "./reference-core.mjs";

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
