import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsPopover from "./DsPopover.vue";

describe("DsPopover", () => {
  it("is closed initially", () => {
    const w = mount(DsPopover, { slots: { trigger: () => "Open", default: () => "Body" } });
    expect(w.find(".ds-popover").exists()).toBe(false);
  });

  it("toggles open on trigger click and shows content", async () => {
    const w = mount(DsPopover, { slots: { trigger: () => "Open", default: () => h("p", "Body") } });
    await w.find("button").trigger("click");
    expect(w.find(".ds-popover").exists()).toBe(true);
    expect(w.find(".ds-popover").text()).toContain("Body");
  });

  it("applies ariaLabel to the popover", async () => {
    const w = mount(DsPopover, { props: { ariaLabel: "Details" }, slots: { trigger: () => "x", default: () => "y" } });
    await w.find("button").trigger("click");
    expect(w.find(".ds-popover").attributes("aria-label")).toBe("Details");
  });

  it("supports v-model:open (controlled)", async () => {
    const w = mount(DsPopover, { props: { open: true }, slots: { trigger: () => "x", default: () => "y" } });
    expect(w.find(".ds-popover").exists()).toBe(true);
    await w.find("button").trigger("click");
    expect(w.emitted("update:open")!.at(-1)).toEqual([false]);
  });
});
