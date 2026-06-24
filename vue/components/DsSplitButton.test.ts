import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSplitButton from "./DsSplitButton.vue";

const items = [
  { id: "dup", label: "Duplicate" },
  { id: "sep", separator: true },
  { id: "del", label: "Delete", danger: true }
];

describe("DsSplitButton", () => {
  it("renders the primary label and a caret, menu closed", () => {
    const w = mount(DsSplitButton, { props: { label: "Save", items } });
    const btns = w.findAll(".ds-split-btn > .ds-btn");
    expect(btns[0].text()).toBe("Save");
    expect(btns).toHaveLength(2);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("emits click from the primary button without opening the menu", async () => {
    const w = mount(DsSplitButton, { props: { label: "Save", items } });
    await w.findAll(".ds-split-btn > .ds-btn")[0].trigger("click");
    expect(w.emitted("click")).toHaveLength(1);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("opens the menu from the caret and emits select on an item", async () => {
    const w = mount(DsSplitButton, { props: { label: "Save", items } });
    await w.find(".ds-split-caret").trigger("click");
    expect(w.find(".ds-menu").exists()).toBe(true);
    expect(w.findAll(".ds-menu-item")).toHaveLength(2);
    await w.findAll(".ds-menu-item")[1].trigger("click");
    expect(w.emitted("select")!.at(-1)).toEqual(["del"]);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("applies the variant class to both buttons", () => {
    const w = mount(DsSplitButton, { props: { label: "Save", items, variant: "primary" } });
    w.findAll(".ds-split-btn > .ds-btn").forEach((b) => expect(b.classes()).toContain("is-primary"));
  });
});
