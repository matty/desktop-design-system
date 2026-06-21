import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsChip from "./DsChip.vue";
describe("DsChip", () => {
  it("renders .ds-chip with slot; no x unless removable", () => {
    expect(mount(DsChip, { slots: { default: () => "Tag" } }).find(".ds-chip-x").exists()).toBe(false);
  });
  it("remove control is a labelled button that emits remove", async () => {
    const w = mount(DsChip, { props: { removable: true }, slots: { default: () => "Tag" } });
    const btn = w.find("button.ds-chip-x");
    expect(btn.exists()).toBe(true);
    expect(btn.attributes("aria-label")).toBe("Remove");
    await btn.trigger("click");
    expect(w.emitted("remove")).toBeTruthy();
  });
});
