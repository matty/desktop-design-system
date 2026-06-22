import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsStatus from "./DsStatus.vue";

const meta: Meta<typeof DsStatus> = {
  title: "Display/DsStatus",
  component: DsStatus,
  tags: ["autodocs"],
  argTypes: {
    state: { control: "select", options: ["on", "off", "busy", "error", "info", "success", "warning"] }
  },
  render: (args) => ({
    components: { DsStatus },
    setup: () => ({ args }),
    template: `<DsStatus v-bind="args"><slot>Online</slot></DsStatus>`
  })
};
export default meta;
type Story = StoryObj<typeof DsStatus>;

export const Default: Story = {
  args: { state: "on" },
  render: (args) => ({
    components: { DsStatus },
    setup: () => ({ args }),
    template: `<DsStatus v-bind="args">Online</DsStatus>`
  })
};

export const AllStates: Story = {
  render: () => ({
    components: { DsStatus },
    template: `<div style="display:flex; flex-direction:column; gap:8px">
      <DsStatus state="on">On</DsStatus>
      <DsStatus state="off">Off</DsStatus>
      <DsStatus state="busy">Busy</DsStatus>
      <DsStatus state="error">Error</DsStatus>
      <DsStatus state="info">Info</DsStatus>
      <DsStatus state="success">Success</DsStatus>
      <DsStatus state="warning">Warning</DsStatus>
    </div>`
  })
};
