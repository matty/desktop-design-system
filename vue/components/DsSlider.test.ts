import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSlider from "./DsSlider.vue";

describe("DsSlider", () => {
  it("renders .ds-slider range with min/max/step/value", () => {
    const w = mount(DsSlider, { props: { modelValue: 0.5, min: 0, max: 1, step: 0.01 } });
    const el = w.find("input.ds-slider").element as HTMLInputElement;
    expect(el.type).toBe("range");
    expect(el.max).toBe("1");
  });
  it("emits a number on input", async () => {
    const w = mount(DsSlider, { props: { modelValue: 0, min: 0, max: 10 } });
    const el = w.find("input.ds-slider");
    (el.element as HTMLInputElement).value = "7";
    await el.trigger("input");
    expect(w.emitted("update:modelValue")![0]).toEqual([7]);
  });
  it("passes name through DsSlider", () => {
    const w = mount(DsSlider, { props: { modelValue: 50, name: "volume" } });
    expect(w.find("input").attributes("name")).toBe("volume");
  });
});
