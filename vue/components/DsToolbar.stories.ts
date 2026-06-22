import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsToolbar from "./DsToolbar.vue";
import DsButton from "./DsButton.vue";

const meta: Meta<typeof DsToolbar> = {
  title: "Shell/DsToolbar",
  component: DsToolbar,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsToolbar>;

export const Default: Story = {
  render: () => ({
    components: { DsToolbar, DsButton },
    template: `
      <DsToolbar title="Runs">
        <DsButton size="sm">New run</DsButton>
      </DsToolbar>
    `,
  }),
};
