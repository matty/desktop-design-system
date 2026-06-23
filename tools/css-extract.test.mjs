import { describe, it, expect } from "vitest";
import { extractClassNames } from "./css-extract.mjs";

describe("extractClassNames", () => {
  it("returns sorted, de-duped class tokens", () => {
    const css = ".ds-btn { color: red; }\n.ds-btn.is-primary { color: blue; }\n.u-flex { display:flex; }";
    expect(extractClassNames(css)).toEqual(["ds-btn", "is-primary", "u-flex"]);
  });
  it("ignores property values and hex colors", () => {
    const css = ".ds-card { background:#0c0d0e; border:.5px solid var(--line); }";
    expect(extractClassNames(css)).toEqual(["ds-card"]);
  });
  it("matches compound and descendant selectors", () => {
    const css = ".ds-combo .ds-combo-menu .ds-combo-option { color:red; }";
    expect(extractClassNames(css)).toEqual(["ds-combo", "ds-combo-menu", "ds-combo-option"]);
  });
});
