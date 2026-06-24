import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsDatePicker from "./DsDatePicker.vue";

const meta: Meta<typeof DsDatePicker> = {
  title: "Form/DsDatePicker",
  component: DsDatePicker,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsDatePicker },
    setup: () => { const value = ref(args.modelValue ?? null); return { args, value }; },
    template: `<div style="padding-bottom:300px"><DsDatePicker v-bind="args" :model-value="value" @update:model-value="value = $event" /></div>`
  })
};
export default meta;
type Story = StoryObj<typeof DsDatePicker>;

export const Empty: Story = {};
export const Preselected: Story = { args: { modelValue: "2026-06-15" } };
