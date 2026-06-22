import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsCombobox from "./DsCombobox.vue";

const meta: Meta<typeof DsCombobox> = {
  title: "Interactive/DsCombobox",
  component: DsCombobox,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsCombobox>;

const options = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
  { value: "elderberry", label: "Elderberry" }
];

export const Single: Story = {
  render: () => ({
    components: { DsCombobox },
    setup() {
      const value = ref<string | null>(null);
      return { value, options };
    },
    template: `<DsCombobox v-model="value" :options="options" style="width:240px" />`
  })
};

export const Multiple: Story = {
  render: () => ({
    components: { DsCombobox },
    setup() {
      const value = ref<string[]>([]);
      return { value, options };
    },
    template: `<DsCombobox v-model="value" :options="options" multiple style="width:240px" />`
  })
};

export const Filterable: Story = {
  render: () => ({
    components: { DsCombobox },
    setup() {
      const value = ref<string | null>(null);
      return { value, options };
    },
    template: `<DsCombobox v-model="value" :options="options" filterable style="width:240px" />`
  })
};
