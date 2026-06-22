import type { Meta, StoryObj } from "@storybook/vue3-vite";
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
  })
};
