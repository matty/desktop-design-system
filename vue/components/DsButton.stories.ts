import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsButton from "./DsButton.vue";

const meta: Meta<typeof DsButton> = {
  title: "Foundation/DsButton",
  component: DsButton,
  tags: ["autodocs"],
  argTypes: {
    variant: { control: "select", options: [undefined, "primary", "ghost", "danger"] },
    size: { control: "select", options: [undefined, "sm", "lg"] }
  },
  render: (args) => ({
    components: { DsButton },
    setup: () => ({ args }),
    template: `<DsButton v-bind="args">Button</DsButton>`
  })
};
export default meta;
type Story = StoryObj<typeof DsButton>;

export const Default: Story = {};
export const Primary: Story = { args: { variant: "primary" } };
export const Danger: Story = { args: { variant: "danger" } };
export const Sizes: Story = {
  render: () => ({
    components: { DsButton },
    template: `<div style="display:flex; gap:8px; align-items:center">
      <DsButton size="sm">Small</DsButton><DsButton>Default</DsButton><DsButton size="lg">Large</DsButton>
    </div>`
  })
};
