<script setup lang="ts">
defineProps<{ ariaLabel?: string }>();
</script>

<template>
  <div class="ds-btn-group" role="group" :aria-label="ariaLabel"><slot /></div>
</template>
