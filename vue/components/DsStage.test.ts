import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsStage from "./DsStage.vue";

describe("DsStage", () => {
  it("renders .ptn-stage and projects slot content", () => {
    const w = mount(DsStage, { slots: { default: () => "Centered" } });
    const stage = w.find(".ptn-stage");
    expect(stage.exists()).toBe(true);
    expect(stage.text()).toContain("Centered");
  });
});
