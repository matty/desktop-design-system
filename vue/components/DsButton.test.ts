import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsButton from "./DsButton.vue";
import { cssHas } from "../__support__/css";

const variantClass = { primary: "is-primary", ghost: "is-ghost", danger: "is-danger" } as const;

describe("DsButton", () => {
  it("renders .ds-btn with slot content", () => {
    const w = mount(DsButton, { slots: { default: () => "Save" } });
    expect(w.find("button.ds-btn").text()).toBe("Save");
  });

  it("maps each variant/size/icon prop to a real .is-* class", () => {
    for (const [variant, cls] of Object.entries(variantClass)) {
      expect(cssHas(cls)).toBe(true); // class exists in components.css
      const w = mount(DsButton, { props: { variant: variant as "primary" } });
      expect(w.find("button").classes()).toContain(cls);
    }
    expect(cssHas("is-sm")).toBe(true);
    expect(mount(DsButton, { props: { size: "sm" } }).find("button").classes()).toContain("is-sm");
    expect(cssHas("is-lg")).toBe(true);
    expect(mount(DsButton, { props: { size: "lg" } }).find("button").classes()).toContain("is-lg");
    expect(cssHas("is-icon")).toBe(true);
    expect(mount(DsButton, { props: { icon: true } }).find("button").classes()).toContain("is-icon");
  });

  it("sets disabled and renders a spinner when loading", () => {
    const w = mount(DsButton, { props: { loading: true } });
    expect(w.find("button").attributes("disabled")).toBeDefined();
    expect(w.find(".ds-spinner").exists()).toBe(true);
  });

  it("sets disabled attribute when disabled prop is true", () => {
    const w = mount(DsButton, { props: { disabled: true } });
    expect(w.find("button").attributes("disabled")).toBeDefined();
  });

  it("defaults type=button and accepts submit/reset", () => {
    expect(mount(DsButton).find("button").attributes("type")).toBe("button");
    expect(mount(DsButton, { props: { type: "submit" } }).find("button").attributes("type")).toBe("submit");
  });
});
