import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsRail from "./DsRail.vue";
import DsNavItem from "./DsNavItem.vue";

const meta: Meta<typeof DsRail> = {
  title: "Shell/DsRail",
  component: DsRail,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsRail>;

export const Default: Story = {
  render: () => ({
    components: { DsRail, DsNavItem },
    template: `
      <DsRail label="Main navigation">
        <DsNavItem href="#" label="Dashboard" />
        <DsNavItem href="#" label="Library" :active="true" />
        <DsNavItem href="#" label="Settings" />
        <template #bottom>
          <DsNavItem href="#" label="Help" />
        </template>
      </DsRail>
    `,
  }),
};
