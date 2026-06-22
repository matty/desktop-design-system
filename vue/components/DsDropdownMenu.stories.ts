import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsDropdownMenu from "./DsDropdownMenu.vue";

const meta: Meta<typeof DsDropdownMenu> = {
  title: "Interactive/DsDropdownMenu",
  component: DsDropdownMenu,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsDropdownMenu>;

const items = [
  { id: "new", label: "New file" },
  { id: "open", label: "Open…" },
  { id: "sep1", separator: true },
  { id: "save", label: "Save" },
  { id: "saveas", label: "Save as…" },
  { id: "sep2", separator: true },
  { id: "delete", label: "Delete", danger: true }
];

export const Default: Story = {
  render: () => ({
    components: { DsDropdownMenu },
    setup() {
      return { items };
    },
    template: `
      <DsDropdownMenu :items="items">
        <template #trigger>Actions ▾</template>
      </DsDropdownMenu>
    `
  })
};
