import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsAlert from "./DsAlert.vue";
import { cssHas } from "../__support__/css";
describe("DsAlert", () => {
  it("renders .ds-alert with ico + slot and maps tone", () => {
    for (const c of ["is-info", "is-success", "is-warning", "is-danger"]) expect(cssHas(c)).toBe(true);
    const w = mount(DsAlert, { props: { tone: "danger" }, slots: { default: () => "Failed" } });
    expect(w.find(".ds-alert").classes()).toContain("is-danger");
    expect(w.find(".ds-alert-ico").exists()).toBe(true);
    expect(w.text()).toContain("Failed");
  });
  it("emits close when dismissible button clicked", async () => {
    const w = mount(DsAlert, { props: { dismissible: true } });
    await w.find("button").trigger("click");
    expect(w.emitted("close")).toBeTruthy();
  });
});
