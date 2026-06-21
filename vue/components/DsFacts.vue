<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{ cols?: number }>();
const classes = computed(() => (props.cols ? { [`cols-${props.cols}`]: true } : {}));
</script>
<template><div class="ds-facts" :class="classes"><slot /></div></template>
