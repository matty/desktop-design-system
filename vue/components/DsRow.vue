<script setup lang="ts">
defineProps<{ title?: string; description?: string }>();
</script>
<template>
  <div class="ds-row">
    <div class="ds-row-text"><b>{{ title }}</b><span>{{ description }}</span></div>
    <div class="ds-row-control"><slot /></div>
  </div>
</template>
