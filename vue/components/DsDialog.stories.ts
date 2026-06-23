import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import DsDialog from "./DsDialog.vue";
import DsButton from "./DsButton.vue";

const meta: Meta<typeof DsDialog> = {
  title: "Interactive/DsDialog",
  component: DsDialog,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsDialog>;

export const Default: Story = {
  render: () => ({
    components: { DsDialog, DsButton },
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div>
        <DsButton variant="primary" @click="open = true">Open dialog</DsButton>
        <DsDialog v-model:open="open" title="Confirm deletion">
          <p>Are you sure you want to delete this item? This action cannot be undone.</p>
          <template #foot="{ close }">
            <DsButton @click="close">Cancel</DsButton>
            <DsButton variant="danger" @click="close">Delete</DsButton>
          </template>
        </DsDialog>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // Click the trigger button
    await userEvent.click(c.getByRole("button", { name: /open dialog/i }));
    // Dialog is teleported to body — query via document.body
    const body = within(document.body);
    await expect(body.getByRole("dialog")).toBeInTheDocument();
    // Press Escape to close
    await userEvent.keyboard("{Escape}");
    await expect(body.queryByRole("dialog")).toBeNull();
  }
};
