import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSteps from "./DsSteps.vue";

const steps = [
  { id: "a", label: "Account" },
  { id: "b", label: "Profile" },
  { id: "c", label: "Done" }
];

describe("DsSteps", () => {
  it("renders all steps with numbers and labels", () => {
    const w = mount(DsSteps, { props: { steps, current: 1 } });
    expect(w.findAll(".ds-steps-item")).toHaveLength(3);
    expect(w.findAll(".ds-steps-num").map((n) => n.text())).toEqual(["1", "2", "3"]);
    expect(w.text()).toContain("Profile");
  });

  it("marks complete/active by numeric current", () => {
    const w = mount(DsSteps, { props: { steps, current: 1 } });
    const items = w.findAll(".ds-steps-item");
    expect(items[0].classes()).toContain("is-complete");
    expect(items[1].classes()).toContain("is-active");
    expect(items[2].classes()).not.toContain("is-active");
  });

  it("accepts a step id as current", () => {
    const w = mount(DsSteps, { props: { steps, current: "c" } });
    const items = w.findAll(".ds-steps-item");
    expect(items[2].classes()).toContain("is-active");
    expect(items[0].classes()).toContain("is-complete");
  });
});
