import type { StorybookConfig } from '@storybook/vue3-vite';
import vue from '@vitejs/plugin-vue';
import type { UserConfig } from 'vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": "@storybook/vue3-vite",
  async viteFinal(config: UserConfig) {
    // Explicitly wire up @vitejs/plugin-vue so rolldown (Vite 8) can
    // parse .vue SFCs in the Storybook preview bundle.
    config.plugins = [vue(), ...(config.plugins ?? [])];
    return config;
  },
};
export default config;
