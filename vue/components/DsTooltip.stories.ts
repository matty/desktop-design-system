import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsTooltip from "./DsTooltip.vue";

const meta: Meta<typeof DsTooltip> = {
  title: "Display/DsTooltip",
  component: DsTooltip,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsTooltip },
    setup: () => ({ args }),
    template: `<div style="padding:40px"><DsTooltip v-bind="args"><button class="ds-btn">Hover me</button></DsTooltip></div>`
  })
};
export default meta;
type Story = StoryObj<typeof DsTooltip>;

export const Default: Story = { args: { text: "Saves to the cloud" } };
