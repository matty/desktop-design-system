import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsDescriptionList from "./DsDescriptionList.vue";
describe("DsDescriptionList", () => {
  it("renders dl.ds-dl with slot", () => {
    const w = mount(DsDescriptionList, { slots: { default: () => [h("dt", "K"), h("dd", "V")] } });
    expect(w.find("dl.ds-dl dt").text()).toBe("K");
  });
});
