import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsProgress from "./DsProgress.vue";

const meta: Meta<typeof DsProgress> = {
  title: "Display/DsProgress",
  component: DsProgress,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsProgress },
    setup: () => ({ args }),
    template: `<DsProgress v-bind="args" />`
  })
};
export default meta;
type Story = StoryObj<typeof DsProgress>;

export const Default: Story = {
  args: { value: 64 }
};

export const Complete: Story = {
  args: { value: 100 }
};

export const Starting: Story = {
  args: { value: 5 }
};
