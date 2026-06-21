<script setup lang="ts">
import { useSlots } from "vue";
const props = defineProps<{ label?: string }>();
const slots = useSlots();
</script>
<template>
  <nav class="ds-rail" :aria-label="props.label ?? 'Navigation'">
    <slot />
    <template v-if="slots.bottom">
      <div class="ds-rail-spacer"></div>
      <slot name="bottom" />
    </template>
  </nav>
</template>
