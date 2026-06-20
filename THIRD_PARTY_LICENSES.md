# Third-Party Licenses

## Icons

This repository uses Iconify as an icon catalog and the Lucide icon collection as the default source for icon names and SVG data.

- Iconify project: https://github.com/iconify/iconify
- Lucide project: https://github.com/lucide-icons/lucide
- Lucide license: ISC

Icons are bundled as static local SVG data. Runtime use must not fetch icons from Iconify's hosted API unless an application explicitly opts into that behavior.

## SortableJS

- Name: SortableJS
- Version: 1.15.6
- License: MIT
- Source: https://github.com/SortableJS/Sortable
- Vendored at: js/vendor/sortable.min.js

SortableJS is vendored as a static file so the design language works on raw `file://` without a network request. Do not modify `sortable.min.js`.

## Fonts

- **Sora** — SIL Open Font License 1.1. Full text: `assets/fonts/Sora-OFL.txt`.
- **JetBrains Mono** — SIL Open Font License 1.1. Full text: `assets/fonts/JetBrainsMono-OFL.txt`.

Self-hosted as variable woff2 in `assets/fonts/`. Subsetting is permitted under the OFL;
Reserved Font Names are not reused.
