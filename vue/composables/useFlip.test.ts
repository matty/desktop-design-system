import { describe, it, expect } from "vitest";
import { computeFlip } from "./useFlip";

const base = { floatW: 180, floatH: 120, vw: 1000, vh: 800, gap: 6, padding: 8 };

describe("computeFlip", () => {
  it("keeps preferred bottom when there is room below", () => {
    const r = computeFlip({ ...base, rect: { top: 100, bottom: 120, left: 100 }, preferred: "bottom" });
    expect(r.placement).toBe("bottom");
    expect(r.left).toBe(0);
  });

  it("flips to top when below is cramped and above has room", () => {
    // trigger near the viewport bottom: roomBelow = 800-780-6 = 14 < floatH 120; roomAbove large
    const r = computeFlip({ ...base, rect: { top: 760, bottom: 780, left: 100 }, preferred: "bottom" });
    expect(r.placement).toBe("top");
  });

  it("keeps preferred top when there is room above", () => {
    const r = computeFlip({ ...base, rect: { top: 400, bottom: 420, left: 100 }, preferred: "top" });
    expect(r.placement).toBe("top");
  });

  it("shifts left when the panel overflows the right edge", () => {
    // 900 + 180 + 8 - 1000 = 88 overflow -> left -88
    const r = computeFlip({ ...base, rect: { top: 100, bottom: 120, left: 900 }, preferred: "bottom" });
    expect(r.left).toBe(-88);
  });

  it("does not shift when the panel fits horizontally", () => {
    const r = computeFlip({ ...base, rect: { top: 100, bottom: 120, left: 100 }, preferred: "bottom" });
    expect(r.left).toBe(0);
  });
});
