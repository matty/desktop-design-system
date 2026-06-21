import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSwitch from "./DsSwitch.vue";
import { cssHas } from "../__support__/css";

describe("DsSwitch", () => {
  it("renders .ds-switch with track + checkbox reflecting modelValue", () => {
    const w = mount(DsSwitch, { props: { modelValue: true } });
    expect(w.find("label.ds-switch").exists()).toBe(true);
    expect(w.find("span.ds-track").exists()).toBe(true);
    expect((w.find("input").element as HTMLInputElement).checked).toBe(true);
  });
  it("emits the toggled boolean on change", async () => {
    const w = mount(DsSwitch, { props: { modelValue: false } });
    await w.find("input").setValue(true);
    expect(w.emitted("update:modelValue")![0]).toEqual([true]);
  });
  it("sub-element classes are backed by components.css", () => {
    expect(cssHas("ds-track")).toBe(true);
  });
});
