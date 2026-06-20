import { describe, it, expect, beforeAll } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref, h, nextTick } from "vue";
import { useRovingTabindex } from "./useRovingTabindex";

// happy-dom has no layout engine: every element reports offsetParent === null.
// The composable's items() filter excludes elements where offsetParent === null
// as a real browser visibility guard. We shim it here — test-only — so the
// filter passes in the test environment, mirroring what Task 4 did for
// offsetWidth/offsetHeight. The production composable is unchanged.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetParent", {
    configurable: true,
    get() {
      return document.body;
    },
  });
});

// The harness starts with active=false and exposes it so tests can flip it
// after mount. This is required because watch(active, …, { immediate:true })
// fires during setup() when container.value is still null (template refs are
// populated after the first render). Flipping active to true after nextTick()
// triggers the watch again once the ref is set — matching useFocusTrap.test.ts.
const Harness = defineComponent({
  setup() {
    const box = ref<HTMLElement | null>(null);
    const active = ref(false);
    useRovingTabindex(box, active, { selector: '[role="menuitem"]' });
    return { box, active };
  },
  render() {
    return h("div", { ref: "box" }, [
      h("button", { role: "menuitem" }, "a"),
      h("button", { role: "menuitem" }, "b"),
      h("button", { role: "menuitem" }, "c")
    ]);
  }
});

describe("useRovingTabindex", () => {
  it("makes only the first item tabbable initially", async () => {
    const w = mount(Harness, { attachTo: document.body });
    w.vm.active = true;
    await nextTick();
    const items = document.querySelectorAll('[role="menuitem"]');
    expect((items[0] as HTMLElement).tabIndex).toBe(0);
    expect((items[1] as HTMLElement).tabIndex).toBe(-1);
  });

  it("ArrowDown moves focus to the next item", async () => {
    const w = mount(Harness, { attachTo: document.body });
    w.vm.active = true;
    await nextTick();
    const items = document.querySelectorAll('[role="menuitem"]');
    (items[0] as HTMLElement).focus();
    items[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(document.activeElement?.textContent).toBe("b");
  });
});
