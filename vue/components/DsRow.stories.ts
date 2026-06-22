import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsRow from "./DsRow.vue";

const meta: Meta<typeof DsRow> = {
  title: "Display/DsRow",
  component: DsRow,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsRow>;

export const Default: Story = {
  render: () => ({
    components: { DsRow },
    template: `
      <DsRow title="Enable notifications" description="Receive alerts when something changes">
        <span>Toggle</span>
      </DsRow>
    `,
  }),
};
