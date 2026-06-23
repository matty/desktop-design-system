import { parse } from "node-html-parser";

export function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Collapse each <svg>…</svg> to a placeholder (display/copy only).
export function collapseSvgs(s) {
  return s.replace(/<svg[\s\S]*?<\/svg>/g, "<svg><!-- icon --></svg>");
}

// Extract the raw outer HTML of a node from the original source using its
// range property. This preserves self-closing tags (e.g. <path d="…"/>,
// <DsCombobox … />) that node-html-parser would otherwise re-serialize.
function rawOuter(html, node) {
  const [start, end] = node.range;
  return html.slice(start, end);
}

// Extract the raw inner HTML of a node (content between open and close tags).
function rawInner(html, node) {
  const outer = rawOuter(html, node);
  const tagEnd = outer.indexOf(">") + 1;
  const closeTag = `</${node.rawTagName}>`;
  const closeIdx = outer.lastIndexOf(closeTag);
  if (closeIdx === -1) return "";
  return outer.slice(tagEnd, closeIdx);
}

function panel(name, codeEscaped) {
  return `<div class="example-panel" data-panel="${name}"><button class="example-copy" type="button">Copy</button><pre><code>${codeEscaped}</code></pre></div>`;
}

export function transformExamples(html) {
  const root = parse(html, { comment: true });

  // Collect replacements as { start, end, replacement } in reverse order
  // so offsets stay valid as we substitute.
  const replacements = [];

  for (const ex of root.querySelectorAll(".example")) {
    if (ex.classList.contains("has-code")) continue;
    const preview = ex.querySelector(".example-preview");
    if (!preview) continue;

    const tpl = ex.querySelector("template[data-vue]");
    const caption = ex.querySelector(".example-caption");

    // Use raw slicing to preserve self-closing tags and original formatting.
    const previewOuterRaw = rawOuter(html, preview);
    const previewInnerRaw = rawInner(html, preview);
    const htmlCode = escapeHtml(collapseSvgs(previewInnerRaw));
    const vueCode = tpl ? escapeHtml(rawInner(html, tpl).trim()) : null;

    const tabs = [
      `<button class="example-tab is-active" type="button" data-panel="preview">Preview</button>`,
      `<button class="example-tab" type="button" data-panel="html">HTML</button>`,
      vueCode != null ? `<button class="example-tab" type="button" data-panel="vue">Vue</button>` : ""
    ].join("");

    const previewPanel =
      `<div class="example-panel is-active" data-panel="preview">${previewOuterRaw}</div>`;
    const htmlPanel = panel("html", htmlCode);
    const vuePanel = vueCode != null ? panel("vue", vueCode) : "";
    const captionHtml = caption ? rawOuter(html, caption) : "";

    const inner =
      `<div class="example-tabs" role="tablist">${tabs}</div>` +
      previewPanel + htmlPanel + vuePanel + captionHtml;

    const [exStart, exEnd] = ex.range;
    // Rebuild the example tag with has-code class and new inner content.
    // Preserve any extra attributes on the example element beyond class.
    const replacement = `<div class="example has-code">${inner}</div>`;
    replacements.push({ start: exStart, end: exEnd, replacement });
  }

  if (replacements.length === 0) return html;

  // Apply replacements in reverse order to keep earlier offsets valid.
  replacements.sort((a, b) => b.start - a.start);
  let out = html;
  for (const { start, end, replacement } of replacements) {
    out = out.slice(0, start) + replacement + out.slice(end);
  }
  return out;
}
