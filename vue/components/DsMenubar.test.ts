import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsMenubar from "./DsMenubar.vue";

const menus = [
  { id: "file", label: "File", items: [ { id: "new", label: "New" }, { id: "open", label: "Open" } ] },
  { id: "edit", label: "Edit", items: [ { id: "undo", label: "Undo" }, { id: "sep", separator: true }, { id: "cut", label: "Cut" } ] }
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
});
