import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsCard from "./DsCard.vue";

const meta: Meta<typeof DsCard> = {
  title: "Display/DsCard",
  component: DsCard,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsCard },
    setup: () => ({ args }),
    template: `<DsCard v-bind="args">Card body</DsCard>`
  })
};
export default meta;
type Story = StoryObj<typeof DsCard>;

export const Default: Story = {};
