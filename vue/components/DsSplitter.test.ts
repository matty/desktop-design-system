import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsSplitter from "./DsSplitter.vue";
import { cssHas } from "../__support__/css";

describe("DsSplitter", () => {
  it("renders two panes and a separator", () => {
    const w = mount(DsSplitter, {
      props: { size: 200 },
      slots: { first: () => h("div", "L"), second: () => h("div", "R") }
    });
    expect(w.find(".ds-pane-first").exists()).toBe(true);
    expect(w.find("[data-ds-splitter]").exists()).toBe(true);
    expect(w.find(".ds-pane-rest").exists()).toBe(true);
  });

  it("pane classes are backed by components.css", () => {
    expect(cssHas("ds-pane-first")).toBe(true);
    expect(cssHas("ds-pane-rest")).toBe(true);
  });

  it("applies the size as flex-basis on the first pane", () => {
    const w = mount(DsSplitter, {
      props: { size: 180 },
      slots: { first: () => h("div"), second: () => h("div") }
    });
    expect((w.find(".ds-pane-first").element as HTMLElement).style.flexBasis).toBe("180px");
  });

  it("ArrowRight increases size (vertical splitter) and emits update:size", async () => {
    const w = mount(DsSplitter, {
      props: { size: 100, min: 0, max: 1000 },
      slots: { first: () => h("div"), second: () => h("div") }
    });
    await w.find("[data-ds-splitter]").trigger("keydown", { key: "ArrowRight" });
    const ev = w.emitted("update:size")!;
    expect(ev[ev.length - 1][0]).toBe(116);
  });
});
