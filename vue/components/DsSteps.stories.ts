import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsSteps from "./DsSteps.vue";

const steps = [
  { id: "a", label: "Account" },
  { id: "b", label: "Profile" },
  { id: "c", label: "Done" }
];

const meta: Meta<typeof DsSteps> = {
  title: "Display/DsSteps",
  component: DsSteps,
  tags: ["autodocs"],
  args: { steps, current: 1 },
  render: (args) => ({ components: { DsSteps }, setup: () => ({ args }), template: `<DsSteps v-bind="args" />` })
};
export default meta;
type Story = StoryObj<typeof DsSteps>;

export const Default: Story = {};
export const FirstStep: Story = { args: { current: 0 } };
export const Complete: Story = { args: { current: 2 } };
