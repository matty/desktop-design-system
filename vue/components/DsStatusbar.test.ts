import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsStatusbar from "./DsStatusbar.vue";
describe("DsStatusbar", () => {
  it("renders .ds-statusbar with spacer between start and end slots", () => {
    const w = mount(DsStatusbar, { slots: { start: () => "left", end: () => "right" } });
    expect(w.find(".ds-statusbar-spacer").exists()).toBe(true);
    expect(w.text()).toContain("left");
    expect(w.text()).toContain("right");
  });
});
