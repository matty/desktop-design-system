import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsSlider from "./DsSlider.vue";

const meta: Meta<typeof DsSlider> = {
  title: "Form/DsSlider",
  component: DsSlider,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsSlider>;

export const Default: Story = {
  render: () => ({
    components: { DsSlider },
    setup() {
      const v = ref(50);
      return { v };
    },
    template: `<DsSlider v-model="v" :min="0" :max="100" />`
  })
};
