import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsField from "./DsField.vue";
import DsInput from "./DsInput.vue";

const meta: Meta<typeof DsField> = {
  title: "Form/DsField",
  component: DsField,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsField>;

export const Default: Story = {
  render: () => ({
    components: { DsField, DsInput },
    setup() {
      const v = ref("");
      return { v };
    },
    template: `<DsField label="Email" hint="We never share it">
      <DsInput v-model="v" placeholder="you@example.com" style="width:240px" />
    </DsField>`
  })
};

export const Error: Story = {
  render: () => ({
    components: { DsField, DsInput },
    setup() {
      const v = ref("");
      return { v };
    },
    template: `<DsField label="Email" :error="'Required'">
      <DsInput v-model="v" placeholder="you@example.com" style="width:240px" />
    </DsField>`
  })
};
