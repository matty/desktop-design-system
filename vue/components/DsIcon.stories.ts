import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsIcon from "./DsIcon.vue";

const meta: Meta<typeof DsIcon> = {
  title: "Foundation/DsIcon",
  component: DsIcon,
  tags: ["autodocs"],
  argTypes: {
    name: { control: "select", options: ["play", "search", "settings", "home", "check", "close", "delete"] },
    size: { control: "number" }
  },
  render: (args) => ({
    components: { DsIcon },
    setup: () => ({ args }),
    template: `<DsIcon v-bind="args" />`
  })
};
export default meta;
type Story = StoryObj<typeof DsIcon>;

export const Default: Story = {
  args: { name: "settings" }
};

export const Sizes: Story = {
  render: () => ({
    components: { DsIcon },
    template: `<div style="display:flex; gap:12px; align-items:center">
      <DsIcon name="search" :size="12" />
      <DsIcon name="search" :size="16" />
      <DsIcon name="search" :size="20" />
      <DsIcon name="search" :size="24" />
      <DsIcon name="search" :size="32" />
    </div>`
  })
};
