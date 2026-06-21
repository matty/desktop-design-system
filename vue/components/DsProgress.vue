<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(defineProps<{ value: number; max?: number }>(), { max: 100 });
const pct = computed(() => Math.max(0, Math.min(100, (props.value / props.max) * 100)));
</script>
<template>
  <div class="ds-progress"><div class="bar" :style="{ width: pct + '%' }"></div></div>
</template>
