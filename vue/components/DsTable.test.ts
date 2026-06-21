import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import DsTable from "./DsTable.vue";
describe("DsTable", () => {
  it("renders table.ds-table with slotted rows", () => {
    const w = mount(DsTable, { slots: { default: () => h("tbody", [h("tr", [h("td", "A")])]) } });
    expect(w.find("table.ds-table tbody td").text()).toBe("A");
  });
});
