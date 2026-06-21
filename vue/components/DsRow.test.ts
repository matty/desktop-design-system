import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsRow from "./DsRow.vue";
describe("DsRow", () => {
  it("renders .ds-row with text (title/description) + control slot", () => {
    const w = mount(DsRow, { props: { title: "Sync", description: "Keep devices aligned" }, slots: { default: () => "[switch]" } });
    expect(w.find(".ds-row-text").text()).toContain("Sync");
    expect(w.find(".ds-row-text").text()).toContain("Keep devices aligned");
    expect(w.find(".ds-row-control").text()).toBe("[switch]");
  });
});
