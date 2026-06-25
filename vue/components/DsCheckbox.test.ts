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

  it("sets the indeterminate DOM property from the prop", async () => {
    const w = mount(DsCheckbox, { props: { modelValue: false, indeterminate: true } });
    const el = w.find("input").element as HTMLInputElement;
    expect(el.indeterminate).toBe(true);
    await w.setProps({ indeterminate: false });
    expect(el.indeterminate).toBe(false);
  });

  it("defaults indeterminate to false", () => {
    const w = mount(DsCheckbox, { props: { modelValue: false } });
    expect((w.find("input").element as HTMLInputElement).indeterminate).toBe(false);
  });

  it("passes name through to the native input", () => {
    const w = mount(DsCheckbox, { props: { modelValue: false, name: "agree" } });
    expect(w.find("input").attributes("name")).toBe("agree");
  });

  it("still round-trips v-model on change", async () => {
    const w = mount(DsCheckbox, { props: { modelValue: false } });
    await w.find("input").setValue(true);
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([true]);
  });
});
