import type { StorybookConfig } from '@storybook/vue3-vite';
import vue from '@vitejs/plugin-vue';
import type { UserConfig } from 'vite';

const config: StorybookConfig = {
  stories: ["../vue/**/*.stories.@(ts|js)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y"
  ],
  framework: {
    name: "@storybook/vue3-vite",
    options: { docgen: "vue-component-meta" }
  },
  async viteFinal(config: UserConfig) {
    // Explicitly wire up @vitejs/plugin-vue so rolldown (Vite 8) can
    // parse .vue SFCs in the Storybook preview bundle.
    config.plugins = [vue(), ...(config.plugins ?? [])];
    return config;
  },
};
export default config;
