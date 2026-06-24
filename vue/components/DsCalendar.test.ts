import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";

import DsCalendar from "./DsCalendar.vue";

describe("DsCalendar", () => {
  it("renders Monday-first weekday headers and 42 day cells", () => {
    const w = mount(DsCalendar, { props: { month: "2026-06" } });
    expect(w.findAll(".ds-calendar-weekday").map((d) => d.text())).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(w.findAll(".ds-calendar-day")).toHaveLength(42);
  });

  it("shows the correct month title", () => {
    const w = mount(DsCalendar, { props: { month: "2026-06" } });
    expect(w.find(".ds-calendar-title").text()).toBe("June 2026");
  });

  it("places June 1 2026 (a Monday) in the first column", () => {
    // June 1 2026 is a Monday → first cell of the grid is the 1st (not an outside day)
    const w = mount(DsCalendar, { props: { month: "2026-06" } });
    const cells = w.findAll(".ds-calendar-day");
    expect(cells[0].text()).toBe("1");
    expect(cells[0].classes()).not.toContain("is-outside");
  });

  it("marks the selected date", () => {
    const w = mount(DsCalendar, { props: { month: "2026-06", modelValue: "2026-06-15" } });
    const sel = w.find(".ds-calendar-day.is-selected");
    expect(sel.text()).toBe("15");
  });

  it("emits update:modelValue with ISO on day click", async () => {
    const w = mount(DsCalendar, { props: { month: "2026-06" } });
    const cells = w.findAll(".ds-calendar-day");
    await cells[0].trigger("click"); // June 1
    expect(w.emitted("update:modelValue")!.at(-1)).toEqual(["2026-06-01"]);
  });

  it("prev/next change the visible month and emit update:month", async () => {
    const w = mount(DsCalendar, { props: { month: "2026-06" } });
    const navs = w.findAll(".ds-calendar-nav");
    await navs[0].trigger("click"); // prev → May
    expect(w.find(".ds-calendar-title").text()).toBe("May 2026");
    expect(w.emitted("update:month")!.at(-1)).toEqual(["2026-05"]);
    await navs[1].trigger("click"); // next → June
    await navs[1].trigger("click"); // next → July
    expect(w.find(".ds-calendar-title").text()).toBe("July 2026");
  });

  it("marks days from adjacent months as outside", () => {
    // July 2026 starts on a Wednesday → first two cells (Mon, Tue) are from June
    const w = mount(DsCalendar, { props: { month: "2026-07" } });
    const cells = w.findAll(".ds-calendar-day");
    expect(cells[0].classes()).toContain("is-outside");
    expect(cells[0].text()).toBe("29"); // June 29
  });
});
