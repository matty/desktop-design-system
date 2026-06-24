import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsDrawer from "./DsDrawer.vue";

const meta: Meta<typeof DsDrawer> = {
  title: "Shell/DsDrawer",
  component: DsDrawer,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsDrawer },
    setup: () => { const open = ref(false); return { args, open }; },
    template: `<button class="ds-btn" @click="open = true">Open drawer</button>
      <DsDrawer v-bind="args" :open="open" @update:open="open = $event" title="Filters">
        <p>Drawer body content.</p>
        <template #footer><button class="ds-btn" @click="open = false">Close</button></template>
      </DsDrawer>`
  })
};
export default meta;
type Story = StoryObj<typeof DsDrawer>;

export const Right: Story = { args: { side: "right" } };
export const Left: Story = { args: { side: "left" } };
