import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsTooltip from "./DsTooltip.vue";

describe("DsTooltip", () => {
  it("wraps the trigger in .ds-tip and sets data-tip", () => {
    const w = mount(DsTooltip, { props: { text: "Save changes" }, slots: { default: () => h("button", "Save") } });
    const tip = w.find(".ds-tip");
    expect(tip.exists()).toBe(true);
    expect(tip.attributes("data-tip")).toBe("Save changes");
    expect(w.find("button").text()).toBe("Save");
  });
});
