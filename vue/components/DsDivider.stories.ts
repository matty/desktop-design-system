import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsDivider from "./DsDivider.vue";

const meta: Meta<typeof DsDivider> = {
  title: "Display/DsDivider",
  component: DsDivider,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsDivider>;

export const Default: Story = {
  render: () => ({
    components: { DsDivider },
    template: `<DsDivider />`
  })
};

export const Vertical: Story = {
  render: () => ({
    components: { DsDivider },
    template: `<div style="display:flex;align-items:stretch;height:48px;gap:8px"><span>Left</span><DsDivider :vertical="true" /><span>Right</span></div>`
  })
};

export const Labeled: Story = {
  render: () => ({
    components: { DsDivider },
    template: `<DsDivider label="or" />`
  })
};
