import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsNavItem from "./DsNavItem.vue";
import { cssHas } from "../__support__/css";
describe("DsNavItem", () => {
  it("renders a.ds-navi with label; active maps is-active + aria-current", () => {
    expect(cssHas("is-active")).toBe(true);
    const w = mount(DsNavItem, { props: { label: "Home", active: true } });
    expect(w.find("a.ds-navi").text()).toBe("Home");
    expect(w.find("a").classes()).toContain("is-active");
    expect(w.find("a").attributes("aria-current")).toBe("page");
  });
});
