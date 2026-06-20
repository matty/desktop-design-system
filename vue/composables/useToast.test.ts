import { describe, it, expect, vi, beforeEach } from "vitest";
import { useToast } from "./useToast";

describe("useToast", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
    const { toasts, dismiss } = useToast();
    [...toasts].forEach((t) => dismiss(t.id));
  });

  it("adds a toast and returns its id", () => {
    const { toast, toasts } = useToast();
    const id = toast({ message: "Hello" });
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].tone).toBe("info");
  });

  it("auto-dismisses after the timeout", () => {
    const { toast, toasts } = useToast();
    toast({ message: "Bye", timeout: 1000 });
    expect(toasts.length).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(toasts.length).toBe(0);
  });

  it("dismiss removes a specific toast", () => {
    const { toast, dismiss, toasts } = useToast();
    const id = toast({ message: "X", timeout: 0 });
    dismiss(id);
    expect(toasts.length).toBe(0);
  });
});
