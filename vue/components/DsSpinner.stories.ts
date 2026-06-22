import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsSpinner from "./DsSpinner.vue";

const meta: Meta<typeof DsSpinner> = {
  title: "Display/DsSpinner",
  component: DsSpinner,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsSpinner },
    setup: () => ({ args }),
    template: `<DsSpinner v-bind="args" />`
  })
};
export default meta;
type Story = StoryObj<typeof DsSpinner>;

export const Default: Story = {};

export const Large: Story = {
  args: { large: true }
};
