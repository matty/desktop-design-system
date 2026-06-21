import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsAccordion from "./DsAccordion.vue";
import DsAccordionItem from "./DsAccordionItem.vue";
import { cssHas } from "../__support__/css";

function wrap(modelValue: string | string[], multiple = false) {
  return mount(DsAccordion, {
    props: { modelValue, multiple },
    slots: {
      default: () => [
        h(DsAccordionItem, { id: "one", title: "One" }, () => "Body one"),
        h(DsAccordionItem, { id: "two", title: "Two" }, () => "Body two")
      ]
    }
  });
}

describe("DsAccordion", () => {
  it("opens matching item / hides others", () => {
    const w = wrap("one");
    const items = w.findAll("details.ds-acc");
    expect(items[0].attributes("open")).toBeDefined();
    expect(items[1].attributes("open")).toBeUndefined();
  });

  it("single mode emits new id when another header clicked", async () => {
    const w = wrap("one");
    await w.findAll("summary")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual(["two"]);
  });

  it("single mode toggling open item emits empty string", async () => {
    const w = wrap("one");
    await w.findAll("summary")[0].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual([""]);
  });

  it("multiple mode accumulates ids", async () => {
    const w = wrap(["one"], true);
    await w.findAll("summary")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual([["one", "two"]]);
  });

  it("summary has no redundant aria-expanded", () => {
    const w = mount(DsAccordion, { props: { modelValue: "one" }, slots: { default: () => h(DsAccordionItem, { id: "one", title: "One" }, () => "B") } });
    expect(w.find("summary").attributes("aria-expanded")).toBeUndefined();
  });
  it("sub-element classes are backed by components.css", () => {
    expect(cssHas("ds-acc-body")).toBe(true);
    expect(cssHas("chev")).toBe(true);
  });
});
