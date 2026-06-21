import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsToolbar from "./DsToolbar.vue";
describe("DsToolbar", () => {
  it("renders .ds-toolbar with title, spacer, and end slot", () => {
    const w = mount(DsToolbar, { props: { title: "Runs" }, slots: { default: () => "[btn]" } });
    expect(w.find(".ds-toolbar-title").text()).toBe("Runs");
    expect(w.find(".ds-toolbar-spacer").exists()).toBe(true);
    expect(w.find(".ds-toolbar").text()).toContain("[btn]");
  });
});
