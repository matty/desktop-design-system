<script setup lang="ts">
defineProps<{ large?: boolean }>();
</script>
<template><span class="ds-spinner" :class="{ 'is-lg': large }" role="status" aria-label="Loading"></span></template>
