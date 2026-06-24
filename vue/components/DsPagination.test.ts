import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import DsPagination from "./DsPagination.vue";

describe("DsPagination", () => {
  it("renders prev, pages, next and marks the active page", () => {
    const w = mount(DsPagination, { props: { total: 50, pageSize: 10, page: 2 } });
    const active = w.find(".ds-page.is-active");
    expect(active.text()).toBe("2");
    expect(active.attributes("aria-current")).toBe("page");
  });

  it("emits update:page on a page click", async () => {
    const w = mount(DsPagination, { props: { total: 50, pageSize: 10, page: 1 } });
    const pages = w.findAll(".ds-page").filter((b) => b.text() === "3");
    await pages[0].trigger("click");
    expect(w.emitted("update:page")!.at(-1)).toEqual([3]);
  });

  it("disables prev on first and next on last page", () => {
    const first = mount(DsPagination, { props: { total: 30, pageSize: 10, page: 1 } });
    expect(first.findAll(".ds-page")[0].attributes("disabled")).toBeDefined();
    const last = mount(DsPagination, { props: { total: 30, pageSize: 10, page: 3 } });
    const btns = last.findAll(".ds-page");
    expect(btns[btns.length - 1].attributes("disabled")).toBeDefined();
  });

  it("inserts an ellipsis for large page counts", () => {
    const w = mount(DsPagination, { props: { total: 200, pageSize: 10, page: 10 } });
    expect(w.find(".ds-pagination-ellipsis").exists()).toBe(true);
  });
});
