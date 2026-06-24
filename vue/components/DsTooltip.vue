<script setup lang="ts">
// placement is reserved; the ds-tip CSS currently supports top only.
defineProps<{ text: string; placement?: "top" }>();
</script>

<template>
  <span class="ds-tip" :data-tip="text"><slot /></span>
</template>
