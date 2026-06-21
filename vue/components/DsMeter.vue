<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(defineProps<{ value: number; max?: number; label?: string; display?: string }>(), { max: 100 });
const pct = computed(() => (props.max > 0 ? Math.max(0, Math.min(100, (props.value / props.max) * 100)) : 0));
</script>
<template>
  <div class="ds-meter">
    <span class="name">{{ label }}</span>
    <div class="track"><div class="fill" :style="{ width: pct + '%' }"></div></div>
    <span class="val">{{ display ?? Math.round(pct) + '%' }}</span>
  </div>
</template>
