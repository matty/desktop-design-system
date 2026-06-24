import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsPopover from "./DsPopover.vue";

const meta: Meta<typeof DsPopover> = {
  title: "Interactive/DsPopover",
  component: DsPopover,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsPopover },
    setup: () => ({ args }),
    template: `<div style="padding:40px"><DsPopover v-bind="args"><template #trigger>Options</template><div>Popover content here.</div></DsPopover></div>`
  })
};
export default meta;
type Story = StoryObj<typeof DsPopover>;

export const Default: Story = { args: { ariaLabel: "Options" } };
