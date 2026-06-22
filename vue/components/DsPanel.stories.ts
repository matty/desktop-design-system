import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsPanel from "./DsPanel.vue";

const meta: Meta<typeof DsPanel> = {
  title: "Display/DsPanel",
  component: DsPanel,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsPanel },
    setup: () => ({ args }),
    template: `<DsPanel v-bind="args">Panel body content</DsPanel>`
  })
};
export default meta;
type Story = StoryObj<typeof DsPanel>;

export const Default: Story = {
  args: { title: "Sync" }
};

export const WithActions: Story = {
  render: () => ({
    components: { DsPanel },
    template: `<DsPanel title="Sync">
      <template #actions><button type="button">Refresh</button></template>
      Panel body content
    </DsPanel>`
  })
};
