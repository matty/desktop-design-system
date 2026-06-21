import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsFacts from "./DsFacts.vue";
import DsFact from "./DsFact.vue";
import { cssHas } from "../__support__/css";
describe("DsFacts", () => {
  it("renders .ds-facts (cols) wrapping .ds-fact k/v", () => {
    const w = mount(DsFacts, { props: { cols: 2 }, slots: { default: () => h(DsFact, { term: "Version", value: "2.4.0" }) } });
    expect(w.find(".ds-facts").classes()).toContain("cols-2");
    expect(w.find(".ds-fact .k").text()).toBe("Version");
    expect(w.find(".ds-fact .v").text()).toBe("2.4.0");
  });
  it("cols-2 class is backed by components.css", () => {
    expect(cssHas("cols-2")).toBe(true);
  });
  it("sub-element classes are backed by components.css", () => {
    expect(cssHas("k")).toBe(true);
    expect(cssHas("v")).toBe(true);
  });
});
