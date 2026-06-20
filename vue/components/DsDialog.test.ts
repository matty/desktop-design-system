import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import DsDialog from "./DsDialog.vue";

describe("DsDialog", () => {
  it("renders nothing while closed", () => {
    mount(DsDialog, { props: { open: false, title: "Hi" }, attachTo: document.body });
    expect(document.querySelector(".ds-dialog")).toBeNull();
  });

  it("teleports an overlay + dialog with the title when open", async () => {
    mount(DsDialog, {
      props: { open: true, title: "Delete this file?" },
      slots: { default: () => "Body text" },
      attachTo: document.body
    });
    await nextTick();
    expect(document.querySelector(".ds-overlay")).not.toBeNull();
    expect(document.querySelector(".ds-dialog-head")?.textContent).toContain("Delete this file?");
    expect(document.querySelector(".ds-dialog-body")?.textContent).toContain("Body text");
  });

  it("locks body scroll while open", async () => {
    mount(DsDialog, { props: { open: true, title: "x" }, attachTo: document.body });
    await nextTick();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("Escape emits update:open false", async () => {
    const w = mount(DsDialog, { props: { open: true, title: "x" }, attachTo: document.body });
    await nextTick();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(w.emitted("update:open")![0]).toEqual([false]);
  });
});
