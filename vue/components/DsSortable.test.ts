import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

const onEndHandlers: Array<(e: { oldIndex: number; newIndex: number }) => void> = [];
vi.mock("sortablejs", () => ({
  default: {
    create: (_el: HTMLElement, opts: { onEnd: (e: { oldIndex: number; newIndex: number }) => void }) => {
      onEndHandlers.push(opts.onEnd);
      return { destroy: () => {} };
    }
  }
}));

import DsSortable from "./DsSortable.vue";

describe("DsSortable", () => {
  it("renders one element per item via the item slot", () => {
    const w = mount(DsSortable, {
      props: { modelValue: ["a", "b", "c"] },
      slots: { item: (p: { item: string }) => p.item } as any
    });
    expect(w.findAll("[data-ds-sortable] > *")).toHaveLength(3);
  });

  it("reorders the bound array on drag end", () => {
    const w = mount(DsSortable, {
      props: { modelValue: ["a", "b", "c"] },
      slots: { item: (p: { item: string }) => p.item } as any
    });
    onEndHandlers[onEndHandlers.length - 1]({ oldIndex: 0, newIndex: 2 });
    expect(w.emitted("update:modelValue")![0]).toEqual([["b", "c", "a"]]);
  });
});
