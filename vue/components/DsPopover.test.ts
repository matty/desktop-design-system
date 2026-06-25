import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
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

  it("opens when the parent sets open=true (controlled)", async () => {
    const w = mount(DsPopover, { props: { open: false }, slots: { trigger: () => "x", default: () => "y" } });
    expect(w.find(".ds-popover").exists()).toBe(false);
    await w.setProps({ open: true });
    expect(w.find(".ds-popover").exists()).toBe(true);
  });

  it("closes when the parent sets open=false (controlled)", async () => {
    const w = mount(DsPopover, { props: { open: true }, slots: { trigger: () => "x", default: () => "y" } });
    expect(w.find(".ds-popover").exists()).toBe(true);
    await w.setProps({ open: false });
    expect(w.find(".ds-popover").exists()).toBe(false);
  });

  it("defaults the open popover to data-placement=bottom", async () => {
    const w = mount(DsPopover, { slots: { trigger: () => "x", default: () => "y" } });
    await w.find("button").trigger("click");
    await flushPromises();
    expect(w.find(".ds-popover").attributes("data-placement")).toBe("bottom");
  });

  it("honors the placement prop", async () => {
    const w = mount(DsPopover, { attachTo: document.body, props: { placement: "top" }, slots: { trigger: () => "x", default: () => "y" } });
    const btn = w.find("button").element as HTMLElement;
    btn.getBoundingClientRect = () =>
      ({ top: 100, bottom: 118, left: 100, right: 200, width: 100, height: 18, x: 100, y: 100, toJSON: () => ({}) }) as DOMRect;
    await w.find("button").trigger("click");
    await flushPromises();
    expect(w.find(".ds-popover").attributes("data-placement")).toBe("top");
    w.unmount();
  });

  it("flips to top when the trigger sits near the viewport bottom", async () => {
    const w = mount(DsPopover, { attachTo: document.body, slots: { trigger: () => "x", default: () => "y" } });
    const vh = window.innerHeight;
    const btn = w.find("button").element as HTMLElement;
    btn.getBoundingClientRect = () =>
      ({ top: vh - 20, bottom: vh - 2, left: 100, right: 200, width: 100, height: 18, x: 100, y: vh - 20, toJSON: () => ({}) }) as DOMRect;
    await w.find("button").trigger("click");
    await flushPromises();
    expect(w.find(".ds-popover").attributes("data-placement")).toBe("top");
    w.unmount();
  });
});
