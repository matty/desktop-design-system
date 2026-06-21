import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsAvatar from "./DsAvatar.vue";
import { cssHas } from "../__support__/css";
describe("DsAvatar", () => {
  it("renders .ds-avatar with initials slot and maps size", () => {
    for (const c of ["is-sm", "is-lg"]) expect(cssHas(c)).toBe(true);
    expect(mount(DsAvatar, { props: { size: "lg" }, slots: { default: () => "JR" } }).find(".ds-avatar").classes()).toContain("is-lg");
  });
  it("renders an img when src is given", () => {
    expect(mount(DsAvatar, { props: { src: "x.png", alt: "Jordan" } }).find("img").attributes("src")).toBe("x.png");
  });
});
