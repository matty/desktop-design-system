import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsDescriptionList from "./DsDescriptionList.vue";

const meta: Meta<typeof DsDescriptionList> = {
  title: "Display/DsDescriptionList",
  component: DsDescriptionList,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsDescriptionList>;

export const Default: Story = {
  render: () => ({
    components: { DsDescriptionList },
    template: `
      <DsDescriptionList>
        <dt>Author</dt><dd>Matty</dd>
        <dt>License</dt><dd>MIT</dd>
        <dt>Version</dt><dd>1.0.0</dd>
        <dt>Status</dt><dd>Stable</dd>
      </DsDescriptionList>
    `,
  }),
};
