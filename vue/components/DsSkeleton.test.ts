import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsSkeleton from "./DsSkeleton.vue";
describe("DsSkeleton", () => {
  it("renders .ds-skeleton", () => {
    expect(mount(DsSkeleton).find(".ds-skeleton").exists()).toBe(true);
  });
});
