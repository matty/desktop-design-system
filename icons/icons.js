// Render a registry icon by name. Framework-agnostic, zero dependencies.
//   import { iconSvg } from "./icons.js";
//   import registry from "./registry.json" with { type: "json" }; // or fetch it
//   el.innerHTML = iconSvg("home", registry);
// `registry` is the object produced by extend-icons.mjs (has .style and .icons).
export function iconSvg(name, registry, attrs = {}) {
  const entry = registry.icons[name];
  if (!entry) throw new Error(`Unknown icon: ${name}`);
  const s = registry.style;
  const merged = {
    viewBox: s.viewBox,
    fill: s.fill,
    stroke: s.stroke,
    "stroke-linecap": s.strokeLinecap,
    "stroke-linejoin": s.strokeLinejoin,
    "stroke-width": s.strokeWidth,
    ...attrs
  };
  const esc = (v) => String(v)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const attrStr = Object.entries(merged)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(" ");
  return `<svg ${attrStr}>${entry.body}</svg>`;
}

export function createIcon(name, registry, attrs = {}) {
  const tpl = document.createElement("template");
  tpl.innerHTML = iconSvg(name, registry, attrs).trim();
  return tpl.content.firstElementChild;
}

// Global shim for non-module <script> consumers.
if (typeof window !== "undefined") {
  window.dsIcons = { iconSvg, createIcon };
}
