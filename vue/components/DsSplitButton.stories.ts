import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsSplitButton from "./DsSplitButton.vue";

const items = [
  { id: "dup", label: "Duplicate" },
  { id: "exp", label: "Export…" },
  { id: "s1", separator: true },
  { id: "del", label: "Delete", danger: true }
];

const meta: Meta<typeof DsSplitButton> = {
  title: "Interactive/DsSplitButton",
  component: DsSplitButton,
  tags: ["autodocs"],
  args: { label: "Save", items },
  argTypes: { variant: { control: "select", options: [undefined, "primary", "ghost", "danger"] } },
  render: (args) => ({ components: { DsSplitButton }, setup: () => ({ args }), template: `<DsSplitButton v-bind="args" />` })
};
export default meta;
type Story = StoryObj<typeof DsSplitButton>;

export const Default: Story = {};
export const Primary: Story = { args: { variant: "primary" } };
