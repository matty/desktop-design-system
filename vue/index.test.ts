import { describe, it, expect } from "vitest";
import * as api from "./index";

describe("barrel", () => {
  it("re-exports all composables", () => {
    for (const name of [
      "useDismiss",
      "useFocusTrap",
      "useRovingTabindex",
      "useAnnounce",
      "useToast"
    ]) {
      expect(typeof (api as Record<string, unknown>)[name]).toBe("function");
    }
  });
});
