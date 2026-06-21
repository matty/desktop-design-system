import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsStatus from "./DsStatus.vue";
import { cssHas } from "../__support__/css";
describe("DsStatus", () => {
  it("renders .ds-status with a dot + slot and maps state", () => {
    for (const c of ["is-on", "is-off", "is-busy", "is-error", "is-success", "is-warning", "is-info"]) expect(cssHas(c)).toBe(true);
    const w = mount(DsStatus, { props: { state: "on" }, slots: { default: () => "Online" } });
    expect(w.find(".ds-status").classes()).toContain("is-on");
    expect(w.find(".ds-dot").exists()).toBe(true);
    expect(w.find(".ds-status").text()).toContain("Online");
  });
});
