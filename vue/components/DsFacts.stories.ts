import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsFacts from "./DsFacts.vue";
import DsFact from "./DsFact.vue";

const meta: Meta<typeof DsFacts> = {
  title: "Display/DsFacts",
  component: DsFacts,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsFacts>;

export const Default: Story = {
  render: () => ({
    components: { DsFacts, DsFact },
    template: `
      <DsFacts :cols="2">
        <DsFact term="Platform" value="Desktop" />
        <DsFact term="Framework" value="Vue 3" />
        <DsFact term="Build" value="Vite" />
        <DsFact term="Tests" value="147 passing" />
      </DsFacts>
    `,
  }),
};
