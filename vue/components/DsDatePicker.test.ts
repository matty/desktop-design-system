import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";

import DsDatePicker from "./DsDatePicker.vue";

describe("DsDatePicker", () => {
  it("shows the placeholder when empty and the calendar is closed", () => {
    const w = mount(DsDatePicker, { props: { modelValue: null, placeholder: "Pick a date" } });
    const input = w.find(".ds-input").element as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("Pick a date");
    expect(w.find(".ds-calendar").exists()).toBe(false);
  });

  it("shows the ISO value in the field", () => {
    const w = mount(DsDatePicker, { props: { modelValue: "2026-06-15" } });
    expect((w.find(".ds-input").element as HTMLInputElement).value).toBe("2026-06-15");
  });

  it("applies a custom format function to the display", () => {
    const w = mount(DsDatePicker, { props: { modelValue: "2026-06-15", format: (iso: string) => iso.split("-").reverse().join("/") } });
    expect((w.find(".ds-input").element as HTMLInputElement).value).toBe("15/06/2026");
  });

  it("opens the calendar on field click", async () => {
    const w = mount(DsDatePicker, { props: { modelValue: "2026-06-15" } });
    await w.find(".ds-input").trigger("click");
    expect(w.find(".ds-calendar").exists()).toBe(true);
  });

  it("selecting a day emits update:modelValue and closes", async () => {
    const w = mount(DsDatePicker, { props: { modelValue: "2026-06-15" } });
    await w.find(".ds-input").trigger("click");
    const cells = w.findAll(".ds-calendar-day");
    await cells[0].trigger("click"); // June 1 2026 (Monday) → first cell
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual(["2026-06-01"]);
    expect(w.find(".ds-calendar").exists()).toBe(false);
  });
});
