import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsBreadcrumb from "./DsBreadcrumb.vue";
import { cssHas } from "../__support__/css";
const items = [{ label: "Library", href: "#" }, { label: "Games", href: "#" }, { label: "Elden Ring" }];
describe("DsBreadcrumb", () => {
  it("renders links + separators; last item is .current (no link)", () => {
    const w = mount(DsBreadcrumb, { props: { items } });
    expect(w.findAll("nav.ds-breadcrumb a")).toHaveLength(2);
    expect(w.findAll(".sep")).toHaveLength(2);
    expect(w.find(".current").text()).toBe("Elden Ring");
  });
  it("labels the nav, marks current, hides separators", () => {
    const w = mount(DsBreadcrumb, { props: { items: [{ label: "A", href: "#" }, { label: "B" }] } });
    expect(w.find("nav.ds-breadcrumb").attributes("aria-label")).toBe("Breadcrumb");
    expect(w.find(".current").attributes("aria-current")).toBe("page");
    expect(w.find(".sep").attributes("aria-hidden")).toBe("true");
  });
  it("sub-element classes are backed by components.css", () => {
    expect(cssHas("sep")).toBe(true);
    expect(cssHas("current")).toBe(true);
  });
});
