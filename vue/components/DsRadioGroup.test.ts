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
  it("emits the value when an option is chosen", async () => {
    const w = mount(DsRadioGroup, { props: { modelValue: "light", options } });
    await w.findAll("input[type=radio]")[1].setValue(true);
    expect(w.emitted("update:modelValue")![0]).toEqual(["dark"]);
  });
});
