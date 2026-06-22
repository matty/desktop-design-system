import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsBreadcrumb from "./DsBreadcrumb.vue";

const meta: Meta<typeof DsBreadcrumb> = {
  title: "Shell/DsBreadcrumb",
  component: DsBreadcrumb,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsBreadcrumb>;

export const Default: Story = {
  args: {
    items: [
      { label: "Library", href: "#" },
      { label: "Games", href: "#" },
      { label: "Elden Ring" },
    ],
  },
};
