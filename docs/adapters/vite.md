# Vite Desktop Adapter

## Purpose

Vite is optional. The core design language remains plain CSS and static HTML, but Vite gives desktop apps a reusable dev server and production build for Electron, Tauri, WebView, and browser previews.

## Commands

```bash
npm run dev
npm run build
npm run preview
```

- `dev`: starts the Vite dev server for the documentation app.
- `build`: verifies icons, then writes a static multi-page build to `dist/`.
- `preview`: serves the generated `dist/` folder.

The Vite config uses `base: "./"` so built assets work from custom desktop protocols and file-like origins.

## Reusing The CSS

Use the bundled CSS entry when a desktop app already has Vite:

```js
import "desktop-design-language/css";
```

For static HTML, keep linking files directly:

```html
<link rel="stylesheet" href="./css/tokens.css" />
<link rel="stylesheet" href="./css/base.css" />
<link rel="stylesheet" href="./css/components.css" />
<link rel="stylesheet" href="./css/utilities.css" />
<link rel="stylesheet" href="./css/patterns.css" />
```

## Tauri

Point Tauri at the Vite dev server in development and the built `dist` folder in production:

```json
{
  "build": {
    "devUrl": "http://127.0.0.1:5173",
    "frontendDist": "../dist",
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build"
  }
}
```

## Electron

Use Vite for the renderer. Electron main/preload can stay in the host app or use a separate Electron-specific tool.

```js
const devUrl = process.env.VITE_DEV_SERVER_URL;

if (devUrl) {
  mainWindow.loadURL(devUrl);
} else {
  mainWindow.loadFile("dist/index.html");
}
```

Desktop apps should keep the design language imported in the renderer only; platform code should not depend on the CSS package.
