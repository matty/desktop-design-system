import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsAvatar from "./DsAvatar.vue";

const PLACEHOLDER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%236366f1'/%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='white'%3EJR%3C/text%3E%3C/svg%3E";

const meta: Meta<typeof DsAvatar> = {
  title: "Display/DsAvatar",
  component: DsAvatar,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "select", options: [undefined, "sm", "lg"] }
  },
  render: (args) => ({
    components: { DsAvatar },
    setup: () => ({ args }),
    template: `<DsAvatar v-bind="args">JR</DsAvatar>`
  })
};
export default meta;
type Story = StoryObj<typeof DsAvatar>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => ({
    components: { DsAvatar },
    template: `<div style="display:flex; gap:12px; align-items:center">
      <DsAvatar size="sm">JR</DsAvatar>
      <DsAvatar>JR</DsAvatar>
      <DsAvatar size="lg">JR</DsAvatar>
    </div>`
  })
};

export const Image: Story = {
  args: {
    src: PLACEHOLDER_SVG,
    alt: "Jane Roe"
  }
};
