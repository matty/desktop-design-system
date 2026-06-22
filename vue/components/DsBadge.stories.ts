import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsBadge from "./DsBadge.vue";

const meta: Meta<typeof DsBadge> = {
  title: "Display/DsBadge",
  component: DsBadge,
  tags: ["autodocs"],
  argTypes: {
    tone: { control: "select", options: [undefined, "info", "success", "warning", "danger"] }
  },
  render: (args) => ({
    components: { DsBadge },
    setup: () => ({ args }),
    template: `<DsBadge v-bind="args">Badge</DsBadge>`
  })
};
export default meta;
type Story = StoryObj<typeof DsBadge>;

export const Default: Story = {};
export const Danger: Story = { args: { tone: "danger" } };
export const Solid: Story = { args: { solid: true } };
