<script setup lang="ts">
import { computed, useId } from "vue";
import type { OptionItem } from "../types";

const props = defineProps<{
  modelValue?: string;
  options: OptionItem[];
  disabled?: boolean;
  name?: string;
  ariaLabel?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [string] }>();
const generatedName = useId();
const groupName = computed(() => props.name ?? generatedName);
</script>

<template>
  <div class="ds-radio-group" role="radiogroup" :aria-label="ariaLabel">
    <label v-for="opt in options" :key="opt.value" class="ds-radio">
      <input
        type="radio"
        :name="groupName"
        :value="opt.value"
        :checked="modelValue === opt.value"
        :disabled="disabled || opt.disabled || undefined"
        @change="emit('update:modelValue', opt.value)"
      />
      {{ opt.label }}
    </label>
  </div>
</template>
