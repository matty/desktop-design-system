import { describe, it, expect } from "vitest";
import { storyCoverage, STORY_ALIASES } from "./coverage-core.mjs";

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
