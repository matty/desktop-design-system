import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { expect, userEvent, within } from "storybook/test";
import { ref } from "vue";
import DsAccordion from "./DsAccordion.vue";
import DsAccordionItem from "./DsAccordionItem.vue";

const meta: Meta<typeof DsAccordion> = {
  title: "Interactive/DsAccordion",
  component: DsAccordion,
  tags: ["autodocs"]
};
export default meta;
type Story = StoryObj<typeof DsAccordion>;

export const Single: Story = {
  render: () => ({
    components: { DsAccordion, DsAccordionItem },
    setup() {
      const open = ref("item1");
      return { open };
    },
    template: `
      <DsAccordion v-model="open">
        <DsAccordionItem id="item1" title="Section One">
          <p style="padding:8px 0">Content for section one.</p>
        </DsAccordionItem>
        <DsAccordionItem id="item2" title="Section Two">
          <p style="padding:8px 0">Content for section two.</p>
        </DsAccordionItem>
        <DsAccordionItem id="item3" title="Section Three">
          <p style="padding:8px 0">Content for section three.</p>
        </DsAccordionItem>
      </DsAccordion>
    `
  }),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    // item1 starts open; click "Section Two" summary to open it
    // (single mode closes item1 and opens item2)
    await userEvent.click(c.getByText("Section Two"));
    // The <details> for item2 should now have the open attribute
    const item2Details = canvasElement.querySelectorAll("details")[1];
    await expect(item2Details).toHaveAttribute("open");
  }
};

export const Multiple: Story = {
  render: () => ({
    components: { DsAccordion, DsAccordionItem },
    setup() {
      const open = ref<string[]>(["item1"]);
      return { open };
    },
    template: `
      <DsAccordion v-model="open" multiple>
        <DsAccordionItem id="item1" title="Section One">
          <p style="padding:8px 0">Content for section one.</p>
        </DsAccordionItem>
        <DsAccordionItem id="item2" title="Section Two">
          <p style="padding:8px 0">Content for section two.</p>
        </DsAccordionItem>
        <DsAccordionItem id="item3" title="Section Three">
          <p style="padding:8px 0">Content for section three.</p>
        </DsAccordionItem>
      </DsAccordion>
    `
  })
};
