import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsList from "./DsList.vue";
import DsListItem from "./DsListItem.vue";

const meta: Meta<typeof DsList> = {
  title: "Display/DsList",
  component: DsList,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsList>;

export const Default: Story = {
  render: () => ({
    components: { DsList, DsListItem },
    template: `
      <DsList>
        <DsListItem>Inbox</DsListItem>
        <DsListItem :selected="true">Starred</DsListItem>
        <DsListItem>Sent</DsListItem>
        <DsListItem>Archive</DsListItem>
      </DsList>
    `,
  }),
};
