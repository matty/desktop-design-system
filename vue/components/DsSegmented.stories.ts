import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsSegmented from "./DsSegmented.vue";

const meta: Meta<typeof DsSegmented> = {
  title: "Form/DsSegmented",
  component: DsSegmented,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsSegmented>;

export const Default: Story = {
  render: () => ({
    components: { DsSegmented },
    setup() {
      const v = ref("a");
      const options = [
        { value: "a", label: "A" },
        { value: "b", label: "B" }
      ];
      return { v, options };
    },
    template: `<DsSegmented v-model="v" :options="options" />`
  })
};
