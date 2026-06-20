import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import { nextTick } from "vue";
import DsContextMenu from "./DsContextMenu.vue";

const items = [
  { id: "cut", label: "Cut" },
  { id: "copy", label: "Copy" },
  { id: "sep", separator: true },
  { id: "del", label: "Delete", danger: true }
];

describe("DsContextMenu", () => {
  it("is closed until contextmenu fires", () => {
    const w = mount(DsContextMenu, {
      props: { items },
      slots: { default: () => h("div", { class: "target" }, "Right click me") },
      attachTo: document.body
    });
    expect(document.querySelector(".ds-context-menu")).toBeNull();
    w.unmount();
  });

  it("opens at the cursor on contextmenu and renders items", async () => {
    const w = mount(DsContextMenu, {
      props: { items },
      slots: { default: () => h("div", { class: "target" }, "Right click me") },
      attachTo: document.body
    });
    await w.find(".target").trigger("contextmenu", { clientX: 10, clientY: 20 });
    const menu = document.querySelector(".ds-context-menu");
    expect(menu).not.toBeNull();
    expect(menu!.querySelectorAll(".ds-menu-item").length).toBe(3);
    expect(menu!.querySelector(".ds-menu-sep")).not.toBeNull();
    w.unmount();
  });

  it("selecting a leaf emits select with the id and closes", async () => {
    const w = mount(DsContextMenu, {
      props: { items },
      slots: { default: () => h("div", { class: "target" }, "x") },
      attachTo: document.body
    });
    await w.find(".target").trigger("contextmenu", { clientX: 5, clientY: 5 });
    (document.querySelectorAll(".ds-menu-item")[0] as HTMLElement).click();
    expect(w.emitted("select")![0]).toEqual(["cut"]);
    await nextTick();
    expect(document.querySelector(".ds-context-menu")).toBeNull();
    w.unmount();
  });
});
