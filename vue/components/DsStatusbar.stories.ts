import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsStatusbar from "./DsStatusbar.vue";

const meta: Meta<typeof DsStatusbar> = {
  title: "Shell/DsStatusbar",
  component: DsStatusbar,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsStatusbar>;

export const Default: Story = {
  render: () => ({
    components: { DsStatusbar },
    template: `
      <DsStatusbar>
        <template #start>
          <span class="seg">Ready</span>
          <span class="seg">Branch: main</span>
        </template>
        <template #end>
          <span class="seg">UTF-8</span>
          <span class="seg">Ln 42, Col 8</span>
        </template>
      </DsStatusbar>
    `,
  }),
};
