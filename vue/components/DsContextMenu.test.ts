import { describe, it, expect, beforeAll } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { defineComponent, ref, h } from "vue";
import { nextTick } from "vue";
import DsContextMenu from "./DsContextMenu.vue";
import { useRovingTabindex } from "../composables/useRovingTabindex";

// happy-dom has no layout engine — shim offsetParent / offsetWidth / offsetHeight
// so that useRovingTabindex's items() filter passes in the test environment.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetParent", {
    configurable: true,
    get() { return document.body; },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() { return 1; },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() { return 1; },
  });
});

const items = [
  { id: "cut", label: "Cut" },
  { id: "copy", label: "Copy" },
  { id: "sep", separator: true },
  { id: "del", label: "Delete", danger: true }
];

describe("DsContextMenu", () => {
  it("is closed until contextmenu fires", () => {
    const w = mount(DsContextMenu, {
      props: { items },
      slots: { default: () => h("div", { class: "target" }, "Right click me") },
      attachTo: document.body
    });
    expect(document.querySelector(".ds-context-menu")).toBeNull();
    w.unmount();
  });

  it("opens at the cursor on contextmenu and renders items", async () => {
    const w = mount(DsContextMenu, {
      props: { items },
      slots: { default: () => h("div", { class: "target" }, "Right click me") },
      attachTo: document.body
    });
    await w.find(".target").trigger("contextmenu", { clientX: 10, clientY: 20 });
    const menu = document.querySelector(".ds-context-menu");
    expect(menu).not.toBeNull();
    expect(menu!.querySelectorAll(".ds-menu-item").length).toBe(3);
    expect(menu!.querySelector(".ds-menu-sep")).not.toBeNull();
    w.unmount();
  });

  it("selecting a leaf emits select with the id and closes", async () => {
    const w = mount(DsContextMenu, {
      props: { items },
      slots: { default: () => h("div", { class: "target" }, "x") },
      attachTo: document.body
    });
    await w.find(".target").trigger("contextmenu", { clientX: 5, clientY: 5 });
    (document.querySelectorAll(".ds-menu-item")[0] as HTMLElement).click();
    expect(w.emitted("select")![0]).toEqual(["cut"]);
    await nextTick();
    expect(document.querySelector(".ds-context-menu")).toBeNull();
    w.unmount();
  });

  it("applies ariaLabel to the context menu", async () => {
    const w = mount(DsContextMenu, {
      props: { items: [{ id: "cut", label: "Cut" }], ariaLabel: "Edit actions" },
      slots: { default: () => h("div", { class: "target" }, "Right click me") },
      attachTo: document.body
    });
    await w.find(".target").trigger("contextmenu", { clientX: 10, clientY: 20 });
    expect(document.querySelector(".ds-context-menu")!.getAttribute("aria-label")).toBe("Edit actions");
    w.unmount();
  });

  it("v-if rendered container: roving tabindex attaches after nextTick and ArrowDown moves focus", async () => {
    // Regression for: useRovingTabindex must await nextTick before reading container ref.
    // Harness mirrors DsContextMenu's pattern: ref is null while active=false (v-if hidden),
    // ref is set after active=true triggers a re-render. The async watch fix ensures the
    // composable waits for that render before attaching the listener.
    const MenuHarness = defineComponent({
      setup() {
        const menu = ref<HTMLElement | null>(null);
        const active = ref(false);
        useRovingTabindex(menu, active, { selector: '[role="menuitem"]' });
        return { menu, active };
      },
      render() {
        return this.active
          ? h("div", { ref: "menu", class: "ds-menu" }, [
              h("div", { class: "ds-menu-item", role: "menuitem", tabIndex: -1 }, "Cut"),
              h("div", { class: "ds-menu-item", role: "menuitem", tabIndex: -1 }, "Copy"),
              h("div", { class: "ds-menu-item", role: "menuitem", tabIndex: -1 }, "Paste"),
            ])
          : h("div");
      }
    });
    const w = mount(MenuHarness, { attachTo: document.body });
    // Initially closed — ref is null, no listener attached
    expect(w.find(".ds-menu").exists()).toBe(false);
    // Open — v-if renders the container; mirror the same await pattern as useRovingTabindex.test.ts
    w.vm.active = true;
    await flushPromises();
    const menuEl = document.querySelector(".ds-menu") as HTMLElement;
    expect(menuEl).not.toBeNull();
    const menuItemEls = menuEl.querySelectorAll<HTMLElement>('[role="menuitem"]');
    expect(menuItemEls.length).toBe(3);
    // After async activation, init() runs: first item tabIndex=0
    expect(menuItemEls[0].tabIndex).toBe(0);
    expect(menuItemEls[1].tabIndex).toBe(-1);
    // Focus first item and dispatch ArrowDown — listener must be attached
    menuItemEls[0].focus();
    menuEl.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(menuItemEls[1].tabIndex).toBe(0);
    expect(menuItemEls[0].tabIndex).toBe(-1);
    w.unmount();
  });
});
