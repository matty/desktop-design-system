import { describe, it, expect } from "vitest";
import { collectComponentMeta, componentNames } from "./component-meta.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("componentNames", () => {
  it("lists every Ds* export from vue/index.ts", () => {
    const src = readFileSync(resolve("vue/index.ts"), "utf8");
    const names = componentNames(src);
    expect(names).toContain("DsButton");
    expect(names).toContain("DsCombobox");
    expect(names).toContain("DsToastHost");
    expect(names.length).toBeGreaterThan(40);
  });
});

describe("collectComponentMeta", () => {
  it("extracts props + events for representative components", () => {
    const meta = collectComponentMeta();
    const byName = Object.fromEntries(meta.map((m) => [m.name, m]));
    expect(byName.DsButton).toBeTruthy();
    const combo = byName.DsCombobox;
    expect(combo.props.some((p) => p.name === "modelValue")).toBe(true);
    expect(combo.events.some((e) => e.name === "update:modelValue")).toBe(true);
  }, 60000); // vue-component-meta first run is slow
});
