import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsBreadcrumb from "./DsBreadcrumb.vue";
const items = [{ label: "Library", href: "#" }, { label: "Games", href: "#" }, { label: "Elden Ring" }];
describe("DsBreadcrumb", () => {
  it("renders links + separators; last item is .current (no link)", () => {
    const w = mount(DsBreadcrumb, { props: { items } });
    expect(w.findAll("nav.ds-breadcrumb a")).toHaveLength(2);
    expect(w.findAll(".sep")).toHaveLength(2);
    expect(w.find(".current").text()).toBe("Elden Ring");
  });
});
