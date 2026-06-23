import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
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
  }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // "src" starts expanded; "components" is a child that is collapsed.
    // Click the twisty/row for "components" to expand it.
    const componentsRow = await c.findByRole("treeitem", { name: /components/ });
    // Click the twisty span inside the row to toggle expand
    const twisty = componentsRow.querySelector(".ds-tree-twisty") as HTMLElement;
    await userEvent.click(twisty);
    // After expanding, children "DsButton.vue" and "DsInput.vue" should appear
    await expect(c.getByRole("treeitem", { name: /DsButton\.vue/ })).toBeInTheDocument();
  }
};
