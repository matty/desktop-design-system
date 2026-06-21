import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsPill from "./DsPill.vue";
describe("DsPill", () => {
  it("renders .ds-pill with slot", () => {
    expect(mount(DsPill, { slots: { default: () => "v1" } }).find(".ds-pill").text()).toBe("v1");
  });
});
