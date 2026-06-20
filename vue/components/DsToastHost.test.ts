import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import DsToastHost from "./DsToastHost.vue";
import { useToast } from "../composables/useToast";

describe("DsToastHost", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
    const { toasts, dismiss } = useToast();
    [...toasts].forEach((t) => dismiss(t.id));
  });

  it("renders a toast pushed via useToast", async () => {
    const w = mount(DsToastHost);
    useToast().toast({ message: "Saved", tone: "success", timeout: 0 });
    await nextTick();
    expect(w.findAll(".ds-toast")).toHaveLength(1);
    expect(w.find(".ds-toast").classes()).toContain("is-success");
    expect(w.find(".ds-toast").text()).toContain("Saved");
  });

  it("dismiss button removes the toast", async () => {
    const w = mount(DsToastHost);
    useToast().toast({ message: "Bye", timeout: 0 });
    await nextTick();
    await w.find(".ds-toast-close").trigger("click");
    expect(w.findAll(".ds-toast")).toHaveLength(0);
  });
});
