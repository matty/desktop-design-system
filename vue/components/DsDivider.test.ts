import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsDivider from "./DsDivider.vue";
import { cssHas } from "../__support__/css";
describe("DsDivider", () => {
  it("renders hr.ds-divider; vertical maps is-vertical", () => {
    expect(cssHas("is-vertical")).toBe(true);
    expect(mount(DsDivider).find("hr.ds-divider").exists()).toBe(true);
    expect(mount(DsDivider, { props: { vertical: true } }).find("hr").classes()).toContain("is-vertical");
  });
  it("renders .ds-divider-label when label given", () => {
    expect(mount(DsDivider, { props: { label: "or" } }).find(".ds-divider-label").text()).toBe("or");
  });
});
