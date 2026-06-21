<script setup lang="ts">
defineProps<{ selected?: boolean }>();
</script>
<template><li class="ds-list-item" :class="{ 'is-selected': selected }"><slot /></li></template>
