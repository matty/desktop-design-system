import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsTabs from "./DsTabs.vue";
import DsTabPanel from "./DsTabPanel.vue";

const tabs = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "advanced", label: "Advanced" }
];

function wrap(active: string) {
  return mount(DsTabs, {
    props: { modelValue: active, tabs },
    slots: {
      default: () => [
        h(DsTabPanel, { id: "general" }, () => "G body"),
        h(DsTabPanel, { id: "appearance" }, () => "A body"),
        h(DsTabPanel, { id: "advanced" }, () => "Adv body")
      ]
    }
  });
}

describe("DsTabs", () => {
  it("marks the active tab and shows only its panel", () => {
    const w = wrap("appearance");
    const active = w.findAll(".ds-tab").filter((t) => t.classes().includes("is-active"));
    expect(active).toHaveLength(1);
    expect(active[0].text()).toBe("Appearance");
    expect(w.text()).toContain("A body");
    expect(w.text()).not.toContain("G body");
  });

  it("clicking a tab emits update:modelValue", async () => {
    const w = wrap("general");
    await w.findAll(".ds-tab")[2].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual(["advanced"]);
  });

  it("ArrowRight moves to the next tab", async () => {
    const w = wrap("general");
    await w.find(".ds-tabs").trigger("keydown", { key: "ArrowRight" });
    expect(w.emitted("update:modelValue")![0]).toEqual(["appearance"]);
  });
});
