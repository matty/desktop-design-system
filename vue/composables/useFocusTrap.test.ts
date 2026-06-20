import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, ref, h, nextTick } from "vue";
import { useFocusTrap } from "./useFocusTrap";

// happy-dom does not implement layout, so offsetWidth/offsetHeight are always 0.
// Patch the prototype so the visibility filter in focusable() passes in tests
// without weakening the production contract (the filter stays in the composable).
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { get: () => 1, configurable: true });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { get: () => 1, configurable: true });
});

const Harness = defineComponent({
  setup() {
    const box = ref<HTMLElement | null>(null);
    const active = ref(false);
    useFocusTrap(box, active);
    return { box, active };
  },
  render() {
    return this.active
      ? h("div", { ref: "box" }, [h("button", "first"), h("button", "last")])
      : h("div");
  }
});

describe("useFocusTrap", () => {
  it("focuses the first focusable when activated", async () => {
    const w = mount(Harness, { attachTo: document.body });
    w.vm.active = true;
    await nextTick();
    await nextTick();
    expect(document.activeElement?.textContent).toBe("first");
  });

  it("wraps focus from last to first on Tab", async () => {
    const w = mount(Harness, { attachTo: document.body });
    w.vm.active = true;
    await nextTick();
    await nextTick();
    const buttons = document.querySelectorAll("button");
    (buttons[1] as HTMLElement).focus();
    buttons[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(document.activeElement?.textContent).toBe("first");
  });

  it("restores focus to trigger element when unmounted while active", async () => {
    // Create an outside button that acts as the trigger
    const trigger = document.createElement("button");
    trigger.textContent = "trigger";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const w = mount(Harness, { attachTo: document.body });
    // Activate the trap (prev is set to trigger via document.activeElement)
    w.vm.active = true;
    await nextTick();
    await nextTick();
    // Focus should now be inside the trap
    expect(document.activeElement?.textContent).toBe("first");

    // Unmount while still active — deactivate() should restore focus to trigger
    w.unmount();
    expect(document.activeElement).toBe(trigger);

    // Cleanup
    trigger.remove();
  });
});
