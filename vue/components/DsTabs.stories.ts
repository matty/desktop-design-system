import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import DsTabs from "./DsTabs.vue";
import DsTabPanel from "./DsTabPanel.vue";

const meta: Meta<typeof DsTabs> = {
  title: "Interactive/DsTabs",
  component: DsTabs,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsTabs>;

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "Details" },
  { id: "history", label: "History" }
];

export const Default: Story = {
  render: () => ({
    components: { DsTabs, DsTabPanel },
    setup() {
      const active = ref("overview");
      return { active, tabs };
    },
    template: `
      <DsTabs v-model="active" :tabs="tabs">
        <DsTabPanel id="overview">
          <p style="padding:16px">Overview content goes here.</p>
        </DsTabPanel>
        <DsTabPanel id="details">
          <p style="padding:16px">Details content goes here.</p>
        </DsTabPanel>
        <DsTabPanel id="history">
          <p style="padding:16px">History content goes here.</p>
        </DsTabPanel>
      </DsTabs>
    `
  }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // Click the "Details" tab
    await userEvent.click(c.getByRole("tab", { name: "Details" }));
    // That tab should now be selected
    await expect(c.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "true");
    // And its panel content should be visible
    await expect(c.getByText("Details content goes here.")).toBeInTheDocument();
  }
};
