import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsStage from "./DsStage.vue";

const meta: Meta<typeof DsStage> = {
  title: "Patterns/DsStage",
  component: DsStage,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsStage>;

export const PanelOnGlow: Story = {
  render: () => ({
    components: { DsStage },
    template: `<div style="height:360px; resize:both; overflow:hidden">
      <DsStage>
        <section class="ds-panel" style="width:min(360px,100%)">
          <div class="ds-panel-body">Centered content on the gradient stage.</div>
        </section>
      </DsStage>
    </div>`,
  }),
};
