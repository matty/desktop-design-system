import type { Preview } from '@storybook/vue3-vite';
import "../src/design-language.css";

const preview: Preview = {
  parameters: {
    a11y: { test: "todo" }, // report-only: surface violations without failing (known deferred backlog)
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } }
  },
  globalTypes: {
    theme: {
      description: "Theme",
      defaultValue: "dark",
      toolbar: { icon: "circlehollow", items: ["dark", "light"], dynamicTitle: true }
    },
    density: {
      description: "Density",
      defaultValue: "comfortable",
      toolbar: { icon: "component", items: ["comfortable", "compact"], dynamicTitle: true }
    }
  },
  decorators: [
    (story, ctx) => ({
      components: { story },
      setup() {
        return { theme: ctx.globals.theme, density: ctx.globals.density };
      },
      template:
        `<div :data-theme="theme" :data-density="density" style="padding:24px; background:var(--bg); color:var(--text)"><story /></div>`
    })
  ]
};

export default preview;
