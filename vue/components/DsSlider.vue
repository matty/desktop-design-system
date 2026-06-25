<script setup lang="ts">
withDefaults(defineProps<{ modelValue?: number; min?: number; max?: number; step?: number; disabled?: boolean; name?: string }>(), {
  min: 0, max: 100, step: 1, disabled: false
});
const emit = defineEmits<{ "update:modelValue": [number] }>();
</script>

<template>
  <input
    class="ds-slider"
    type="range"
    :min="min"
    :max="max"
    :step="step"
    :value="modelValue"
    :name="name"
    :disabled="disabled || undefined"
    @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
  />
</template>
