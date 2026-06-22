import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsContextMenu from "./DsContextMenu.vue";

const meta: Meta<typeof DsContextMenu> = {
  title: "Interactive/DsContextMenu",
  component: DsContextMenu,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsContextMenu>;

const items = [
  { id: "open", label: "Open" },
  { id: "rename", label: "Rename" },
  { id: "sep1", separator: true },
  { id: "delete", label: "Delete", danger: true }
];

export const Default: Story = {
  parameters: {
    docs: { description: { story: "Right-click the box to open the context menu." } }
  },
  render: () => ({
    components: { DsContextMenu },
    setup() {
      return { items };
    },
    template: `
      <DsContextMenu :items="items">
        <div class="ds-card" style="padding:32px 48px; text-align:center; user-select:none;">
          Right-click here
        </div>
      </DsContextMenu>
    `
  })
};
