import { describe, it, expect } from "vitest";
import { storyCoverage, STORY_ALIASES, exampleCoverage, rendersCoverage } from "./coverage-core.mjs";

describe("storyCoverage", () => {
  it("passes when a component has a same-named story", () => {
    const v = storyCoverage({
      components: [{ name: "DsButton" }],
      storyNames: ["DsButton"]
    });
    expect(v).toEqual([]);
  });

  it("flags a component with no story and no alias", () => {
    const v = storyCoverage({
      components: [{ name: "DsButton" }],
      storyNames: []
    });
    expect(v).toEqual([
      { rule: "story", entity: "DsButton", detail: "no vue/components/DsButton.stories.ts" }
    ]);
  });

  it("passes a sub-component when its alias parent story exists", () => {
    const v = storyCoverage({
      components: [{ name: "DsTabPanel" }],
      storyNames: ["DsTabs"],
      aliases: { DsTabPanel: "DsTabs" }
    });
    expect(v).toEqual([]);
  });

  it("flags a sub-component whose alias parent story is missing", () => {
    const v = storyCoverage({
      components: [{ name: "DsTabPanel" }],
      storyNames: [],
      aliases: { DsTabPanel: "DsTabs" }
    });
    expect(v).toEqual([
      { rule: "story", entity: "DsTabPanel", detail: "expected alias story DsTabs.stories.ts not found" }
    ]);
  });

  it("aliases the four known sub-components by default", () => {
    expect(STORY_ALIASES).toEqual({
      DsAccordionItem: "DsAccordion",
      DsFact: "DsFacts",
      DsListItem: "DsList",
      DsTabPanel: "DsTabs"
    });
  });
});

describe("exampleCoverage", () => {
  it("passes a primitive that has examples", () => {
    const v = exampleCoverage({ primitives: [{ name: "ds-btn", examples: ["<button class=\"ds-btn\">x</button>"] }] });
    expect(v).toEqual([]);
  });

  it("flags a primitive with an empty examples array", () => {
    const v = exampleCoverage({ primitives: [{ name: "ds-meter", examples: [] }] });
    expect(v).toEqual([
      { rule: "example", entity: "ds-meter", detail: "no docs example in pages/*.html" }
    ]);
  });

  it("flags a primitive with no examples key at all", () => {
    const v = exampleCoverage({ primitives: [{ name: "ds-spinner" }] });
    expect(v).toEqual([
      { rule: "example", entity: "ds-spinner", detail: "no docs example in pages/*.html" }
    ]);
  });
});

describe("rendersCoverage", () => {
  const primitives = [{ name: "ds-combo", subParts: ["ds-combo-btn"] }, { name: "ds-chip" }];

  it("passes when every rendered class is a known primitive or subPart", () => {
    const v = rendersCoverage({
      components: [{ name: "DsCombobox", renders: ["ds-combo", "ds-combo-btn", "ds-chip"] }],
      primitives
    });
    expect(v).toEqual([]);
  });

  it("flags a rendered class that is not a known primitive", () => {
    const v = rendersCoverage({
      components: [{ name: "DsRadioGroup", renders: ["ds-radio-group"] }],
      primitives
    });
    expect(v).toEqual([
      { rule: "renders", entity: "DsRadioGroup → ds-radio-group", detail: "rendered class 'ds-radio-group' is not a known primitive/subPart" }
    ]);
  });

  it("ignores components with no renders list", () => {
    const v = rendersCoverage({ components: [{ name: "DsBare" }], primitives });
    expect(v).toEqual([]);
  });
});
