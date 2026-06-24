<script setup lang="ts">
import { ref } from "vue";
import { useDismiss } from "../composables/useDismiss";

const open = defineModel<boolean>("open", { default: false });
defineProps<{ ariaLabel?: string }>();

const root = ref<HTMLElement | null>(null);
useDismiss({ active: open, root, onDismiss: () => (open.value = false) });

function toggle() {
  open.value = !open.value;
}
</script>

<template>
  <div ref="root" class="ds-popover-anchor" :class="{ 'is-open': open }">
    <button type="button" class="ds-btn" :aria-expanded="open" @click="toggle">
      <slot name="trigger" />
    </button>
    <div v-if="open" class="ds-popover" role="dialog" :aria-label="ariaLabel">
      <slot />
    </div>
  </div>
</template>
