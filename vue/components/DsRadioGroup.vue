<script setup lang="ts">
import { useId } from "vue";

defineProps<{ modelValue?: string; options: { value: string; label: string }[]; disabled?: boolean; ariaLabel?: string }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();
const name = useId();
</script>

<template>
  <div class="ds-radio-group" role="radiogroup" :aria-label="ariaLabel">
    <label v-for="opt in options" :key="opt.value" class="ds-radio">
      <input
        type="radio"
        :name="name"
        :value="opt.value"
        :checked="modelValue === opt.value"
        :disabled="disabled || undefined"
        @change="emit('update:modelValue', opt.value)"
      />
      {{ opt.label }}
    </label>
  </div>
</template>
