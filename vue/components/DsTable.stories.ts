import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsTable from "./DsTable.vue";

const meta: Meta<typeof DsTable> = {
  title: "Display/DsTable",
  component: DsTable,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsTable>;

export const Default: Story = {
  render: () => ({
    components: { DsTable },
    template: `
      <DsTable>
        <thead>
          <tr><th>Name</th><th>Version</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>Storybook</td><td>8.x</td><td>Active</td></tr>
          <tr><td>Vue</td><td>3.x</td><td>Active</td></tr>
          <tr><td>Vite</td><td>5.x</td><td>Active</td></tr>
        </tbody>
      </DsTable>
    `,
  }),
};
