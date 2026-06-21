import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsList from "./DsList.vue";
import DsListItem from "./DsListItem.vue";
import { cssHas } from "../__support__/css";
describe("DsList", () => {
  it("renders ul.ds-list with items; seamless + selected map classes", () => {
    for (const c of ["is-seamless", "is-selected"]) expect(cssHas(c)).toBe(true);
    const w = mount(DsList, { props: { seamless: true }, slots: { default: () => h(DsListItem, { selected: true }, () => "One") } });
    expect(w.find("ul.ds-list").classes()).toContain("is-seamless");
    expect(w.find("li.ds-list-item").classes()).toContain("is-selected");
    expect(w.find("li.ds-list-item").text()).toBe("One");
  });
});
