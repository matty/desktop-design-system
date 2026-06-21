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
  <details class="ds-acc" :open="open">
    <summary
      @click.prevent="api?.toggle(id)"
    >
      {{ title }}<span class="chev"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 18l6-6l-6-6"/></svg></span>
    </summary>
    <div class="ds-acc-body">
      <slot />
    </div>
  </details>
</template>
