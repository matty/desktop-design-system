import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import DsToastHost from "./DsToastHost.vue";
import DsButton from "./DsButton.vue";
import { useToast } from "../composables/useToast";

const meta: Meta<typeof DsToastHost> = {
  title: "Interactive/DsToastHost",
  component: DsToastHost,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsToastHost>;

export const Default: Story = {
  render: () => ({
    components: { DsToastHost, DsButton },
    setup() {
      const { toast } = useToast();
      function showToast() {
        toast({ message: "Saved", tone: "success" });
      }
      return { showToast };
    },
    template: `
      <div>
        <DsButton variant="primary" @click="showToast">Show toast</DsButton>
        <DsToastHost />
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // Click the button to emit a toast
    await userEvent.click(c.getByRole("button", { name: /show toast/i }));
    // DsToastHost renders in-canvas (no Teleport); assert the toast message
    await expect(c.findByText("Saved")).resolves.toBeInTheDocument();
  }
};
