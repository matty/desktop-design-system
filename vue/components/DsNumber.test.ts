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

  it("labels the step buttons", () => {
    const btns = mount(DsNumber, { props: { modelValue: 1 } }).findAll(".ds-step button");
    expect(btns[0].attributes("aria-label")).toBe("Increment");
    expect(btns[1].attributes("aria-label")).toBe("Decrement");
  });

  it("clamps typed input above max down to max", async () => {
    const w = mount(DsNumber, { props: { modelValue: 5, min: 0, max: 10 } });
    await w.find("input").setValue("99");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([10]);
  });

  it("clamps typed input below min up to min", async () => {
    const w = mount(DsNumber, { props: { modelValue: 5, min: 0, max: 10 } });
    await w.find("input").setValue("-99");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([0]);
  });

  it("emits in-range typed input unchanged", async () => {
    const w = mount(DsNumber, { props: { modelValue: 5, min: 0, max: 10 } });
    await w.find("input").setValue("7");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual([7]);
  });

  it("ignores empty / non-numeric input (no emit)", async () => {
    const w = mount(DsNumber, { props: { modelValue: 5, min: 0, max: 10 } });
    await w.find("input").setValue("");
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });

  it("disables the increment button at max and decrement at min", () => {
    const atMax = mount(DsNumber, { props: { modelValue: 10, min: 0, max: 10 } });
    expect((atMax.find('button[aria-label="Increment"]').element as HTMLButtonElement).disabled).toBe(true);
    expect((atMax.find('button[aria-label="Decrement"]').element as HTMLButtonElement).disabled).toBe(false);

    const atMin = mount(DsNumber, { props: { modelValue: 0, min: 0, max: 10 } });
    expect((atMin.find('button[aria-label="Decrement"]').element as HTMLButtonElement).disabled).toBe(true);
    expect((atMin.find('button[aria-label="Increment"]').element as HTMLButtonElement).disabled).toBe(false);
  });

  it("renders inputmode=numeric and passes name through", () => {
    const w = mount(DsNumber, { props: { modelValue: 1, name: "qty" } });
    const input = w.find("input");
    expect(input.attributes("inputmode")).toBe("numeric");
    expect(input.attributes("name")).toBe("qty");
  });
});
