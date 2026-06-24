import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsStage from "./DsStage.vue";

const meta: Meta<typeof DsStage> = {
  title: "Patterns/DsStage",
  component: DsStage,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsStage>;

// The .ptn-stage recipe is full-viewport (min-height:100vh) by design. Inside the
// Storybook canvas that pushes the centered child far below the fold, so the demo
// overrides min-height/height to give the stage a self-contained frame. Attributes
// fall through onto the component's single root .ptn-stage element.
export const PanelOnGlow: Story = {
  render: () => ({
    components: { DsStage },
    template: `<DsStage style="min-height:0; height:420px">
      <section class="ds-panel" style="width:min(360px,100%)">
        <div class="ds-panel-body">Centered content on the gradient stage.</div>
      </section>
    </DsStage>`,
  }),
};
