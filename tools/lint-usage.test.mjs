import { describe, it, expect } from "vitest";
import { lint } from "./lint-usage.mjs";

const manifest = {
  primitives: [{ name: "ds-btn" }], utilities: [{ name: "u-flex" }], states: [{ name: "is-primary" }],
  patterns: [{ name: "ptn-workspace" }], tokens: [], modes: [],
  components: [{ name: "DsButton", props: [{ name: "variant" }, { name: "size" }] }]
};

describe("lint", () => {
  it("passes on known classes", () => {
    const errs = lint({ manifest, files: [{ name: "a.html", kind: "html", source: `<button class="ds-btn is-primary u-flex">x</button>` }] });
    expect(errs).toEqual([]);
  });
  it("flags an unknown class", () => {
    const errs = lint({ manifest, files: [{ name: "a.html", kind: "html", source: `<div class="ds-buton">x</div>` }] });
    expect(errs).toEqual([{ file: "a.html", kind: "unknown-class", name: "ds-buton" }]);
  });
  it("flags an unknown component and unknown prop in a Vue template", () => {
    const vue = `<template><DsButton variant="primary" /><DsNope /><DsButton bogus="x" /></template>`;
    const errs = lint({ manifest, files: [{ name: "c.vue", kind: "vue", source: vue }] });
    expect(errs).toContainEqual({ file: "c.vue", kind: "unknown-component", name: "DsNope" });
    expect(errs).toContainEqual({ file: "c.vue", kind: "unknown-prop", name: "DsButton.bogus" });
  });
  it("ignores non-ds classes and HTML attributes", () => {
    const errs = lint({ manifest, files: [{ name: "a.html", kind: "html", source: `<div class="my-app grid">x</div>` }] });
    expect(errs).toEqual([]);
  });
  it("passes on known pattern class (ptn-)", () => {
    const errs = lint({ manifest, files: [{ name: "p.html", kind: "html", source: `<div class="ptn-workspace">x</div>` }] });
    expect(errs).toEqual([]);
  });
  it("ignores p- prefix if not in grammar (no false positives)", () => {
    // 'p-' alone is not our grammar prefix (patterns use ptn-), so consumer p-* classes are ignored
    const errs = lint({ manifest, files: [{ name: "a.html", kind: "html", source: `<div class="p-4 p-something">x</div>` }] });
    expect(errs).toEqual([]);
  });
  it("flags unknown ptn- class", () => {
    const errs = lint({ manifest, files: [{ name: "a.html", kind: "html", source: `<div class="ptn-nonexistent">x</div>` }] });
    expect(errs).toEqual([{ file: "a.html", kind: "unknown-class", name: "ptn-nonexistent" }]);
  });
  it("normalizes kebab-case prop to camelCase for Vue component", () => {
    // model-value -> modelValue: known prop
    const manifest2 = {
      ...manifest,
      components: [{ name: "DsInput", props: [{ name: "modelValue" }] }]
    };
    const vue = `<template><DsInput model-value="x" /></template>`;
    const errs = lint({ manifest: manifest2, files: [{ name: "c.vue", kind: "vue", source: vue }] });
    expect(errs).toEqual([]);
  });
  it("skips v-/ @/ :-bound directive attributes", () => {
    const vue = `<template><DsButton v-if="x" @click="h" :class="c" /></template>`;
    const errs = lint({ manifest, files: [{ name: "c.vue", kind: "vue", source: vue }] });
    expect(errs).toEqual([]);
  });
  it("passes on subParts (e.g. ds-btn-group) from primitives.subParts", () => {
    const manifest2 = {
      ...manifest,
      primitives: [{ name: "ds-btn", subParts: ["ds-btn-group"] }]
    };
    const errs = lint({ manifest: manifest2, files: [{ name: "a.html", kind: "html", source: `<div class="ds-btn-group">x</div>` }] });
    expect(errs).toEqual([]);
  });
});
