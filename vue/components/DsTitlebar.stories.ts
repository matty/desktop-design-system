import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsTitlebar from "./DsTitlebar.vue";

const meta: Meta<typeof DsTitlebar> = {
  title: "Shell/DsTitlebar",
  component: DsTitlebar,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsTitlebar>;

export const Default: Story = {
  args: {
    title: "Demo App",
  },
};
