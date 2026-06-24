import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsChecklist from "./DsChecklist.vue";
import { cssHas } from "../__support__/css";
import type { ChecklistItem } from "../types";

const items: ChecklistItem[] = [
  { id: "a", title: "Queued", state: "pending" },
  { id: "b", title: "Scanning", note: "Checking", state: "running" },
  { id: "c", title: "Connected", note: "Ready", state: "ok" },
  { id: "d", title: "No devices", state: "warn" },
  { id: "e", title: "Failed", state: "error" },
];

describe("DsChecklist", () => {
  it("declares its CSS classes in components.css", () => {
    for (const c of [
      "ds-checklist",
      "ds-checklist-item",
      "ds-checklist-ico",
      "ds-checklist-text",
      "ds-checklist-title",
      "ds-checklist-note",
    ]) {
      expect(cssHas(c)).toBe(true);
    }
  });

  it("renders one row per item with its state and a live region", () => {
    const w = mount(DsChecklist, { props: { items } });
    expect(w.find(".ds-checklist").attributes("aria-live")).toBe("polite");
    const rows = w.findAll(".ds-checklist-item");
    expect(rows).toHaveLength(5);
    expect(rows[0].attributes("data-state")).toBe("pending");
    expect(rows[2].attributes("data-state")).toBe("ok");
  });

  it("uses the spinner for the running state and renders titles/notes", () => {
    const w = mount(DsChecklist, { props: { items } });
    const running = w.findAll(".ds-checklist-item")[1];
    expect(running.find(".ds-spinner").exists()).toBe(true);
    expect(w.find(".ds-checklist-title").text()).toBe("Queued");
    expect(w.text()).toContain("Ready");
  });
});
