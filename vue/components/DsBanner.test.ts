import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsBanner from "./DsBanner.vue";
import { cssHas } from "../__support__/css";
describe("DsBanner", () => {
  it("renders .ds-banner with ico/spacer and warning tone", () => {
    expect(cssHas("is-warning")).toBe(true);
    const w = mount(DsBanner, { props: { tone: "warning" }, slots: { default: () => "Heads up" } });
    expect(w.find(".ds-banner").classes()).toContain("is-warning");
    expect(w.find(".ds-banner-ico").exists()).toBe(true);
    expect(w.find(".ds-banner-spacer").exists()).toBe(true);
  });
});
