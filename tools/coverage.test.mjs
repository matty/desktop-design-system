import { describe, it, expect } from "vitest";
import { storyCoverage, STORY_ALIASES, exampleCoverage, rendersCoverage, docsCoverage, EXAMPLE_EXEMPT, DATA_VUE_EXPECTED } from "./coverage-core.mjs";

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

describe("exampleCoverage exemptions", () => {
  it("does not flag an exempt non-visual primitive", () => {
    const v = exampleCoverage({ primitives: [{ name: "ds-live", examples: [] }] });
    expect(v).toEqual([]);
  });

  it("still flags a non-exempt primitive with no examples", () => {
    const v = exampleCoverage({ primitives: [{ name: "ds-card", examples: [] }] });
    expect(v).toEqual([
      { rule: "example", entity: "ds-card", detail: "no docs example in pages/*.html" }
    ]);
  });

  it("exempts exactly the two documented infrastructure classes", () => {
    expect([...EXAMPLE_EXEMPT].sort()).toEqual(["ds-drop-placeholder", "ds-live"]);
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

describe("docsCoverage", () => {
  const components = [{ name: "DsCombobox" }, { name: "DsTree" }];

  it("skips when no page contains a data-vue snippet", () => {
    const r = docsCoverage({ components, pageSources: ["<div class=\"ds-btn\">x</div>"] });
    expect(r.skipped).toBe(true);
    expect(r.violations).toEqual([]);
  });

  it("passes a component referenced in a data-vue template", () => {
    const page = `<template data-vue>\n<DsCombobox v-model="x" />\n<DsTree :nodes="n" />\n</template>`;
    const r = docsCoverage({ components, pageSources: [page] });
    expect(r.skipped).toBe(false);
    expect(r.violations).toEqual([]);
  });

  it("flags a component absent from all data-vue snippets", () => {
    const page = `<template data-vue>\n<DsCombobox v-model="x" />\n</template>`;
    const r = docsCoverage({ components, pageSources: [page] });
    expect(r.skipped).toBe(false);
    expect(r.violations).toEqual([
      { rule: "docs", entity: "DsTree", detail: "no data-vue snippet in any page references this component" }
    ]);
  });
});

describe("docsCoverage scoped to interactive set", () => {
  const components = [{ name: "DsCombobox" }, { name: "DsButton" }];
  const expected = new Set(["DsCombobox"]); // DsButton is NOT expected to have a Vue tab

  it("flags an expected interactive component with no snippet", () => {
    const page = `<template data-vue>\n<DsTree />\n</template>`; // some data-vue exists, but not DsCombobox
    const r = docsCoverage({ components, pageSources: [page], expected });
    expect(r.skipped).toBe(false);
    expect(r.violations).toEqual([
      { rule: "docs", entity: "DsCombobox", detail: "no data-vue snippet in any page references this component" }
    ]);
  });

  it("does NOT flag a non-interactive component lacking a snippet", () => {
    const page = `<template data-vue>\n<DsCombobox />\n</template>`;
    const r = docsCoverage({ components, pageSources: [page], expected });
    expect(r.violations).toEqual([]); // DsButton not in expected, DsCombobox present
  });

  it("still skips entirely when no data-vue exists anywhere", () => {
    const r = docsCoverage({ components, pageSources: ["<div>x</div>"], expected });
    expect(r.skipped).toBe(true);
  });

  it("DATA_VUE_EXPECTED contains the ten interactive components", () => {
    expect([...DATA_VUE_EXPECTED].sort()).toEqual(
      ["DsAccordion","DsCombobox","DsContextMenu","DsDialog","DsDropdownMenu","DsSortable","DsSplitter","DsTabs","DsToastHost","DsTree"]
    );
  });
});
