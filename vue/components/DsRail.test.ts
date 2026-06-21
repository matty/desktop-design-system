import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsRail from "./DsRail.vue";
describe("DsRail", () => {
  it("renders nav.ds-rail with slot", () => {
    expect(mount(DsRail, { slots: { default: () => "items" } }).find("nav.ds-rail").text()).toBe("items");
  });
  it("renders a rail-spacer when bottom slot is used", () => {
    const w = mount(DsRail, { slots: { bottom: () => "About" } });
    expect(w.find(".ds-rail-spacer").exists()).toBe(true);
    expect(w.text()).toContain("About");
  });
  it("labels the nav landmark (default + custom)", () => {
    expect(mount(DsRail).find("nav.ds-rail").attributes("aria-label")).toBe("Navigation");
    expect(mount(DsRail, { props: { label: "Primary" } }).find("nav").attributes("aria-label")).toBe("Primary");
  });
});
