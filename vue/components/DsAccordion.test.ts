import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsAccordion from "./DsAccordion.vue";
import DsAccordionItem from "./DsAccordionItem.vue";

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
  it("opens the item matching modelValue and hides its body otherwise", () => {
    const w = wrap("one");
    const items = w.findAll(".ds-acc");
    expect(items[0].classes()).toContain("is-open");
    expect(items[1].classes()).not.toContain("is-open");
    expect(items[0].find(".ds-acc-body").exists()).toBe(true);
    expect(items[1].find(".ds-acc-body").exists()).toBe(false);
  });

  it("single mode emits the new id when another header is clicked", async () => {
    const w = wrap("one");
    await w.findAll(".ds-acc-head")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual(["two"]);
  });

  it("single mode toggling the open item emits empty string", async () => {
    const w = wrap("one");
    await w.findAll(".ds-acc-head")[0].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual([""]);
  });

  it("multiple mode accumulates ids", async () => {
    const w = wrap(["one"], true);
    await w.findAll(".ds-acc-head")[1].trigger("click");
    expect(w.emitted("update:modelValue")![0]).toEqual([["one", "two"]]);
  });
});
