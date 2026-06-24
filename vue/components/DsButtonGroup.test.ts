import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsButtonGroup from "./DsButtonGroup.vue";

describe("DsButtonGroup", () => {
  it("renders a role=group with slotted buttons", () => {
    const w = mount(DsButtonGroup, {
      slots: { default: () => [h("button", { class: "ds-btn" }, "A"), h("button", { class: "ds-btn" }, "B")] }
    });
    const g = w.find(".ds-btn-group");
    expect(g.exists()).toBe(true);
    expect(g.attributes("role")).toBe("group");
    expect(w.findAll(".ds-btn")).toHaveLength(2);
  });

  it("applies ariaLabel", () => {
    const w = mount(DsButtonGroup, { props: { ariaLabel: "Text style" }, slots: { default: () => "x" } });
    expect(w.find(".ds-btn-group").attributes("aria-label")).toBe("Text style");
  });
});
