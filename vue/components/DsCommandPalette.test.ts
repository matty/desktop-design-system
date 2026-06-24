import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import DsCommandPalette from "./DsCommandPalette.vue";

const commands = [
  { id: "new", label: "New File" },
  { id: "open", label: "Open Folder" },
  { id: "save", label: "Save All", hint: "Ctrl+S" }
];

describe("DsCommandPalette", () => {
  it("renders nothing when closed", () => {
    const w = mount(DsCommandPalette, { props: { open: false, commands }, attachTo: document.body });
    expect(document.querySelector(".ds-command")).toBeNull();
    w.unmount();
  });

  it("renders the input and all commands when open", () => {
    const w = mount(DsCommandPalette, { props: { open: true, commands }, attachTo: document.body });
    expect(document.querySelector(".ds-command-input")).not.toBeNull();
    expect(document.querySelectorAll(".ds-command-item")).toHaveLength(3);
    w.unmount();
  });

  it("filters commands by substring", async () => {
    const w = mount(DsCommandPalette, { props: { open: true, commands }, attachTo: document.body });
    const input = document.querySelector(".ds-command-input") as HTMLInputElement;
    input.value = "open";
    input.dispatchEvent(new Event("input"));
    await nextTick();
    const items = document.querySelectorAll(".ds-command-item");
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain("Open Folder");
    w.unmount();
  });

  it("ArrowDown + Enter selects the active command and closes", async () => {
    const w = mount(DsCommandPalette, { props: { open: true, commands }, attachTo: document.body });
    const panel = document.querySelector(".ds-command") as HTMLElement;
    panel.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await nextTick();
    panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await nextTick();
    expect(w.emitted("select")!.at(-1)).toEqual(["open"]);
    expect(w.emitted("update:open")!.at(-1)).toEqual([false]);
    w.unmount();
  });

  it("clicking a command emits select", async () => {
    const w = mount(DsCommandPalette, { props: { open: true, commands }, attachTo: document.body });
    (document.querySelectorAll(".ds-command-item")[2] as HTMLElement).click();
    await nextTick();
    expect(w.emitted("select")!.at(-1)).toEqual(["save"]);
    w.unmount();
  });
});
