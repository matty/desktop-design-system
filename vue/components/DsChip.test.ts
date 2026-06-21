import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsChip from "./DsChip.vue";
describe("DsChip", () => {
  it("renders .ds-chip with slot; no x unless removable", () => {
    expect(mount(DsChip, { slots: { default: () => "Tag" } }).find(".ds-chip-x").exists()).toBe(false);
  });
  it("emits remove when x clicked", async () => {
    const w = mount(DsChip, { props: { removable: true }, slots: { default: () => "Tag" } });
    await w.find(".ds-chip-x").trigger("click");
    expect(w.emitted("remove")).toBeTruthy();
  });
});
