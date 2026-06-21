<script setup lang="ts">
import { ref, watch } from "vue";

const props = withDefaults(
  defineProps<{ modelValue?: number; min?: number; max?: number; step?: number; disabled?: boolean }>(),
  { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY, step: 1, disabled: false }
);
const emit = defineEmits<{ "update:modelValue": [number] }>();

const inner = ref(props.modelValue ?? 0);
watch(() => props.modelValue, (v) => { if (v !== undefined) inner.value = v; });

function clamp(n: number): number {
  return Math.min(props.max, Math.max(props.min, n));
}
function bump(dir: 1 | -1) {
  const next = clamp(inner.value + dir * props.step);
  inner.value = next;
  emit("update:modelValue", next);
}
function onInput(e: Event) {
  const n = Number((e.target as HTMLInputElement).value);
  if (!Number.isNaN(n)) { inner.value = n; emit("update:modelValue", n); }
}
</script>

<template>
  <div class="ds-number">
    <input type="text" :value="inner" :disabled="disabled || undefined" @input="onInput" />
    <div class="ds-step">
      <button type="button" :disabled="disabled || undefined" @click="bump(1)">
        <svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m18 15l-6-6l-6 6"/></svg>
      </button>
      <button type="button" :disabled="disabled || undefined" @click="bump(-1)">
        <svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9l6 6l6-6"/></svg>
      </button>
    </div>
  </div>
</template>
