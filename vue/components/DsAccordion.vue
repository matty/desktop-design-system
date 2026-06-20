<script setup lang="ts">
import { provide } from "vue";

const props = withDefaults(
  defineProps<{ modelValue: string | string[]; multiple?: boolean }>(),
  { multiple: false }
);
const emit = defineEmits<{ "update:modelValue": [string | string[]] }>();

function isOpen(id: string): boolean {
  return Array.isArray(props.modelValue)
    ? props.modelValue.includes(id)
    : props.modelValue === id;
}
function toggle(id: string): void {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : [];
    const set = new Set(current);
    set.has(id) ? set.delete(id) : set.add(id);
    emit("update:modelValue", [...set]);
  } else {
    emit("update:modelValue", props.modelValue === id ? "" : id);
  }
}

provide("dsAccordion", { isOpen, toggle });
</script>

<template>
  <div class="ds-accordion">
    <slot />
  </div>
</template>
