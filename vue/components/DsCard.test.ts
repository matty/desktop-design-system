import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsCard from "./DsCard.vue";
describe("DsCard", () => {
  it("renders .ds-card with slot", () => {
    expect(mount(DsCard, { slots: { default: () => "Body" } }).find(".ds-card").text()).toBe("Body");
  });
});
