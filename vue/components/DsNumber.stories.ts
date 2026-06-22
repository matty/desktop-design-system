import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsNumber from "./DsNumber.vue";

const meta: Meta<typeof DsNumber> = {
  title: "Form/DsNumber",
  component: DsNumber,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsNumber>;

export const Default: Story = {
  render: () => ({
    components: { DsNumber },
    setup() {
      const v = ref(5);
      return { v };
    },
    template: `<DsNumber v-model="v" :min="0" :max="10" />`
  })
};
