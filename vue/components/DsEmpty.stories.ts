import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsEmpty from "./DsEmpty.vue";

const meta: Meta<typeof DsEmpty> = {
  title: "Display/DsEmpty",
  component: DsEmpty,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsEmpty },
    setup: () => ({ args }),
    template: `<DsEmpty v-bind="args">Nothing here yet</DsEmpty>`
  })
};
export default meta;
export const Default: StoryObj<typeof DsEmpty> = {};
