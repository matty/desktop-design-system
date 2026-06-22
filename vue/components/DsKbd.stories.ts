import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsKbd from "./DsKbd.vue";

const meta: Meta<typeof DsKbd> = {
  title: "Display/DsKbd",
  component: DsKbd,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsKbd },
    setup: () => ({ args }),
    template: `<DsKbd v-bind="args">Ctrl</DsKbd>`
  })
};
export default meta;
type Story = StoryObj<typeof DsKbd>;

export const Default: Story = {};
