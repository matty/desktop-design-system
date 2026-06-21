import { describe, it, expect, beforeAll } from "vitest";
import { mount } from "@vue/test-utils";
import DsTree from "./DsTree.vue";
import { cssHas } from "../__support__/css";

// happy-dom has no layout engine — shim offsetParent so rows() filter passes.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetParent", {
    configurable: true,
    get() { return document.body; },
  });
});

const nodes = [
  { id: "1", label: "Root", children: [{ id: "1a", label: "Child A" }, { id: "1b", label: "Child B" }] },
  { id: "2", label: "Leaf" }
];

describe("DsTree", () => {
  it("renders only top-level rows when nothing is expanded", () => {
    const w = mount(DsTree, { props: { nodes, selected: null, expanded: [] } });
    expect(w.findAll(".ds-tree-row")).toHaveLength(2);
  });

  it("clicking the twisty emits update:expanded", async () => {
    const w = mount(DsTree, { props: { nodes, selected: null, expanded: [] } });
    await w.find(".ds-tree-twisty").trigger("click");
    expect(w.emitted("update:expanded")![0]).toEqual([["1"]]);
  });

  it("shows children when expanded", () => {
    const w = mount(DsTree, { props: { nodes, selected: null, expanded: ["1"] } });
    expect(w.findAll(".ds-tree-row")).toHaveLength(4);
  });

  it("clicking a row emits update:selected", async () => {
    const w = mount(DsTree, { props: { nodes, selected: null, expanded: [] } });
    await w.findAll(".ds-tree-row")[1].trigger("click");
    expect(w.emitted("update:selected")![0]).toEqual(["2"]);
  });

  it("ArrowRight on a collapsed parent emits update:expanded adding its id", async () => {
    const w = mount(DsTree, {
      props: { nodes, selected: null, expanded: [] },
      attachTo: document.body
    });
    // Row 0 is the root "1" node which is collapsed
    const rootRow = w.findAll(".ds-tree-row")[0].element as HTMLElement;
    rootRow.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await w.vm.$nextTick();
    expect(w.emitted("update:expanded")).toBeTruthy();
    expect(w.emitted("update:expanded")![0]).toEqual([["1"]]);
    w.unmount();
  });

  it("ArrowLeft on an expanded parent emits update:expanded removing its id", async () => {
    const w = mount(DsTree, {
      props: { nodes, selected: null, expanded: ["1"] },
      attachTo: document.body
    });
    // Row 0 is the root "1" node which is expanded
    const rootRow = w.findAll(".ds-tree-row")[0].element as HTMLElement;
    rootRow.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await w.vm.$nextTick();
    expect(w.emitted("update:expanded")).toBeTruthy();
    expect(w.emitted("update:expanded")![0]).toEqual([[]]); // "1" removed
    w.unmount();
  });
  it("sub-element classes are backed by components.css", () => {
    expect(cssHas("ds-tree-label")).toBe(true);
    expect(cssHas("ds-tree-row")).toBe(true);
    expect(cssHas("ds-tree-twisty")).toBe(true);
  });
});
