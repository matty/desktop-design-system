<script setup lang="ts">
defineProps<{ active?: boolean; href?: string; label?: string }>();
</script>
<template>
  <a class="ds-navi" :class="{ 'is-active': active }" :href="href" :aria-current="active ? 'page' : undefined">
    <slot name="icon" />
    <slot>{{ label }}</slot>
  </a>
</template>
