import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsProgress from "./DsProgress.vue";
describe("DsProgress", () => {
  it("renders .ds-progress with a bar width from value", () => {
    const w = mount(DsProgress, { props: { value: 64 } });
    expect((w.find(".bar").element as HTMLElement).style.width).toBe("64%");
  });
  it("renders 0% width when max is 0 (no NaN)", () => {
    const w = mount(DsProgress, { props: { value: 50, max: 0 } });
    expect((w.find(".bar").element as HTMLElement).style.width).toBe("0%");
  });
  it("exposes progressbar role + aria values", () => {
    const w = mount(DsProgress, { props: { value: 40, max: 80 } });
    const el = w.find(".ds-progress");
    expect(el.attributes("role")).toBe("progressbar");
    expect(el.attributes("aria-valuenow")).toBe("40");
    expect(el.attributes("aria-valuemin")).toBe("0");
    expect(el.attributes("aria-valuemax")).toBe("80");
  });
});
