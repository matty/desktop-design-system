<script setup lang="ts">
import { ref } from "vue";
import type { MenuItem } from "../types";
import { useDismiss } from "../composables/useDismiss";
import { useRovingTabindex } from "../composables/useRovingTabindex";

const props = defineProps<{ items: MenuItem[] }>();
const emit = defineEmits<{ select: [string] }>();

const root = ref<HTMLElement | null>(null);
const menu = ref<HTMLElement | null>(null);
const open = ref(false);

useDismiss({ active: open, root, onDismiss: () => (open.value = false) });
useRovingTabindex(menu, open, {
  selector: ".ds-menu-item",
  onActivate: (el) => el.click()
});

function toggle() {
  open.value = !open.value;
}
function choose(item: MenuItem) {
  if (item.disabled || item.separator) return;
  item.onSelect?.();
  emit("select", item.id);
  open.value = false;
}
</script>

<template>
  <div ref="root" class="ds-dropdown" :class="{ 'is-open': open }">
    <button type="button" class="ds-dropdown-btn" :aria-expanded="open" @click.stop="toggle">
      <slot name="trigger" />
    </button>
    <div v-if="open" ref="menu" class="ds-menu" role="menu">
      <template v-for="item in items" :key="item.id">
        <div v-if="item.separator" class="ds-menu-sep"></div>
        <div
          v-else
          class="ds-menu-item"
          :class="{ 'is-danger': item.danger }"
          role="menuitem"
          tabindex="-1"
          :aria-disabled="item.disabled || undefined"
          @click="choose(item)"
        >
          {{ item.label }}
        </div>
      </template>
    </div>
  </div>
</template>
