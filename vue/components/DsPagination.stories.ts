import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsPagination from "./DsPagination.vue";

const meta: Meta<typeof DsPagination> = {
  title: "Interactive/DsPagination",
  component: DsPagination,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsPagination },
    setup: () => { const page = ref(args.page ?? 1); return { args, page }; },
    template: `<DsPagination v-bind="args" v-model:page="page" />`
  })
};
export default meta;
type Story = StoryObj<typeof DsPagination>;

export const Default: Story = { args: { total: 50, pageSize: 10, page: 1 } };
export const Many: Story = { args: { total: 200, pageSize: 10, page: 10 } };
