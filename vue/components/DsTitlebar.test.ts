import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsTitlebar from "./DsTitlebar.vue";
import { cssHas } from "../__support__/css";

describe("DsTitlebar", () => {
  it("renders title + three window buttons (last is-close) by default", () => {
    const w = mount(DsTitlebar, { props: { title: "App" } });
    expect(w.find(".ds-titlebar-title").text()).toBe("App");
    const btns = w.findAll(".ds-winbtns button");
    expect(btns).toHaveLength(3);
    expect(btns[2].classes()).toContain("is-close");
  });

  it("emits minimize/maximize/close", async () => {
    const w = mount(DsTitlebar, { props: { title: "App" } });
    const btns = w.findAll(".ds-winbtns button");
    await btns[0].trigger("click");
    await btns[1].trigger("click");
    await btns[2].trigger("click");
    expect(w.emitted("minimize")).toBeTruthy();
    expect(w.emitted("maximize")).toBeTruthy();
    expect(w.emitted("close")).toBeTruthy();
  });

  it("labels the window buttons", () => {
    const btns = mount(DsTitlebar, { props: { title: "App" } }).findAll(".ds-winbtns button");
    expect(btns[0].attributes("aria-label")).toBe("Minimize");
    expect(btns[1].attributes("aria-label")).toBe("Maximize");
    expect(btns[2].attributes("aria-label")).toBe("Close");
  });

  it("honors the controls prop for which buttons and order", () => {
    const w = mount(DsTitlebar, { props: { controls: ["close"] } });
    const btns = w.findAll(".ds-winbtns button");
    expect(btns).toHaveLength(1);
    expect(btns[0].classes()).toContain("is-close");

    const w2 = mount(DsTitlebar, { props: { controls: ["close", "minimize"] } });
    const btns2 = w2.findAll(".ds-winbtns button");
    expect(btns2[0].attributes("aria-label")).toBe("Close");
    expect(btns2[1].attributes("aria-label")).toBe("Minimize");
  });

  it("swaps maximize for restore when maximized", async () => {
    const w = mount(DsTitlebar, { props: { maximized: true } });
    const max = w.findAll(".ds-winbtns button")[1];
    expect(max.attributes("aria-label")).toBe("Restore");
    await max.trigger("click");
    expect(w.emitted("restore")).toBeTruthy();
    expect(w.emitted("maximize")).toBeFalsy();
  });

  it("renders leading and actions slots in their wrappers", () => {
    const w = mount(DsTitlebar, {
      slots: { leading: () => "LEAD", actions: () => "ACT" },
    });
    expect(w.find(".ds-titlebar-leading").text()).toBe("LEAD");
    expect(w.find(".ds-titlebar-actions").text()).toBe("ACT");
  });

  it("lets the controls slot override the built-in cluster", () => {
    const w = mount(DsTitlebar, {
      slots: { controls: () => h("button", { class: "custom" }, "x") },
    });
    expect(w.find(".ds-winbtns").exists()).toBe(false);
    expect(w.find("button.custom").exists()).toBe(true);
  });

  it("declares its layout sub-part classes", () => {
    expect(cssHas("ds-titlebar-leading")).toBe(true);
    expect(cssHas("ds-titlebar-actions")).toBe(true);
  });
});
