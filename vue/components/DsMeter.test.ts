import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsMeter from "./DsMeter.vue";
import { cssHas } from "../__support__/css";
describe("DsMeter", () => {
  it("renders .ds-meter with a fill width from value/max", () => {
    const w = mount(DsMeter, { props: { value: 30, max: 60, label: "CPU" } });
    expect(w.find(".ds-meter").exists()).toBe(true);
    expect((w.find(".fill").element as HTMLElement).style.width).toBe("50%");
    expect(w.text()).toContain("CPU");
  });
  it("renders .name and .val sub-element spans", () => {
    const w = mount(DsMeter, { props: { value: 50, max: 100, label: "CPU" } });
    expect(w.find(".ds-meter .name").text()).toBe("CPU");
    expect(w.find(".ds-meter .val").text()).toBe("50%");
  });
  it("sub-element classes are backed by components.css", () => {
    expect(cssHas("name")).toBe(true);
    expect(cssHas("val")).toBe(true);
  });
  it("renders 0% width when max is 0 (no NaN)", () => {
    const w = mount(DsMeter, { props: { value: 50, max: 0 } });
    expect((w.find(".fill").element as HTMLElement).style.width).toBe("0%");
  });
});
