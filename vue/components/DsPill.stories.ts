import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsPill from "./DsPill.vue";

const meta: Meta<typeof DsPill> = {
  title: "Display/DsPill",
  component: DsPill,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsPill },
    setup: () => ({ args }),
    template: `<DsPill v-bind="args">v2.4.0</DsPill>`
  })
};
export default meta;
type Story = StoryObj<typeof DsPill>;

export const Default: Story = {};
