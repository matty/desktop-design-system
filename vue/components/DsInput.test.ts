import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsInput from "./DsInput.vue";
import DsField from "./DsField.vue";
import { cssHas } from "../__support__/css";

describe("DsInput", () => {
  it("renders .ds-input and v-model round-trips", async () => {
    const w = mount(DsInput, { props: { modelValue: "hi" } });
    const el = w.find("input.ds-input");
    expect((el.element as HTMLInputElement).value).toBe("hi");
    await el.setValue("bye");
    expect(w.emitted("update:modelValue")![0]).toEqual(["bye"]);
  });

  it("maps mono/invalid/valid to real classes", () => {
    for (const cls of ["is-mono", "is-invalid", "is-valid"]) expect(cssHas(cls)).toBe(true);
    expect(mount(DsInput, { props: { modelValue: "", mono: true } }).find("input").classes()).toContain("is-mono");
    expect(mount(DsInput, { props: { modelValue: "", invalid: true } }).find("input").classes()).toContain("is-invalid");
    expect(mount(DsInput, { props: { modelValue: "", valid: true } }).find("input").classes()).toContain("is-valid");
  });

  it("inherits id + aria-invalid from DsField", () => {
    const w = mount(DsField, { props: { label: "Email", error: "x" }, slots: { default: () => h(DsInput, { modelValue: "" }) } });
    const input = w.find("input");
    expect(input.attributes("id")).toBeTruthy();
    expect(input.attributes("aria-invalid")).toBe("true");
  });
});
