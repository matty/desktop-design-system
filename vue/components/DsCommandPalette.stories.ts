import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsCommandPalette from "./DsCommandPalette.vue";

const commands = [
  { id: "new", label: "New File", hint: "Ctrl+N" },
  { id: "open", label: "Open Folder…" },
  { id: "save", label: "Save All", hint: "Ctrl+S" },
  { id: "find", label: "Find in Files", hint: "Ctrl+Shift+F" }
];

const meta: Meta<typeof DsCommandPalette> = {
  title: "Interactive/DsCommandPalette",
  component: DsCommandPalette,
  tags: ["autodocs"],
  render: (args) => ({
    components: { DsCommandPalette },
    setup: () => { const open = ref(false); return { args, open, commands }; },
    template: `<button class="ds-btn" @click="open = true">Open palette (⌘K)</button>
      <DsCommandPalette v-bind="args" :open="open" :commands="commands" @update:open="open = $event" @select="open = false" />`
  })
};
export default meta;
type Story = StoryObj<typeof DsCommandPalette>;

export const Default: Story = {};
