import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsIcon from "./DsIcon.vue";
import registry from "../../icons/registry.json";

describe("DsIcon", () => {
  const known = Object.keys(registry.icons)[0];

  it("renders an inline svg for a known icon", () => {
    const w = mount(DsIcon, { props: { name: known } });
    expect(w.find("svg").exists()).toBe(true);
  });

  it("renders nothing visible for an unknown icon (no throw)", () => {
    const w = mount(DsIcon, { props: { name: "definitely-not-an-icon" } });
    expect(w.find("svg").exists()).toBe(false);
  });

  it("applies size to width/height", () => {
    const w = mount(DsIcon, { props: { name: known, size: 20 } });
    const svg = w.find("svg").element as SVGElement;
    expect(svg.getAttribute("width")).toBe("20");
  });
});
