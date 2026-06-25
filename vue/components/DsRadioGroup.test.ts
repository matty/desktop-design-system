import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsRadioGroup from "./DsRadioGroup.vue";

const options = [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }];

describe("DsRadioGroup", () => {
  it("renders a .ds-radio per option; checks the selected one", () => {
    const w = mount(DsRadioGroup, { props: { modelValue: "dark", options } });
    const radios = w.findAll("label.ds-radio");
    expect(radios).toHaveLength(2);
    const inputs = w.findAll("input[type=radio]");
    expect((inputs[1].element as HTMLInputElement).checked).toBe(true);
  });
  it("applies ariaLabel to the radiogroup", () => {
    const w = mount(DsRadioGroup, { props: { modelValue: "light", options, ariaLabel: "Theme" } });
    expect(w.find("[role=radiogroup]").attributes("aria-label")).toBe("Theme");
  });
  it("emits the value when an option is chosen", async () => {
    const w = mount(DsRadioGroup, { props: { modelValue: "light", options } });
    await w.findAll("input[type=radio]")[1].setValue(true);
    expect(w.emitted("update:modelValue")![0]).toEqual(["dark"]);
  });
});

const opts = [
  { value: "a", label: "A" },
  { value: "b", label: "B", disabled: true },
  { value: "c", label: "C" }
];

describe("DsRadioGroup — Task 6: per-option disabled + name override", () => {
  it("disables only the per-option disabled radio", () => {
    const w = mount(DsRadioGroup, { props: { modelValue: "a", options: opts } });
    const inputs = w.findAll("input[type=radio]");
    expect((inputs[0].element as HTMLInputElement).disabled).toBe(false);
    expect((inputs[1].element as HTMLInputElement).disabled).toBe(true);
    expect((inputs[2].element as HTMLInputElement).disabled).toBe(false);
  });

  it("group disabled overrides all", () => {
    const w = mount(DsRadioGroup, { props: { modelValue: "a", options: opts, disabled: true } });
    for (const i of w.findAll("input[type=radio]")) {
      expect((i.element as HTMLInputElement).disabled).toBe(true);
    }
  });

  it("uses the name override on every radio", () => {
    const w = mount(DsRadioGroup, { props: { modelValue: "a", options: opts, name: "plan" } });
    for (const i of w.findAll("input[type=radio]")) {
      expect(i.attributes("name")).toBe("plan");
    }
  });

  it("falls back to a generated name when none is given", () => {
    const w = mount(DsRadioGroup, { props: { modelValue: "a", options: opts } });
    const names = w.findAll("input[type=radio]").map((i) => i.attributes("name"));
    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });
});
