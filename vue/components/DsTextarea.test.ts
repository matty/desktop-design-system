import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsTextarea from "./DsTextarea.vue";
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
});
