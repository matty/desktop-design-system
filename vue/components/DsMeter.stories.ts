import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsMeter from "./DsMeter.vue";

const meta: Meta<typeof DsMeter> = {
  title: "Display/DsMeter",
  component: DsMeter,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsMeter },
    setup: () => ({ args }),
    template: `<DsMeter v-bind="args" />`
  })
};
export default meta;
type Story = StoryObj<typeof DsMeter>;

export const Default: Story = {
  args: { value: 30, max: 60, label: "CPU" }
};

export const Full: Story = {
  args: { value: 100, max: 100, label: "Memory" }
};

export const Low: Story = {
  args: { value: 10, max: 100, label: "Disk" }
};
