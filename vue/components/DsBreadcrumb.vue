<script setup lang="ts">
defineProps<{ items: { label: string; href?: string }[] }>();
</script>
<template>
  <nav class="ds-breadcrumb">
    <template v-for="(item, i) in items" :key="i">
      <span v-if="i > 0" class="sep">/</span>
      <span v-if="i === items.length - 1" class="current">{{ item.label }}</span>
      <a v-else :href="item.href">{{ item.label }}</a>
    </template>
  </nav>
</template>
