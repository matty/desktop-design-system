import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsDropdownMenu from "./DsDropdownMenu.vue";

const items = [
  { id: "refresh", label: "Refresh" },
  { id: "open", label: "Open folder" },
  { id: "sep", separator: true },
  { id: "del", label: "Delete", danger: true }
];

describe("DsDropdownMenu", () => {
  it("is closed initially", () => {
    const w = mount(DsDropdownMenu, {
      props: { items },
      slots: { trigger: () => h("span", "Menu") }
    });
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("opens on trigger click and renders items + separator", async () => {
    const w = mount(DsDropdownMenu, {
      props: { items },
      slots: { trigger: () => h("span", "Menu") }
    });
    await w.find(".ds-dropdown-btn").trigger("click");
    expect(w.find(".ds-menu").exists()).toBe(true);
    expect(w.findAll(".ds-menu-item")).toHaveLength(3);
    expect(w.find(".ds-menu-sep").exists()).toBe(true);
  });

  it("selecting a leaf emits select and closes", async () => {
    const w = mount(DsDropdownMenu, {
      props: { items },
      slots: { trigger: () => h("span", "Menu") }
    });
    await w.find(".ds-dropdown-btn").trigger("click");
    await w.findAll(".ds-menu-item")[0].trigger("click");
    expect(w.emitted("select")![0]).toEqual(["refresh"]);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });
});
