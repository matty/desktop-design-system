import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsDrawer from "./DsDrawer.vue";

describe("DsDrawer", () => {
  it("renders nothing when closed", () => {
    const w = mount(DsDrawer, { props: { open: false }, attachTo: document.body });
    expect(document.querySelector(".ds-drawer")).toBeNull();
    w.unmount();
  });

  it("renders the panel, title and slots when open", () => {
    const w = mount(DsDrawer, {
      props: { open: true, title: "Filters" },
      slots: { default: () => "Body content", footer: () => "Foot" },
      attachTo: document.body
    });
    const panel = document.querySelector(".ds-drawer");
    expect(panel).not.toBeNull();
    expect(panel!.classList.contains("is-right")).toBe(true);
    expect(document.querySelector(".ds-drawer-head")!.textContent).toContain("Filters");
    expect(document.querySelector(".ds-drawer-body")!.textContent).toContain("Body content");
    expect(document.querySelector(".ds-drawer-foot")!.textContent).toContain("Foot");
    w.unmount();
  });

  it("honors side=left", () => {
    const w = mount(DsDrawer, { props: { open: true, side: "left" }, attachTo: document.body });
    expect(document.querySelector(".ds-drawer")!.classList.contains("is-left")).toBe(true);
    w.unmount();
  });

  it("locks body overflow while open and restores on close and unmount", async () => {
    // Open: overflow should be hidden
    const w = mount(DsDrawer, { props: { open: true }, attachTo: document.body });
    expect(document.body.style.overflow).toBe("hidden");

    // Close via prop: overflow should be restored
    await w.setProps({ open: false });
    expect(document.body.style.overflow).toBe("");

    // Re-open and then unmount while open: overflow should be restored
    await w.setProps({ open: true });
    expect(document.body.style.overflow).toBe("hidden");
    w.unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
