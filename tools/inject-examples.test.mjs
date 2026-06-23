import { describe, it, expect } from "vitest";
import { transformExamples, escapeHtml, collapseSvgs } from "./inject-examples.mjs";

describe("escapeHtml", () => {
  it("escapes &, <, >", () => {
    expect(escapeHtml(`<div class="x">a & b</div>`)).toBe(`&lt;div class="x"&gt;a &amp; b&lt;/div&gt;`);
  });
});

describe("collapseSvgs", () => {
  it("replaces svg content with an icon placeholder", () => {
    expect(collapseSvgs(`<span><svg viewBox="0 0 24 24"><path d="M1 1"/></svg></span>`))
      .toBe(`<span><svg><!-- icon --></svg></span>`);
  });
  it("collapses multiple svgs", () => {
    expect(collapseSvgs(`<svg><path/></svg>x<svg><g/></svg>`))
      .toBe(`<svg><!-- icon --></svg>x<svg><!-- icon --></svg>`);
  });
});

describe("transformExamples", () => {
  it("wraps a plain example with Preview + HTML tabs (no Vue)", () => {
    const html = `<div class="example"><div class="example-preview"><button class="ds-btn">Go</button></div><div class="example-caption">A button</div></div>`;
    const out = transformExamples(html);
    expect(out).toContain("example has-code");
    expect(out).toContain(`data-panel="preview"`);
    expect(out).toContain(`data-panel="html"`);
    expect(out).not.toContain(`data-panel="vue"`);
    // HTML panel contains the escaped preview markup
    expect(out).toContain(`&lt;button class="ds-btn"&gt;Go&lt;/button&gt;`);
    // live preview markup is preserved unescaped
    expect(out).toContain(`<button class="ds-btn">Go</button>`);
    // caption preserved
    expect(out).toContain("A button");
    // a copy button exists
    expect(out).toContain("example-copy");
  });

  it("adds a Vue tab and removes the template when data-vue is present", () => {
    const html = `<div class="example"><div class="example-preview"><div class="ds-combo">x</div></div><template data-vue>
<DsCombobox v-model="v" :options="opts" />
</template><div class="example-caption">Combo</div></div>`;
    const out = transformExamples(html);
    expect(out).toContain(`data-panel="vue"`);
    // vue snippet escaped and trimmed
    expect(out).toContain(`&lt;DsCombobox v-model="v" :options="opts" /&gt;`);
    // the raw <template data-vue> must NOT leak into output
    expect(out).not.toContain("data-vue");
    expect(out).not.toContain("<template");
  });

  it("collapses svgs in the HTML panel but not in the live preview", () => {
    const html = `<div class="example"><div class="example-preview"><span class="ds-adorn"><svg viewBox="0 0 24 24"><path d="M1 1"/></svg></span></div><div class="example-caption">Icon</div></div>`;
    const out = transformExamples(html);
    // preview keeps the real path
    expect(out).toContain(`<path d="M1 1"/>`);
    // HTML panel has the collapsed, escaped form
    expect(out).toContain(`&lt;svg&gt;&lt;!-- icon --&gt;&lt;/svg&gt;`);
  });

  it("is idempotent — skips an example already marked has-code", () => {
    const html = `<div class="example has-code"><div class="example-tabs"></div></div>`;
    expect(transformExamples(html)).toBe(html);
  });

  it("leaves a div without an example-preview untouched", () => {
    const html = `<div class="example"><div class="not-a-preview">x</div></div>`;
    const out = transformExamples(html);
    expect(out).not.toContain("has-code");
  });

  it("processes TWO sibling .example blocks independently without bleed", () => {
    const html =
      `<div class="example"><div class="example-preview"><button class="ds-btn">A</button></div></div>` +
      `<div class="example"><div class="example-preview"><button class="ds-btn">B</button></div></div>`;
    const out = transformExamples(html);
    // Both become has-code
    const matches = [...out.matchAll(/example has-code/g)];
    expect(matches).toHaveLength(2);
    // Each gets its own HTML panel div (plus one tab button per block = 4 total data-panel="html" strings)
    // Verify via the panel divs specifically
    const panelDivMatches = [...out.matchAll(/class="example-panel"[^>]*data-panel="html"/g)];
    expect(panelDivMatches).toHaveLength(2);
    // First block's markup doesn't bleed into second and vice versa
    // The escaped button texts appear separately — "A" and "B" are each in their own panel
    const htmlPanelA = out.indexOf(`&lt;button class="ds-btn"&gt;A&lt;/button&gt;`);
    const htmlPanelB = out.indexOf(`&lt;button class="ds-btn"&gt;B&lt;/button&gt;`);
    expect(htmlPanelA).toBeGreaterThan(-1);
    expect(htmlPanelB).toBeGreaterThan(-1);
    // They are in separate panels, not merged
    expect(htmlPanelA).not.toBe(htmlPanelB);
  });

  it("handles nested <template #slot> inside data-vue without truncating at inner close tag", () => {
    const html =
      `<div class="example">` +
        `<div class="example-preview"><div class="ds-splitter">x</div></div>` +
        `<template data-vue>\n` +
          `<DsSplitter>\n` +
            `<template #left>Left content</template>\n` +
            `<template #right>Right content</template>\n` +
          `</DsSplitter>\n` +
        `</template>` +
      `</div>`;
    const out = transformExamples(html);
    expect(out).toContain(`data-panel="vue"`);
    // Vue panel must contain the FULL inner markup including nested templates
    expect(out).toContain(`&lt;DsSplitter&gt;`);
    expect(out).toContain(`&lt;template #left&gt;Left content&lt;/template&gt;`);
    expect(out).toContain(`&lt;template #right&gt;Right content&lt;/template&gt;`);
    expect(out).toContain(`&lt;/DsSplitter&gt;`);
    // The outer data-vue template must not leak
    expect(out).not.toContain("data-vue");
    expect(out).not.toContain("<template");
  });

  it("skips nested .example nodes — only top-level ones are processed", () => {
    const inner = `<div class="example"><div class="example-preview"><span>inner</span></div></div>`;
    const html = `<div class="example"><div class="example-preview"><div>outer${inner}</div></div></div>`;
    const out = transformExamples(html);
    // Exactly one has-code (the outer one)
    const matches = [...out.matchAll(/example has-code/g)];
    expect(matches).toHaveLength(1);
  });

  it("example with svg in preview AND data-vue: svg collapsed in HTML panel, real svg in preview, Vue panel present", () => {
    const html =
      `<div class="example">` +
        `<div class="example-preview">` +
          `<span class="ds-icon"><svg viewBox="0 0 24 24"><path d="M1 1"/></svg></span>` +
        `</div>` +
        `<template data-vue>\n<DsIcon name="check" />\n</template>` +
      `</div>`;
    const out = transformExamples(html);
    // Real svg preserved in preview
    expect(out).toContain(`<path d="M1 1"/>`);
    // Svg collapsed and escaped in HTML panel
    expect(out).toContain(`&lt;svg&gt;&lt;!-- icon --&gt;&lt;/svg&gt;`);
    // Vue panel present with the snippet
    expect(out).toContain(`data-panel="vue"`);
    expect(out).toContain(`&lt;DsIcon name="check" /&gt;`);
  });
});
