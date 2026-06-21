import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsMeter from "./DsMeter.vue";
describe("DsMeter", () => {
  it("renders .ds-meter with a fill width from value/max", () => {
    const w = mount(DsMeter, { props: { value: 30, max: 60, label: "CPU" } });
    expect(w.find(".ds-meter").exists()).toBe(true);
    expect((w.find(".fill").element as HTMLElement).style.width).toBe("50%");
    expect(w.text()).toContain("CPU");
  });
});
