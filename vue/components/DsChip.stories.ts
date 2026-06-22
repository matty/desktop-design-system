import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsChip from "./DsChip.vue";

const meta: Meta<typeof DsChip> = {
  title: "Display/DsChip",
  component: DsChip,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsChip },
    setup: () => ({ args }),
    template: `<DsChip v-bind="args">Tag</DsChip>`
  })
};
export default meta;
type Story = StoryObj<typeof DsChip>;

export const Default: Story = {};

export const Removable: Story = {
  args: { removable: true }
};
