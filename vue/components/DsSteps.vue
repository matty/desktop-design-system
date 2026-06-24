<script setup lang="ts">
import { computed } from "vue";
import type { Step } from "../types";

const props = defineProps<{ steps: Step[]; current: string | number }>();

const activeIndex = computed(() =>
  typeof props.current === "number"
    ? props.current
    : props.steps.findIndex((s) => s.id === props.current)
);

function stepClass(i: number) {
  if (i < activeIndex.value) return "is-complete";
  if (i === activeIndex.value) return "is-active";
  return "";
}
</script>

<template>
  <ol class="ds-steps">
    <li v-for="(step, i) in steps" :key="step.id" class="ds-step-item" :class="stepClass(i)">
      <span class="ds-step-num">{{ i + 1 }}</span>{{ step.label }}
    </li>
  </ol>
</template>
