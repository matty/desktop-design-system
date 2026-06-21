<script setup lang="ts">
defineProps<{ modelValue?: boolean; disabled?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [boolean] }>();
</script>

<template>
  <label class="ds-switch">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled || undefined"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="ds-track"></span>
  </label>
</template>
