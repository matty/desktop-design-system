<script setup lang="ts">
defineProps<{ seamless?: boolean }>();
</script>
<template><ul class="ds-list" :class="{ 'is-seamless': seamless }"><slot /></ul></template>
