import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useToast } from "./useToast";

describe("useToast", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
    const { toasts, dismiss } = useToast();
    [...toasts].forEach((t) => dismiss(t.id));
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("reused id: stale timer from first toast does not remove second toast", () => {
    const { toast, dismiss, toasts } = useToast();
    // raise first toast with explicit id and 1000ms timeout
    toast({ message: "First", id: "my-toast", timeout: 1000 });
    expect(toasts.length).toBe(1);
    // manually dismiss it (cancels the timer)
    dismiss("my-toast");
    expect(toasts.length).toBe(0);
    // raise a new toast with the same id and a longer timeout
    toast({ message: "Second", id: "my-toast", timeout: 5000 });
    expect(toasts.length).toBe(1);
    // advance past the FIRST toast's original timeout — should NOT remove the second
    vi.advanceTimersByTime(1000);
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe("Second");
  });
});
