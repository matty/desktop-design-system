import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsEmpty from "./DsEmpty.vue";
describe("DsEmpty", () => {
  it("renders .ds-empty with ico + slot", () => {
    const w = mount(DsEmpty, { slots: { default: () => "Nothing here" } });
    expect(w.find(".ds-empty-ico").exists()).toBe(true);
    expect(w.find(".ds-empty").text()).toContain("Nothing here");
  });
});
