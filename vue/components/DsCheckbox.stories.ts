import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsCheckbox from "./DsCheckbox.vue";

const meta: Meta<typeof DsCheckbox> = {
  title: "Form/DsCheckbox",
  component: DsCheckbox,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsCheckbox>;

export const Default: Story = {
  render: () => ({
    components: { DsCheckbox },
    setup() {
      const v = ref(false);
      return { v };
    },
    template: `<DsCheckbox v-model="v">Remember me</DsCheckbox>`
  })
};
