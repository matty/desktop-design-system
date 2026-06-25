import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsCombobox from "./DsCombobox.vue";
import { cssHas } from "../__support__/css";

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
  it("sub-element classes are backed by components.css", () => {
    expect(cssHas("ds-combo-check")).toBe(true);
    expect(cssHas("ds-combo-chev")).toBe(true);
    expect(cssHas("ds-combo-menu")).toBe(true);
  });
});

const optionsWithDisabled = [
  { value: "a", label: "Apple" },
  { value: "b", label: "Banana", disabled: true },
  { value: "c", label: "Cherry" }
];

function open(w: ReturnType<typeof mount>) {
  return w.find(".ds-combo-btn").trigger("click");
}

describe("DsCombobox keyboard + disabled", () => {
  it("disables the trigger when disabled", () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options: optionsWithDisabled, disabled: true } });
    expect((w.find(".ds-combo-btn").element as HTMLButtonElement).disabled).toBe(true);
  });

  it("ArrowDown skips disabled options", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options: optionsWithDisabled } });
    await open(w);
    await w.find(".ds-combo-btn").trigger("keydown", { key: "ArrowDown" });
    // first enabled = index 0 (Apple)
    expect(w.findAll(".ds-combo-option")[0].classes()).toContain("is-active");
    await w.find(".ds-combo-btn").trigger("keydown", { key: "ArrowDown" });
    // skips Banana (disabled) -> Cherry (index 2)
    expect(w.findAll(".ds-combo-option")[2].classes()).toContain("is-active");
  });

  it("Enter selects the active option", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options: optionsWithDisabled } });
    await open(w);
    await w.find(".ds-combo-btn").trigger("keydown", { key: "ArrowDown" });
    await w.find(".ds-combo-btn").trigger("keydown", { key: "Enter" });
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual(["a"]);
  });

  it("Escape closes the menu", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options: optionsWithDisabled } });
    await open(w);
    expect(w.find(".ds-combo").classes()).toContain("is-open");
    await w.find(".ds-combo-btn").trigger("keydown", { key: "Escape" });
    expect(w.find(".ds-combo").classes()).not.toContain("is-open");
  });

  it("End jumps to the last enabled option", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options: optionsWithDisabled } });
    await open(w);
    await w.find(".ds-combo-btn").trigger("keydown", { key: "End" });
    expect(w.findAll(".ds-combo-option")[2].classes()).toContain("is-active");
  });

  it("resets active index when reopened", async () => {
    const w = mount(DsCombobox, { props: { modelValue: null, options: optionsWithDisabled } });
    await open(w);
    await w.find(".ds-combo-btn").trigger("keydown", { key: "End" });
    await w.find(".ds-combo-btn").trigger("click"); // close
    await w.find(".ds-combo-btn").trigger("click"); // reopen
    expect(w.findAll(".ds-combo-option").some((o) => o.classes().includes("is-active"))).toBe(false);
  });
});
