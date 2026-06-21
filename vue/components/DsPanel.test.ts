import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsPanel from "./DsPanel.vue";
describe("DsPanel", () => {
  it("renders head with title and body with slot", () => {
    const w = mount(DsPanel, { props: { title: "Sync" }, slots: { default: () => "B" } });
    expect(w.find(".ds-panel-head").text()).toContain("Sync");
    expect(w.find(".ds-panel-body").text()).toBe("B");
  });
  it("omits head when no title/header slot", () => {
    const w = mount(DsPanel, { slots: { default: () => "B" } });
    expect(w.find(".ds-panel-head").exists()).toBe(false);
  });
});
