import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsTree from "./DsTree.vue";

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
});
