import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsCheckbox from "./DsCheckbox.vue";

describe("DsCheckbox", () => {
  it("renders .ds-check with slot label and reflects modelValue", () => {
    const w = mount(DsCheckbox, { props: { modelValue: true }, slots: { default: () => "Remember me" } });
    expect(w.find("label.ds-check").text()).toContain("Remember me");
    expect((w.find("input").element as HTMLInputElement).checked).toBe(true);
  });
  it("emits boolean on change", async () => {
    const w = mount(DsCheckbox, { props: { modelValue: false } });
    await w.find("input").setValue(true);
    expect(w.emitted("update:modelValue")![0]).toEqual([true]);
  });
});
