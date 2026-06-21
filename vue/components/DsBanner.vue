<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ tone?: "warning" }>();
const classes = computed(() => ({ "is-warning": props.tone === "warning" }));
</script>
<template>
  <div class="ds-banner" :class="classes">
    <span class="ds-banner-ico"><slot name="icon" /></span>
    <slot />
    <span class="ds-banner-spacer"></span>
    <slot name="actions" />
  </div>
</template>
