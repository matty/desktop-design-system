import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSegmented from "./DsSegmented.vue";
import { cssHas } from "../__support__/css";

const options = [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }];

describe("DsSegmented", () => {
  it("renders .ds-segmented with a button per option; active gets .is-active", () => {
    expect(cssHas("is-active")).toBe(true);
    const w = mount(DsSegmented, { props: { modelValue: "light", options } });
    const btns = w.findAll(".ds-segmented button");
    expect(btns).toHaveLength(2);
    expect(btns[1].classes()).toContain("is-active");
    expect(btns[0].classes()).not.toContain("is-active");
  });
  it("applies ariaLabel to the segmented group", () => {
    const w = mount(DsSegmented, { props: { modelValue: "dark", options, ariaLabel: "View mode" } });
    expect(w.find(".ds-segmented").attributes("aria-label")).toBe("View mode");
  });
  it("emits the value on click", async () => {
    const w = mount(DsSegmented, { props: { modelValue: "dark", options } });
    await w.findAll(".ds-segmented button")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual(["light"]);
  });
});
