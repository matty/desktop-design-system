import { ref } from "vue";
import DsSortable from "./DsSortable.vue";

export default {
  title: "Interactive/DsSortable",
  component: DsSortable,
  tags: ["autodocs"]
};

export const Default = {
  render: () => ({
    components: { DsSortable },
    setup() {
      const items = ref([
        { id: "1", label: "Item One" },
        { id: "2", label: "Item Two" },
        { id: "3", label: "Item Three" },
        { id: "4", label: "Item Four" }
      ]);
      return { items };
    },
    template: `
      <DsSortable v-model="items">
        <template #item="{ item }">
          <div class="ds-list-item" style="padding:8px 12px; cursor:grab;">
            {{ item.label }}
          </div>
        </template>
      </DsSortable>
    `
  })
};
