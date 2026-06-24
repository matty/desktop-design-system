<script setup lang="ts">
import { ref, computed } from "vue";
import type { MenuItem } from "../types";
import { useDismiss } from "../composables/useDismiss";

const props = defineProps<{ label: string; items: MenuItem[]; variant?: "primary" | "ghost" | "danger" }>();
const emit = defineEmits<{ click: []; select: [string] }>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
useDismiss({ active: open, root, onDismiss: () => (open.value = false) });

const variantClass = computed(() => (props.variant ? `is-${props.variant}` : ""));

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
  <div ref="root" class="ds-split-btn">
    <button type="button" class="ds-btn" :class="variantClass" @click="emit('click')">{{ label }}</button>
    <button
      type="button"
      class="ds-btn ds-split-caret"
      :class="variantClass"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      aria-label="More actions"
      @click.stop="toggle"
    >▾</button>
    <div v-if="open" class="ds-menu" role="menu" @click.stop>
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
        >{{ item.label }}</div>
      </template>
    </div>
  </div>
</template>
