import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsSwitch from "./DsSwitch.vue";

const meta: Meta<typeof DsSwitch> = {
  title: "Form/DsSwitch",
  component: DsSwitch,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsSwitch>;

export const Default: Story = {
  render: () => ({
    components: { DsSwitch },
    setup() {
      const v = ref(false);
      return { v };
    },
    template: `<DsSwitch v-model="v" />`
  })
};
