import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsNavItem from "./DsNavItem.vue";

const meta: Meta<typeof DsNavItem> = {
  title: "Shell/DsNavItem",
  component: DsNavItem,
  tags: ["autodocs"],
  argTypes: {
    active: { control: "boolean" },
    href: { control: "text" },
    label: { control: "text" }
  }
};
export default meta;
type Story = StoryObj<typeof DsNavItem>;

export const Default: Story = {
  args: { label: "Nav item", href: "#" }
};

export const Active: Story = {
  args: { label: "Active item", href: "#", active: true }
};
