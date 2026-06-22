import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsAlert from "./DsAlert.vue";
import DsIcon from "./DsIcon.vue";

const meta: Meta<typeof DsAlert> = {
  title: "Display/DsAlert",
  component: DsAlert,
  tags: ["autodocs"],
  argTypes: {
    tone: { control: "select", options: [undefined, "info", "success", "warning", "danger"] }
  }
};
export default meta;
type Story = StoryObj<typeof DsAlert>;

export const Default: Story = {
  render: (args) => ({
    components: { DsAlert },
    setup: () => ({ args }),
    template: `<DsAlert v-bind="args">This is an informational alert message.</DsAlert>`
  })
};

export const Danger: Story = {
  args: { tone: "danger" },
  render: (args) => ({
    components: { DsAlert },
    setup: () => ({ args }),
    template: `<DsAlert v-bind="args">Something went wrong. Please try again.</DsAlert>`
  })
};

export const Warning: Story = {
  args: { tone: "warning" },
  render: (args) => ({
    components: { DsAlert },
    setup: () => ({ args }),
    template: `<DsAlert v-bind="args">Your session will expire soon.</DsAlert>`
  })
};

export const Success: Story = {
  args: { tone: "success" },
  render: (args) => ({
    components: { DsAlert },
    setup: () => ({ args }),
    template: `<DsAlert v-bind="args">Changes saved successfully.</DsAlert>`
  })
};

export const Dismissible: Story = {
  args: { dismissible: true, tone: "info" },
  render: (args) => ({
    components: { DsAlert },
    setup: () => ({ args }),
    template: `<DsAlert v-bind="args">You can dismiss this alert.</DsAlert>`
  })
};

export const WithIcon: Story = {
  args: { tone: "warning" },
  render: (args) => ({
    components: { DsAlert, DsIcon },
    setup: () => ({ args }),
    template: `<DsAlert v-bind="args"><template #icon><DsIcon name="triangle-alert" /></template>Warning with an icon slot.</DsAlert>`
  })
};
