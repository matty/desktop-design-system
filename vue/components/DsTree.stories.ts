import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { ref } from "vue";
import DsTree from "./DsTree.vue";

const meta: Meta<typeof DsTree> = {
  title: "Interactive/DsTree",
  component: DsTree,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsTree>;

const nodes = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "components",
        label: "components",
        children: [
          { id: "button", label: "DsButton.vue" },
          { id: "input", label: "DsInput.vue" }
        ]
      },
      { id: "main", label: "main.ts" }
    ]
  },
  { id: "readme", label: "README.md" }
];

export const Default: Story = {
  render: () => ({
    components: { DsTree },
    setup() {
      const selected = ref<string | null>(null);
      const expanded = ref<string[]>(["src"]);
      return { nodes, selected, expanded };
    },
    template: `<DsTree :nodes="nodes" v-model:selected="selected" v-model:expanded="expanded" />`
  })
};
