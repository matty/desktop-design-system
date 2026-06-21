<script setup lang="ts">
defineProps<{ vertical?: boolean; label?: string }>();
</script>
<template>
  <div v-if="label" class="ds-divider-label"><slot>{{ label }}</slot></div>
  <hr v-else class="ds-divider" :class="{ 'is-vertical': vertical }" />
</template>
