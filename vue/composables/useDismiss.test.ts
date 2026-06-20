import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref, h } from "vue";
import { useDismiss } from "./useDismiss";

function harness(onDismiss: () => void) {
  return defineComponent({
    setup() {
      const root = ref<HTMLElement | null>(null);
      const active = ref(true);
      useDismiss({ active, root, onDismiss });
      return () => h("div", { ref: root }, [h("button", "inside")]);
    }
  });
}

describe("useDismiss", () => {
  it("fires onDismiss on outside pointerdown", () => {
    const cb = vi.fn();
    mount(harness(cb), { attachTo: document.body });
    document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("fires onDismiss on Escape", () => {
    const cb = vi.fn();
    mount(harness(cb), { attachTo: document.body });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("does not fire for clicks inside root", () => {
    const cb = vi.fn();
    const w = mount(harness(cb), { attachTo: document.body });
    w.find("button").element.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    expect(cb).not.toHaveBeenCalled();
  });
})
