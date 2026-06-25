<script setup lang="ts">
import type { OptionItem } from "../types";

const props = defineProps<{
  modelValue?: string;
  options: OptionItem[];
  disabled?: boolean;
  ariaLabel?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

function select(opt: OptionItem) {
  if (props.disabled || opt.disabled) return;
  emit("update:modelValue", opt.value);
}
</script>

<template>
  <div class="ds-segmented" role="group" :aria-label="ariaLabel">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :class="{ 'is-active': modelValue === opt.value }"
      :aria-pressed="modelValue === opt.value"
      :disabled="disabled || opt.disabled || undefined"
      @click="select(opt)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
