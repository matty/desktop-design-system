<script setup lang="ts">
defineProps<{ modelValue?: boolean; disabled?: boolean; name?: string }>();
const emit = defineEmits<{ "update:modelValue": [boolean] }>();
</script>

<template>
  <label class="ds-switch">
    <input
      type="checkbox"
      :checked="modelValue"
      :name="name"
      :disabled="disabled || undefined"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="ds-track"></span>
  </label>
</template>
