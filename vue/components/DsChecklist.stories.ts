import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsChecklist from "./DsChecklist.vue";
import type { ChecklistItem } from "../types";

const meta: Meta<typeof DsChecklist> = {
  title: "Feedback/DsChecklist",
  component: DsChecklist,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof DsChecklist>;

const allStates: ChecklistItem[] = [
  { id: "a", title: "Queued", note: "Waiting to start", state: "pending" },
  { id: "b", title: "Scanning", note: "Checking", state: "running" },
  { id: "c", title: "Connected", note: "Ready", state: "ok" },
  { id: "d", title: "No devices", note: "None found", state: "warn" },
  { id: "e", title: "Failed", note: "Unavailable", state: "error" },
];

export const AllStates: Story = {
  render: () => ({
    components: { DsChecklist },
    setup: () => ({ allStates }),
    template: `<div style="width:420px"><DsChecklist :items="allStates" /></div>`,
  }),
};
