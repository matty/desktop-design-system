import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsTextarea from "./DsTextarea.vue";

const meta: Meta<typeof DsTextarea> = {
  title: "Form/DsTextarea",
  component: DsTextarea,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsTextarea>;

export const Default: Story = {
  render: () => ({
    components: { DsTextarea },
    setup() {
      const v = ref("");
      return { v };
    },
    template: `<DsTextarea v-model="v" placeholder="Enter text…" style="width:280px" />`
  })
};

export const Invalid: Story = {
  render: () => ({
    components: { DsTextarea },
    setup() {
      const v = ref("some text");
      return { v };
    },
    template: `<DsTextarea v-model="v" :invalid="true" style="width:280px" />`
  })
};
