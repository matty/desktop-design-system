import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsTextarea from "./DsTextarea.vue";
import DsField from "./DsField.vue";
import { cssHas } from "../__support__/css";

describe("DsTextarea", () => {
  it("renders .ds-textarea and v-model round-trips", async () => {
    const w = mount(DsTextarea, { props: { modelValue: "a" } });
    await w.find("textarea.ds-textarea").setValue("b");
    expect(w.emitted("update:modelValue")![0]).toEqual(["b"]);
  });
  it("maps invalid/valid to real classes", () => {
    for (const c of ["is-invalid", "is-valid"]) expect(cssHas(c)).toBe(true);
    expect(mount(DsTextarea, { props: { modelValue: "", invalid: true } }).find("textarea").classes()).toContain("is-invalid");
  });

  it("uses the field id even when given its own id (label for matches)", () => {
    const w = mount(DsField, {
      props: { label: "Notes" },
      slots: { default: () => h(DsTextarea, { modelValue: "", id: "my-own-id" }) }
    });
    const labelFor = w.find("label.ds-field-label").attributes("for");
    const taId = w.find("textarea").attributes("id");
    expect(taId).toBe(labelFor);
    expect(taId).not.toBe("my-own-id");
  });

  it("passes name and readonly through", () => {
    const w = mount(DsTextarea, { props: { modelValue: "", name: "notes", readonly: true } });
    expect(w.find("textarea").attributes("name")).toBe("notes");
    expect(w.find("textarea").attributes("readonly")).toBeDefined();
  });
});
