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
});
