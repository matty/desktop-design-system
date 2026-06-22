import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsRadioGroup from "./DsRadioGroup.vue";

const meta: Meta<typeof DsRadioGroup> = {
  title: "Form/DsRadioGroup",
  component: DsRadioGroup,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsRadioGroup>;

export const Default: Story = {
  render: () => ({
    components: { DsRadioGroup },
    setup() {
      const v = ref("light");
      const options = [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" }
      ];
      return { v, options };
    },
    template: `<DsRadioGroup v-model="v" :options="options" />`
  })
};
