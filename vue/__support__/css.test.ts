import { describe, it, expect } from "vitest";
import { cssHas, cssClasses } from "./css";

describe("css helper", () => {
  it("finds known classes", () => {
    expect(cssHas("ds-btn")).toBe(true);
    expect(cssHas("is-primary")).toBe(true);
    expect(cssHas("is-ghost")).toBe(true);
  });
  it("rejects non-existent classes", () => {
    expect(cssHas("is-totally-made-up")).toBe(false);
  });
  it("returns a non-trivial set", () => {
    expect(cssClasses().size).toBeGreaterThan(50);
  });
});
