import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import DsSplitter from "./DsSplitter.vue";

const meta: Meta<typeof DsSplitter> = {
  title: "Interactive/DsSplitter",
  component: DsSplitter,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsSplitter>;

export const Default: Story = {
  render: () => ({
    components: { DsSplitter },
    setup() {
      const size = ref(240);
      return { size };
    },
    template: `
      <div style="height:300px; display:flex; overflow:hidden; border:1px solid var(--ds-border)">
        <DsSplitter v-model:size="size" :min="120" :max="480">
          <template #first>
            <div style="height:100%; padding:16px; background:var(--ds-surface-raised)">
              <strong>Panel A</strong>
              <p>Drag the handle to resize.</p>
            </div>
          </template>
          <template #second>
            <div style="height:100%; padding:16px;">
              <strong>Panel B</strong>
              <p>Secondary content here.</p>
            </div>
          </template>
        </DsSplitter>
      </div>
    `
  }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // Focus the separator and press ArrowRight to grow Panel A by one step (16px).
    // Uses tab-focus then keyboard to avoid click-vs-keydown ordering issues.
    const separator = c.getByRole("separator");
    const initialValue = Number(separator.getAttribute("aria-valuenow"));
    separator.focus();
    await userEvent.keyboard("{ArrowRight}");
    // The separator emits update:size; the story v-model updates aria-valuenow.
    await expect(separator).toHaveAttribute("aria-valuenow", String(initialValue + 16));
  }
};
