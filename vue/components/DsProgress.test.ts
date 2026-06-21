import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsProgress from "./DsProgress.vue";
describe("DsProgress", () => {
  it("renders .ds-progress with a bar width from value", () => {
    const w = mount(DsProgress, { props: { value: 64 } });
    expect((w.find(".bar").element as HTMLElement).style.width).toBe("64%");
  });
});
