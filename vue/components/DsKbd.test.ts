import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsKbd from "./DsKbd.vue";
describe("DsKbd", () => {
  it("renders kbd.ds-kbd with slot", () => {
    expect(mount(DsKbd, { slots: { default: () => "Ctrl" } }).find("kbd.ds-kbd").text()).toBe("Ctrl");
  });
});
