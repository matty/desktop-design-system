import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsTitlebar from "./DsTitlebar.vue";
describe("DsTitlebar", () => {
  it("renders title + three window buttons (last is-close)", () => {
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
});
