import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsCalendar from "./DsCalendar.vue";

const meta: Meta<typeof DsCalendar> = {
  title: "Form/DsCalendar",
  component: DsCalendar,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsCalendar },
    setup: () => { const value = ref(args.modelValue ?? null); return { args, value }; },
    template: `<DsCalendar v-bind="args" :model-value="value" @update:model-value="value = $event" />`
  })
};
export default meta;
type Story = StoryObj<typeof DsCalendar>;

export const Default: Story = { args: { month: "2026-06" } };
export const WithSelection: Story = { args: { month: "2026-06", modelValue: "2026-06-15" } };
