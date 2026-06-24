import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsButtonGroup from "./DsButtonGroup.vue";

const meta: Meta<typeof DsButtonGroup> = {
  title: "Foundation/DsButtonGroup",
  component: DsButtonGroup,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsButtonGroup },
    setup: () => ({ args }),
    template: `<DsButtonGroup v-bind="args"><button class="ds-btn">Left</button><button class="ds-btn">Middle</button><button class="ds-btn">Right</button></DsButtonGroup>`
  })
};
export default meta;
type Story = StoryObj<typeof DsButtonGroup>;

export const Default: Story = {};
export const Labelled: Story = { args: { ariaLabel: "Alignment" } };
