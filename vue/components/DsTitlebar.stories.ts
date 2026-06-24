import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsTitlebar from "./DsTitlebar.vue";

const meta: Meta<typeof DsTitlebar> = {
  title: "Shell/DsTitlebar",
  component: DsTitlebar,
  tags: ["autodocs"],
  argTypes: {
    controls: { control: "object" },
    maximized: { control: "boolean" },
  },
};
export default meta;
type Story = StoryObj<typeof DsTitlebar>;

export const Default: Story = {
  args: { title: "Demo App" },
};

export const MinimalClose: Story = {
  args: { title: "Tool Window", controls: ["close"] },
};

export const Maximized: Story = {
  args: { title: "Demo App", maximized: true },
};

export const WithLeadingAndActions: Story = {
  render: (args) => ({
    components: { DsTitlebar },
    setup: () => ({ args }),
    template: `<DsTitlebar v-bind="args">
      Demo App
      <template #leading><span style="padding:0 12px; font-size:12px; color:var(--text-2)">≡ Menu</span></template>
      <template #actions><div class="ds-winbtns"><button title="Settings" aria-label="Settings"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg></button></div></template>
    </DsTitlebar>`,
  }),
};
