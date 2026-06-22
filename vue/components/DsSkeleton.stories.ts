import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsSkeleton from "./DsSkeleton.vue";

const meta: Meta<typeof DsSkeleton> = {
  title: "Display/DsSkeleton",
  component: DsSkeleton,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsSkeleton },
    setup: () => ({ args }),
    template: `<DsSkeleton v-bind="args" style="width:200px;height:16px" />`
  })
};
export default meta;
export const Default: StoryObj<typeof DsSkeleton> = {};
