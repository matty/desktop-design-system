import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAnnounce } from "./useAnnounce";

describe("useAnnounce", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  it("creates a polite live region and sets the message", () => {
    const { announce } = useAnnounce();
    announce("Saved");
    const region = document.getElementById("ds-live-polite");
    expect(region).not.toBeNull();
    expect(region?.getAttribute("aria-live")).toBe("polite");
    vi.runAllTimers();
    expect(region?.textContent).toBe("Saved");
  });

  it("uses an assertive region when requested", () => {
    const { announce } = useAnnounce();
    announce("Error", { assertive: true });
    expect(document.getElementById("ds-live-assertive")?.getAttribute("aria-live")).toBe("assertive");
  });
});
