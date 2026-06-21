<script setup lang="ts">
defineProps<{ title?: string }>();
</script>
<template>
  <div class="ds-toolbar">
    <div v-if="title || $slots.start" class="ds-toolbar-title"><slot name="start">{{ title }}</slot></div>
    <div class="ds-toolbar-spacer"></div>
    <slot />
  </div>
</template>
