import type { Meta, StoryObj } from "@storybook/vue3-vite";
import DsMenubar from "./DsMenubar.vue";

const menus = [
  { id: "file", label: "File", items: [ { id: "new", label: "New" }, { id: "open", label: "Open…" }, { id: "s1", separator: true }, { id: "quit", label: "Quit" } ] },
  { id: "edit", label: "Edit", items: [ { id: "undo", label: "Undo" }, { id: "redo", label: "Redo" } ] },
  { id: "view", label: "View", items: [ { id: "zoom", label: "Zoom In" }, { id: "full", label: "Full Screen" } ] }
];

const meta: Meta<typeof DsMenubar> = {
  title: "Shell/DsMenubar",
  component: DsMenubar,
  tags: ["autodocs"],
  args: { menus, ariaLabel: "Main" },
  render: (args) => ({ components: { DsMenubar }, setup: () => ({ args }), template: `<DsMenubar v-bind="args" />` })
};
export default meta;
type Story = StoryObj<typeof DsMenubar>;

export const Default: Story = {};
