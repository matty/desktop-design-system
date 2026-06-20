<script setup lang="ts">
import { inject, computed } from "vue";

interface AccordionApi {
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
}

const props = defineProps<{ id: string; title: string }>();
const api = inject<AccordionApi>("dsAccordion");
const open = computed(() => api?.isOpen(props.id) ?? false);
</script>

<template>
  <div class="ds-acc" :class="{ 'is-open': open }">
    <button
      type="button"
      class="ds-acc-head"
      :aria-expanded="open"
      @click="api?.toggle(id)"
    >
      {{ title }}
    </button>
    <div v-if="open" class="ds-acc-body">
      <slot />
    </div>
  </div>
</template>
