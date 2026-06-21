import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsBadge from "./DsBadge.vue";
import { cssHas } from "../__support__/css";
describe("DsBadge", () => {
  it("renders .ds-badge with slot", () => {
    expect(mount(DsBadge, { slots: { default: () => "New" } }).find(".ds-badge").text()).toBe("New");
  });
  it("maps tone + solid to real classes", () => {
    for (const c of ["is-info", "is-success", "is-warning", "is-danger", "is-solid"]) expect(cssHas(c)).toBe(true);
    expect(mount(DsBadge, { props: { tone: "danger" } }).find(".ds-badge").classes()).toContain("is-danger");
    expect(mount(DsBadge, { props: { solid: true } }).find(".ds-badge").classes()).toContain("is-solid");
  });
});
