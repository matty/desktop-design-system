<script setup lang="ts">
defineProps<{ term: string; value?: string }>();
</script>
<template>
  <div class="ds-fact"><div class="k">{{ term }}</div><div class="v"><slot>{{ value }}</slot></div></div>
</template>
