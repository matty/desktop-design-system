<script setup lang="ts">
import { ref, watchEffect } from "vue";

const props = withDefaults(
  defineProps<{ modelValue?: boolean; disabled?: boolean; indeterminate?: boolean; name?: string }>(),
  { indeterminate: false }
);
const emit = defineEmits<{ "update:modelValue": [boolean] }>();

const input = ref<HTMLInputElement | null>(null);
watchEffect(
  () => {
    if (input.value) input.value.indeterminate = props.indeterminate;
  },
  { flush: "post" }
);
</script>

<template>
  <label class="ds-check">
    <input
      ref="input"
      type="checkbox"
      :checked="modelValue"
      :name="name"
      :disabled="disabled || undefined"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <slot />
  </label>
</template>
