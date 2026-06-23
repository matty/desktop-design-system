import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
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
  }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // Click the trigger button to open the menu
    await userEvent.click(c.getByRole("button"));
    // Menu renders in-canvas (no teleport); assert a menuitem is visible
    const saveItem = await c.findByRole("menuitem", { name: "Save" });
    await expect(saveItem).toBeInTheDocument();
    // Click the "Save" item — closes the menu
    await userEvent.click(saveItem);
    await expect(c.queryByRole("menuitem", { name: "Save" })).not.toBeInTheDocument();
  }
};
