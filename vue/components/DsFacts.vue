<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ cols?: 2 }>();
const classes = computed(() => (props.cols ? { [`is-cols-${props.cols}`]: true } : {}));
</script>
<template><div class="ds-facts" :class="classes"><slot /></div></template>
