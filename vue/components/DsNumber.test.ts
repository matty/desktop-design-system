import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsNumber from "./DsNumber.vue";

describe("DsNumber", () => {
  it("renders .ds-number with input + two .ds-step buttons", () => {
    const w = mount(DsNumber, { props: { modelValue: 5 } });
    expect(w.find(".ds-number input").exists()).toBe(true);
    expect(w.findAll(".ds-step button")).toHaveLength(2);
    expect((w.find("input").element as HTMLInputElement).value).toBe("5");
  });
  it("increments/decrements by step, clamped to max/min", async () => {
    const w = mount(DsNumber, { props: { modelValue: 9, min: 0, max: 10, step: 1 } });
    const [up, down] = w.findAll(".ds-step button");
    await up.trigger("click");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([10]); // clamped at max
    await w.setProps({ modelValue: 10 });
    await up.trigger("click");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([10]); // stays at max
    await down.trigger("click");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([9]);
  });
  it("emits a number on direct input", async () => {
    const w = mount(DsNumber, { props: { modelValue: 1 } });
    const el = w.find("input");
    (el.element as HTMLInputElement).value = "42";
    await el.trigger("input");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([42]);
  });
});
