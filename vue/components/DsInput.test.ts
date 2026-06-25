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

  it("uses the field id even when the input has its own id (label for matches)", () => {
    const w = mount(DsField, {
      props: { label: "Email" },
      slots: { default: () => h(DsInput, { modelValue: "", id: "my-own-id" }) }
    });
    const labelFor = w.find("label.ds-field-label").attributes("for");
    const inputId = w.find("input").attributes("id");
    expect(inputId).toBe(labelFor);
    expect(inputId).not.toBe("my-own-id");
  });

  it("uses the consumer id when standalone (no field)", () => {
    const w = mount(DsInput, { props: { modelValue: "", id: "standalone" } });
    expect(w.find("input").attributes("id")).toBe("standalone");
  });

  it("passes name and readonly through to the native input", () => {
    const w = mount(DsInput, { props: { modelValue: "", name: "email", readonly: true } });
    const input = w.find("input");
    expect(input.attributes("name")).toBe("email");
    expect(input.attributes("readonly")).toBeDefined();
  });
});
