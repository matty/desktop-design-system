import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsInput from "./DsInput.vue";

const meta: Meta<typeof DsInput> = {
  title: "Form/DsInput",
  component: DsInput,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsInput>;

export const Default: Story = {
  render: () => ({
    components: { DsInput },
    setup() {
      const v = ref("");
      return { v };
    },
    template: `<DsInput v-model="v" placeholder="Type something…" style="width:240px" />`
  })
};

export const Invalid: Story = {
  render: () => ({
    components: { DsInput },
    setup() {
      const v = ref("bad value");
      return { v };
    },
    template: `<DsInput v-model="v" :invalid="true" style="width:240px" />`
  })
};

export const Mono: Story = {
  render: () => ({
    components: { DsInput },
    setup() {
      const v = ref("monospace text");
      return { v };
    },
    template: `<DsInput v-model="v" :mono="true" style="width:240px" />`
  })
};
