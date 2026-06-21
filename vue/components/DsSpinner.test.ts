import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSpinner from "./DsSpinner.vue";
import { cssHas } from "../__support__/css";
describe("DsSpinner", () => {
  it("renders .ds-spinner; large maps is-lg", () => {
    expect(cssHas("is-lg")).toBe(true);
    expect(mount(DsSpinner).find(".ds-spinner").exists()).toBe(true);
    expect(mount(DsSpinner, { props: { large: true } }).find(".ds-spinner").classes()).toContain("is-lg");
  });
});
