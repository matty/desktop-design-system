<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ modelValue?: number; min?: number; max?: number; step?: number; disabled?: boolean; name?: string }>(),
  { min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY, step: 1, disabled: false }
);
const emit = defineEmits<{ "update:modelValue": [number] }>();

function clamp(n: number): number {
  return Math.min(props.max, Math.max(props.min, n));
}
function bump(dir: 1 | -1) {
  emit("update:modelValue", clamp((props.modelValue ?? 0) + dir * props.step));
}
function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  if (raw.trim() === "") return;
  const n = Number(raw);
  if (!Number.isNaN(n)) emit("update:modelValue", clamp(n));
}

const atMax = computed(() => (props.modelValue ?? 0) >= props.max);
const atMin = computed(() => (props.modelValue ?? 0) <= props.min);
</script>

<template>
  <div class="ds-number">
    <input
      type="text"
      inputmode="numeric"
      :value="modelValue"
      :name="name"
      :disabled="disabled || undefined"
      @input="onInput"
    />
    <div class="ds-step">
      <button type="button" aria-label="Increment" :disabled="disabled || atMax || undefined" @click="bump(1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m18 15l-6-6l-6 6"/></svg>
      </button>
      <button type="button" aria-label="Decrement" :disabled="disabled || atMin || undefined" @click="bump(-1)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m6 9l6 6l6-6"/></svg>
      </button>
    </div>
  </div>
</template>
