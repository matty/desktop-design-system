import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsBanner from "./DsBanner.vue";

const meta: Meta<typeof DsBanner> = {
  title: "Display/DsBanner",
  component: DsBanner,
  tags: ["autodocs"],
  argTypes: {
    tone: { control: "select", options: [undefined, "warning"] }
  }
};
export default meta;
type Story = StoryObj<typeof DsBanner>;

export const Default: Story = {
  render: (args) => ({
    components: { DsBanner },
    setup: () => ({ args }),
    template: `<DsBanner v-bind="args">Application maintenance scheduled for Sunday 2 AM.</DsBanner>`
  })
};

export const Warning: Story = {
  args: { tone: "warning" },
  render: (args) => ({
    components: { DsBanner },
    setup: () => ({ args }),
    template: `<DsBanner v-bind="args">Your subscription expires in 3 days.</DsBanner>`
  })
};
