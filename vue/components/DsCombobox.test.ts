import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsCombobox from "./DsCombobox.vue";

const options = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana" },
  { value: "c", label: "Cherry" }
];

describe("DsCombobox", () => {
  it("opens on button click and lists options", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options } });
    await w.find(".ds-combo-btn").trigger("click");
    expect(w.find(".ds-combo").classes()).toContain("is-open");
    expect(w.findAll(".ds-combo-option")).toHaveLength(3);
  });

  it("single-select emits the value and closes", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options } });
    await w.find(".ds-combo-btn").trigger("click");
    await w.findAll(".ds-combo-option")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual(["b"]);
    expect(w.find(".ds-combo").classes()).not.toContain("is-open");
  });

  it("multiple toggles values in an array", async () => {
    const w = mount(DsCombobox, { props: { modelValue: ["a"], options, multiple: true } });
    await w.find(".ds-combo-btn").trigger("click");
    await w.findAll(".ds-combo-option")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual([["a", "b"]]);
  });

  it("filterable narrows the visible options", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options, filterable: true } });
    await w.find(".ds-combo-btn").trigger("click");
    await w.find(".ds-combo-filter").setValue("ban");
    expect(w.findAll(".ds-combo-option")).toHaveLength(1);
    expect(w.find(".ds-combo-option").text()).toBe("Banana");
  });
});
