import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSegmented from "./DsSegmented.vue";
import { cssHas } from "../__support__/css";

const options = [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }];

const opts = [
  { value: "a", label: "A" },
  { value: "b", label: "B", disabled: true },
  { value: "c", label: "C" }
];

describe("DsSegmented", () => {
  it("renders .ds-segmented with a button per option; active gets .is-active", () => {
    expect(cssHas("is-active")).toBe(true);
    const w = mount(DsSegmented, { props: { modelValue: "light", options } });
    const btns = w.findAll(".ds-segmented button");
    expect(btns).toHaveLength(2);
    expect(btns[1].classes()).toContain("is-active");
    expect(btns[0].classes()).not.toContain("is-active");
  });
  it("applies ariaLabel to the segmented group", () => {
    const w = mount(DsSegmented, { props: { modelValue: "dark", options, ariaLabel: "View mode" } });
    expect(w.find(".ds-segmented").attributes("aria-label")).toBe("View mode");
  });
  it("emits the value on click", async () => {
    const w = mount(DsSegmented, { props: { modelValue: "dark", options } });
    await w.findAll(".ds-segmented button")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual(["light"]);
  });
  it("disables only the per-option disabled segment", () => {
    const w = mount(DsSegmented, { props: { modelValue: "a", options: opts } });
    const btns = w.findAll("button");
    expect((btns[1].element as HTMLButtonElement).disabled).toBe(true);
    expect((btns[0].element as HTMLButtonElement).disabled).toBe(false);
  });
  it("whole-control disabled disables every segment", () => {
    const w = mount(DsSegmented, { props: { modelValue: "a", options: opts, disabled: true } });
    for (const b of w.findAll("button")) {
      expect((b.element as HTMLButtonElement).disabled).toBe(true);
    }
  });
  it("does not emit when a disabled segment is clicked", async () => {
    const w = mount(DsSegmented, { props: { modelValue: "a", options: opts } });
    await w.findAll("button")[1].trigger("click");
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });
  it("still emits for an enabled segment", async () => {
    const w = mount(DsSegmented, { props: { modelValue: "a", options: opts } });
    await w.findAll("button")[2].trigger("click");
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual(["c"]);
  });
});
