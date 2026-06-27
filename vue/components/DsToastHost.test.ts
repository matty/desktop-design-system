import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import DsToastHost from "./DsToastHost.vue";
import DsIcon from "./DsIcon.vue";
import { useToast } from "../composables/useToast";
import { cssHas } from "../__support__/css";

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
  it("sub-element classes are backed by components.css", () => {
    expect(cssHas("ds-toast-body")).toBe(true);
    expect(cssHas("ds-toast-stack")).toBe(true);
    expect(cssHas("ds-toast-close")).toBe(true);
  });

  it("applies the placement class to the stack (default bottom-right)", () => {
    expect(cssHas("is-top-right")).toBe(true);
    expect(mount(DsToastHost).find(".ds-toast-stack").classes()).toContain("is-bottom-right");
    const w = mount(DsToastHost, { props: { placement: "top-right" } });
    expect(w.find(".ds-toast-stack").classes()).toContain("is-top-right");
  });

  it("renders tone icon, title and action button; action fires then dismisses", async () => {
    const onClick = vi.fn();
    const w = mount(DsToastHost);
    useToast().toast({
      message: "Deleted",
      title: "Item removed",
      tone: "danger",
      timeout: 0,
      action: { label: "Undo", onClick },
    });
    await nextTick();
    expect(w.find(".ds-toast.is-danger").exists()).toBe(true);
    expect(w.find(".ds-toast-ico").exists()).toBe(true);
    expect(w.find(".ds-toast-body b").text()).toBe("Item removed");
    const btn = w.find(".ds-toast-actions .ds-btn");
    expect(btn.text()).toContain("Undo");
    await btn.trigger("click");
    expect(onClick).toHaveBeenCalledOnce();
    await nextTick();
    expect(w.find(".ds-toast").exists()).toBe(false);
  });

  it("maps each tone to its own glyph", async () => {
    const w = mount(DsToastHost);
    const t = useToast();
    t.toast({ message: "i", tone: "info", timeout: 0 });
    t.toast({ message: "s", tone: "success", timeout: 0 });
    t.toast({ message: "w", tone: "warn", timeout: 0 });
    t.toast({ message: "d", tone: "danger", timeout: 0 });
    await nextTick();
    const names = w.findAllComponents(DsIcon).map((c) => c.props("name"));
    expect(names).toEqual(["info", "check", "warning", "error"]);
  });

  it("double pause (hover + focus) does not over-count elapsed time", async () => {
    const w = mount(DsToastHost);
    useToast().toast({ message: "Churn", timeout: 1000 });
    await nextTick();
    const el = w.find(".ds-toast");
    vi.advanceTimersByTime(600);
    await el.trigger("mouseenter"); // pause: 400ms remains
    await el.trigger("focusin"); // second pause must be a no-op
    vi.advanceTimersByTime(5000);
    expect(w.findAll(".ds-toast")).toHaveLength(1);
    await el.trigger("mouseleave"); // resume with 400ms
    await el.trigger("focusout"); // stray resume must be a no-op
    vi.advanceTimersByTime(399);
    expect(w.findAll(".ds-toast")).toHaveLength(1);
    vi.advanceTimersByTime(1);
    await nextTick();
    expect(w.findAll(".ds-toast")).toHaveLength(0);
  });

  it("pauses auto-dismiss on hover and resumes on leave", async () => {
    const w = mount(DsToastHost);
    useToast().toast({ message: "Hover", timeout: 1000 });
    await nextTick();
    const el = w.find(".ds-toast");
    await el.trigger("mouseenter");
    vi.advanceTimersByTime(5000); // paused: should survive
    expect(w.findAll(".ds-toast")).toHaveLength(1);
    await el.trigger("mouseleave");
    vi.advanceTimersByTime(1000);
    await nextTick();
    expect(w.findAll(".ds-toast")).toHaveLength(0);
  });
});
