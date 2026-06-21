import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h, defineComponent, inject } from "vue";
import DsField from "./DsField.vue";
import { dsFieldKey } from "./field-context";

// a tiny control that consumes the field context
const Probe = defineComponent({
  setup() {
    const ctx = inject(dsFieldKey);
    return () => h("input", { id: ctx?.id.value, "aria-describedby": ctx?.describedby.value, "aria-invalid": ctx?.invalid.value || undefined });
  }
});

describe("DsField", () => {
  it("renders label wired to the control id", () => {
    const w = mount(DsField, { props: { label: "Email" }, slots: { default: () => h(Probe) } });
    const id = w.find("input").attributes("id");
    expect(id).toBeTruthy();
    expect(w.find("label.ds-field-label").attributes("for")).toBe(id);
  });

  it("shows error via .ds-field-error and wires aria-invalid + describedby", () => {
    const w = mount(DsField, { props: { label: "Email", error: "Required" }, slots: { default: () => h(Probe) } });
    expect(w.find(".ds-field-error").text()).toContain("Required");
    expect(w.find("input").attributes("aria-invalid")).toBe("true");
    expect(w.find("input").attributes("aria-describedby")).toContain(w.find(".ds-field-error").attributes("id"));
  });

  it("shows hint via .ds-field-hint when no error", () => {
    const w = mount(DsField, { props: { hint: "We never share it" }, slots: { default: () => h(Probe) } });
    expect(w.find(".ds-field-hint").text()).toBe("We never share it");
    expect(w.find(".ds-field-error").exists()).toBe(false);
  });
});
