import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import DsMenubar from "./DsMenubar.vue";

const menus = [
  { id: "file", label: "File", items: [ { id: "new", label: "New" }, { id: "open", label: "Open" } ] },
  { id: "edit", label: "Edit", items: [ { id: "undo", label: "Undo" }, { id: "sep", separator: true }, { id: "cut", label: "Cut" } ] }
];

const menusWithDisabled = [
  {
    id: "file",
    label: "File",
    items: [
      { id: "new", label: "New" },
      { id: "save", label: "Save", disabled: true },
      { id: "open", label: "Open" }
    ]
  },
  { id: "edit", label: "Edit", items: [ { id: "undo", label: "Undo" } ] }
];

describe("DsMenubar", () => {
  it("renders top-level items as a menubar", () => {
    const w = mount(DsMenubar, { props: { menus } });
    expect(w.find("[role=menubar]").exists()).toBe(true);
    expect(w.findAll(".ds-menubar-item")).toHaveLength(2);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("opens a menu on click and renders its items", async () => {
    const w = mount(DsMenubar, { props: { menus } });
    await w.findAll(".ds-menubar-item")[0].trigger("click");
    expect(w.find(".ds-menu").exists()).toBe(true);
    expect(w.findAll(".ds-menu-item")).toHaveLength(2);
  });

  it("clicking a leaf item emits select and closes", async () => {
    const w = mount(DsMenubar, { props: { menus } });
    await w.findAll(".ds-menubar-item")[0].trigger("click");
    await w.findAll(".ds-menu-item")[1].trigger("click");
    expect(w.emitted("select")!.at(-1)).toEqual(["open"]);
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  it("only one menu is open at a time", async () => {
    const w = mount(DsMenubar, { props: { menus } });
    await w.findAll(".ds-menubar-item")[0].trigger("click");
    await w.findAll(".ds-menubar-item")[1].trigger("click");
    expect(w.findAll(".ds-menu")).toHaveLength(1);
    expect(w.findAll(".ds-menu-item").map((i) => i.text())).toEqual(["Undo", "Cut"]);
  });

  it("Escape closes the open menu", async () => {
    const w = mount(DsMenubar, { props: { menus } });
    await w.findAll(".ds-menubar-item")[0].trigger("click");
    await w.find("[role=menubar]").trigger("keydown", { key: "Escape" });
    expect(w.find(".ds-menu").exists()).toBe(false);
  });

  // ── Keyboard navigation tests ──────────────────────────────────────────────

  it("ArrowRight moves focus to the next top item", async () => {
    const w = mount(DsMenubar, { props: { menus }, attachTo: document.body });
    const tops = w.findAll(".ds-menubar-item");
    tops[0].element.focus();
    await w.find("[role=menubar]").trigger("keydown", { key: "ArrowRight" });
    await nextTick();
    expect(document.activeElement).toBe(tops[1].element);
    w.unmount();
  });

  it("ArrowDown on a focused closed top item opens it and focuses the first menu item", async () => {
    const w = mount(DsMenubar, { props: { menus }, attachTo: document.body });
    const tops = w.findAll(".ds-menubar-item");
    tops[0].element.focus();
    await w.find("[role=menubar]").trigger("keydown", { key: "ArrowDown" });
    await w.vm.$nextTick();
    expect(w.find(".ds-menu").exists()).toBe(true);
    const mItems = w.findAll(".ds-menu-item");
    expect(document.activeElement).toBe(mItems[0].element);
    w.unmount();
  });

  it("Arrow navigation within an open menu skips a disabled item", async () => {
    const w = mount(DsMenubar, { props: { menus: menusWithDisabled }, attachTo: document.body });
    const tops = w.findAll(".ds-menubar-item");
    tops[0].element.focus();
    // Open menu and focus first item
    await w.find("[role=menubar]").trigger("keydown", { key: "ArrowDown" });
    await w.vm.$nextTick();
    // All rendered .ds-menu-item elements (including disabled)
    const mItems = w.findAll(".ds-menu-item");
    // Should be focused on first enabled item ("New") — index 0
    expect(document.activeElement).toBe(mItems[0].element);
    // ArrowDown should skip disabled "Save" (index 1) and land on "Open" (index 2)
    await w.find("[role=menubar]").trigger("keydown", { key: "ArrowDown" });
    await nextTick();
    expect(document.activeElement).toBe(mItems[2].element);
    w.unmount();
  });

  it("Escape closes the menu and returns focus to the active top item", async () => {
    const w = mount(DsMenubar, { props: { menus }, attachTo: document.body });
    const tops = w.findAll(".ds-menubar-item");
    tops[0].element.focus();
    // Open menu via ArrowDown
    await w.find("[role=menubar]").trigger("keydown", { key: "ArrowDown" });
    await w.vm.$nextTick();
    expect(w.find(".ds-menu").exists()).toBe(true);
    // Press Escape
    await w.find("[role=menubar]").trigger("keydown", { key: "Escape" });
    await nextTick();
    expect(w.find(".ds-menu").exists()).toBe(false);
    expect(document.activeElement).toBe(tops[0].element);
    w.unmount();
  });
});
