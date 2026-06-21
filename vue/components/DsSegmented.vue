<script setup lang="ts">
defineProps<{ modelValue?: string; options: { value: string; label: string }[] }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();
</script>

<template>
  <div class="ds-segmented" role="group">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      :class="{ 'is-active': modelValue === opt.value }"
      :aria-pressed="modelValue === opt.value"
      @click="emit('update:modelValue', opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
