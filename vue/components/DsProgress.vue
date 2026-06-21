<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(defineProps<{ value: number; max?: number }>(), { max: 100 });
const pct = computed(() => (props.max > 0 ? Math.max(0, Math.min(100, (props.value / props.max) * 100)) : 0));
</script>
<template>
  <div class="ds-progress" role="progressbar" :aria-valuenow="value" aria-valuemin="0" :aria-valuemax="max"><div class="bar" :style="{ width: pct + '%' }"></div></div>
</template>
